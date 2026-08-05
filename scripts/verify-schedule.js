/* eslint-disable no-console */
/**
 * Quiet Hours window checks. Run with:
 *
 *   node scripts/verify-schedule.js
 *
 * Follows the precedent set by verify-tracking.js: no dependencies, no test
 * runner, and it does NOT re-implement what it tests. It reads utils/schedule.ts,
 * lifts the real function bodies out, strips the type annotations from their
 * signatures and evaluates them. A copied-out implementation drifts from the
 * shipped one and silently stops testing anything.
 *
 * Covered:
 *   1. isWithinWindow — including the midnight wrap, which is the normal case
 *      here rather than the edge case (the default window is 22:00–02:00).
 *   2. nextBoundary — exact ms to the next state flip, and that it lands on the
 *      right LOCAL hour across a daylight-saving change in any timezone.
 *   3. windowLengthHours and suggestWindow, including the degenerate windows
 *      that must resolve to "never active" rather than "always active".
 */

const fs = require('fs');
const path = require('path');

const SCHEDULE_TS = path.join(__dirname, '..', 'utils', 'schedule.ts');

// ---------------------------------------------------------------------------
// Loading the real source
// ---------------------------------------------------------------------------

/** Index just past the brace/paren matching the opener at `open`. */
function matchDelimiter(src, open, openCh, closeCh) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === openCh) depth++;
    else if (src[i] === closeCh) {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error(`unbalanced ${openCh}${closeCh} from index ${open}`);
}

/**
 * Pull `function NAME(...) {...}` out of TS source as plain JS.
 * Only the signature is rewritten; the body is taken verbatim, so this is only
 * valid for functions whose bodies carry no type annotations. Asserted below.
 */
function extractFunction(src, name) {
  const decl = new RegExp(`(?:export\\s+)?function\\s+${name}\\s*\\(`);
  const m = decl.exec(src);
  if (!m) throw new Error(`could not find function ${name} in utils/schedule.ts`);

  const parenOpen = src.indexOf('(', m.index);
  const parenClose = matchDelimiter(src, parenOpen, '(', ')');
  const braceOpen = src.indexOf('{', parenClose);
  const braceClose = matchDelimiter(src, braceOpen, '{', '}');

  const params = src
    .slice(parenOpen + 1, parenClose)
    .split(',')
    .map((p) => p.split(':')[0].trim())
    .filter(Boolean);

  const body = src.slice(braceOpen, braceClose + 1);
  if (/:\s*(string|number|boolean|Date|QuietWindow|WindowSeed)\b/.test(body)) {
    throw new Error(`body of ${name} contains type annotations; extractor needs updating`);
  }
  return `function ${name}(${params.join(', ')}) ${body}`;
}

function loadSchedule() {
  const src = fs.readFileSync(SCHEDULE_TS, 'utf8');
  const names = [
    'normHour',
    'isWithinWindow',
    'msUntilHour',
    'nextBoundary',
    'windowLengthHours',
    'suggestWindow',
  ];
  // Read the clamp from source rather than hardcoding it, so a change shows up here.
  const maxMatch = /export const MAX_WINDOW_HOURS\s*=\s*([0-9]+)/.exec(src);
  if (!maxMatch) throw new Error('could not find MAX_WINDOW_HOURS in utils/schedule.ts');
  const maxWindowHours = Number(maxMatch[1]);

  // `suggestWindow`'s body closes over MAX_WINDOW_HOURS, so the constant has to
  // be declared inside the sandbox as well — still read from source, not typed
  // in twice.
  const code = [
    `const MAX_WINDOW_HOURS = ${maxWindowHours};`,
    ...names.map((n) => extractFunction(src, n)),
  ].join('\n\n');

  // eslint-disable-next-line no-new-func
  const factory = new Function(`${code}\nreturn { ${names.join(', ')} };`);
  return { ...factory(), MAX_WINDOW_HOURS: maxWindowHours };
}

const {
  isWithinWindow,
  nextBoundary,
  windowLengthHours,
  suggestWindow,
  MAX_WINDOW_HOURS,
} = loadSchedule();

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let passed = 0;
const failures = [];

function check(label, actual, expected) {
  if (Object.is(actual, expected)) passed++;
  else
    failures.push(
      `${label}\n      expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
}

function checkDeep(label, actual, expected) {
  check(label, JSON.stringify(actual), JSON.stringify(expected));
}

function section(name) {
  console.log(`\n${name}`);
}

const HOUR_MS = 3600_000;
/** A local wall-clock time on a fixed, non-DST-transition Wednesday. */
const at = (h, m = 0) => new Date(2026, 6, 15, h, m, 0, 0);

const NIGHT = { startHour: 22, endHour: 2 }; // wraps midnight
const WORK = { startHour: 9, endHour: 17 }; // does not wrap
const DEGENERATE = { startHour: 3, endHour: 3 };
const NEARLY_ALL_DAY = { startHour: 0, endHour: 23 };

// ---------------------------------------------------------------------------
// 1. isWithinWindow
// ---------------------------------------------------------------------------

section('isWithinWindow — non-wrapping (09:00–17:00)');
check('08:59 outside', isWithinWindow(at(8, 59), WORK), false);
check('09:00 inside (start inclusive)', isWithinWindow(at(9), WORK), true);
check('16:59 inside', isWithinWindow(at(16, 59), WORK), true);
check('17:00 outside (end exclusive)', isWithinWindow(at(17), WORK), false);
check('20:00 outside', isWithinWindow(at(20), WORK), false);

section('isWithinWindow — wrapping past midnight (22:00–02:00)');
check('21:59 outside', isWithinWindow(at(21, 59), NIGHT), false);
check('22:00 inside', isWithinWindow(at(22), NIGHT), true);
check('23:30 inside', isWithinWindow(at(23, 30), NIGHT), true);
check('00:00 inside (after wrap)', isWithinWindow(at(0), NIGHT), true);
check('01:59 inside', isWithinWindow(at(1, 59), NIGHT), true);
check('02:00 outside (end exclusive)', isWithinWindow(at(2), NIGHT), false);
check('12:00 outside', isWithinWindow(at(12), NIGHT), false);

section('isWithinWindow — degenerate is NEVER, not always');
// A slider dragged into start === end must do nothing, rather than lock the
// user out of every platform permanently with no obvious way back.
check('03:00 not inside a zero-length window', isWithinWindow(at(3), DEGENERATE), false);
check('04:00 not inside a zero-length window', isWithinWindow(at(4), DEGENERATE), false);
check('midnight not inside a zero-length window', isWithinWindow(at(0), DEGENERATE), false);

section('isWithinWindow — hour normalisation');
check('hour 24 wraps to 0', isWithinWindow(at(1), { startHour: 24, endHour: 26 }), true);
check('hour 26 wraps to 2 (exclusive)', isWithinWindow(at(2), { startHour: 24, endHour: 26 }), false);
check('negative start wraps', isWithinWindow(at(23), { startHour: -2, endHour: 1 }), true);
check('negative start, outside', isWithinWindow(at(2), { startHour: -2, endHour: 1 }), false);
check('non-finite degrades to 0', isWithinWindow(at(0), { startHour: NaN, endHour: 2 }), true);

section('isWithinWindow — 23-hour window');
check('00:00 inside', isWithinWindow(at(0), NEARLY_ALL_DAY), true);
check('22:00 inside', isWithinWindow(at(22), NEARLY_ALL_DAY), true);
check('23:00 outside', isWithinWindow(at(23), NEARLY_ALL_DAY), false);

// ---------------------------------------------------------------------------
// 2. nextBoundary
// ---------------------------------------------------------------------------

section('nextBoundary — ms to the next state flip');
check('inside at 23:30 -> closes at 02:00 (2.5h)', nextBoundary(at(23, 30), NIGHT), 2.5 * HOUR_MS);
check('inside at 01:00 -> closes at 02:00 (1h)', nextBoundary(at(1), NIGHT), 1 * HOUR_MS);
check('outside at 12:00 -> opens at 22:00 (10h)', nextBoundary(at(12), NIGHT), 10 * HOUR_MS);
check('exactly on open 22:00 -> closes at 02:00 (4h)', nextBoundary(at(22), NIGHT), 4 * HOUR_MS);
check('outside at 17:00 -> opens 09:00 tomorrow (16h)', nextBoundary(at(17), WORK), 16 * HOUR_MS);
check('inside at 09:00 -> closes 17:00 (8h)', nextBoundary(at(9), WORK), 8 * HOUR_MS);
check('degenerate window never flips', nextBoundary(at(3), DEGENERATE), null);

section('nextBoundary — never zero or negative');
// A boundary of 0 would arm a setTimeout that fires immediately and spins.
let allPositive = true;
for (let h = 0; h < 24; h++) {
  for (const w of [NIGHT, WORK, NEARLY_ALL_DAY]) {
    const ms = nextBoundary(at(h), w);
    if (!(ms > 0) || !Number.isFinite(ms)) allPositive = false;
  }
}
check('every hour x window gives a positive finite delay', allPositive, true);

section('nextBoundary — survives DST in any timezone');
// Asserting a literal wall-clock hour here would be WRONG, and asserting it is
// how this test failed first time round. On a spring-forward date the target
// hour genuinely does not exist — 02:00 becomes 03:00 — so landing on 03:00 is
// the correct answer, not a bug. Nor can the expected hour be hardcoded per
// date, because which dates shift depends on the machine's timezone.
//
// The contract that actually holds everywhere: crossing the boundary FLIPS the
// window state, and does so within a sane delay. That is what a caller arming a
// setTimeout depends on, and it is true in every zone on every date.
const flipsAtBoundary = (from, w) => {
  const ms = nextBoundary(from, w);
  if (!(ms > 0) || ms > 25 * HOUR_MS) return false;
  const landed = new Date(from.getTime() + ms);
  return isWithinWindow(landed, w) !== isWithinWindow(from, w);
};

// 2026: US spring-forward Mar 8 / fall-back Nov 1. EU: Mar 29 / Oct 25.
// Both the eve and the day itself, so whichever zone this runs in is covered.
const dstDates = [];
for (const [mo, day] of [[2, 7], [2, 8], [2, 28], [2, 29], [9, 24], [9, 25], [10, 1]]) {
  for (const hour of [0, 1, 12, 22, 23]) dstDates.push(new Date(2026, mo, day, hour, 0, 0, 0));
}

check(
  'wrapping window flips at its boundary on every DST date',
  dstDates.every((d) => flipsAtBoundary(d, NIGHT)),
  true
);
check(
  'non-wrapping window flips at its boundary on every DST date',
  dstDates.every((d) => flipsAtBoundary(d, WORK)),
  true
);
check(
  'flips hold for every hour of an ordinary day too',
  [...Array(24).keys()].every(
    (h) => flipsAtBoundary(at(h), NIGHT) && flipsAtBoundary(at(h), WORK)
  ),
  true
);

// ---------------------------------------------------------------------------
// 3. windowLengthHours
// ---------------------------------------------------------------------------

section('windowLengthHours');
check('09:00–17:00 is 8h', windowLengthHours(WORK), 8);
check('22:00–02:00 wraps to 4h', windowLengthHours(NIGHT), 4);
check('degenerate is 0h', windowLengthHours(DEGENERATE), 0);
check('00:00–23:00 is 23h', windowLengthHours(NEARLY_ALL_DAY), 23);

// ---------------------------------------------------------------------------
// 4. suggestWindow
// ---------------------------------------------------------------------------

section('suggestWindow — measured beats stated');
checkDeep(
  'a Rhythm finding becomes a window',
  suggestWindow({ startHour: 22, lengthHours: 4 }, []),
  { startHour: 22, endHour: 2 }
);
checkDeep(
  'the finding wins over a stated window',
  suggestWindow({ startHour: 22, lengthHours: 4 }, [WORK]),
  { startHour: 22, endHour: 2 }
);
checkDeep(
  'falls back to the stated window',
  suggestWindow(null, [NIGHT]),
  { startHour: 22, endHour: 2 }
);
check('no finding and no claim -> null', suggestWindow(null, []), null);
check('zero-length finding falls through to nothing', suggestWindow({ startHour: 5, lengthHours: 0 }, []), null);
checkDeep(
  'zero-length finding falls through to the stated window',
  suggestWindow({ startHour: 5, lengthHours: 0 }, [WORK]),
  { startHour: 9, endHour: 17 }
);
check('a degenerate stated window is rejected', suggestWindow(null, [DEGENERATE]), null);

section('suggestWindow — a 24h finding must not collapse to "never"');
// 22 + 24 would normalise back to 22, reading as zero-length and inverting the
// user's intent. The clamp is what stops that.
checkDeep(
  'over-long finding clamps to MAX_WINDOW_HOURS',
  suggestWindow({ startHour: 22, lengthHours: 30 }, []),
  { startHour: 22, endHour: (22 + MAX_WINDOW_HOURS) % 24 }
);
check(
  'the clamped window is actually active',
  isWithinWindow(at(10), suggestWindow({ startHour: 22, lengthHours: 30 }, [])),
  true
);
check('MAX_WINDOW_HOURS is 23', MAX_WINDOW_HOURS, 23);

// ---------------------------------------------------------------------------

console.log('');
if (failures.length) {
  for (const f of failures) console.log(`  FAIL  ${f}`);
  console.log(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed, 0 failed`);
