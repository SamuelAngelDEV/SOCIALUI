/* eslint-disable no-console */
/**
 * Delayed-disable cooldown checks. Run with:
 *
 *   node scripts/verify-commitment.js
 *
 * Follows the precedent set by verify-tracking.js and verify-schedule.js: no
 * dependencies, no test runner, and it does NOT re-implement what it tests. It
 * reads utils/commitment.ts, lifts the real function bodies out, strips the type
 * annotations from their signatures and evaluates them. A copied-out
 * implementation drifts from the shipped one and silently stops testing anything.
 *
 * Covered:
 *   1. The asymmetry: weakening is delayed, and re-strengthening cancels the
 *      pending weakening rather than letting it fire later.
 *   2. Re-requesting a pending change does not restart its clock.
 *   3. Clamps — zero delay, negative, non-finite, above MAX_DELAY_HOURS.
 *   4. resolve() splits due from waiting at the exact boundary.
 *   5. formatRemaining's rounding.
 *   6. A simulation of the full request → wait → fire lifecycle, including a
 *      cancel partway through and a clock moved backwards.
 */

const fs = require('fs');
const path = require('path');

const COMMITMENT_TS = path.join(__dirname, '..', 'utils', 'commitment.ts');

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
 *
 * Only the signature is rewritten; the body is taken verbatim, so this is only
 * valid for functions whose bodies carry no type annotations. Asserted below —
 * `resolve` is written with two filters rather than a pair of annotated
 * accumulators specifically so it survives this.
 */
function extractFunction(src, name) {
  const decl = new RegExp(`(?:export\\s+)?function\\s+${name}\\s*\\(`);
  const m = decl.exec(src);
  if (!m) throw new Error(`could not find function ${name} in utils/commitment.ts`);

  const parenOpen = src.indexOf('(', m.index);
  const parenClose = matchDelimiter(src, parenOpen, '(', ')');
  const braceOpen = src.indexOf('{', parenClose);
  const braceClose = matchDelimiter(src, braceOpen, '{', '}');

  // Default values (`delayHours: number = DEFAULT_DELAY_HOURS`) have to survive
  // the annotation strip, or `schedule` loses its default and every call that
  // omits the argument silently schedules NaN hours ahead.
  const params = src
    .slice(parenOpen + 1, parenClose)
    .split(',')
    .map((p) => {
      const eq = p.indexOf('=');
      if (eq === -1) return p.split(':')[0].trim();
      return `${p.slice(0, eq).split(':')[0].trim()} = ${p.slice(eq + 1).trim()}`;
    })
    .filter(Boolean);

  const body = src.slice(braceOpen, braceClose + 1);
  if (/:\s*(string|number|boolean|PendingChange)\b/.test(body)) {
    throw new Error(`body of ${name} contains type annotations; extractor needs updating`);
  }
  return `function ${name}(${params.join(', ')}) ${body}`;
}

/** Read a numeric const from source rather than hardcoding it here. */
function readConst(src, name) {
  const m = new RegExp(`(?:export\\s+)?const ${name}\\s*=\\s*([0-9_]+)`).exec(src);
  if (!m) throw new Error(`could not find ${name} in utils/commitment.ts`);
  return Number(m[1].replace(/_/g, ''));
}

function loadCommitment() {
  const src = fs.readFileSync(COMMITMENT_TS, 'utf8');
  const names = [
    'normalizeDelayHours',
    'schedule',
    'isDue',
    'pendingFor',
    'resolve',
    'cancel',
    'upsert',
    'remainingMs',
    'formatRemaining',
  ];

  // Lifted bodies do not close over the module, so every constant they
  // reference has to be declared into the sandbox — still read from source,
  // never typed in twice.
  const consts = ['MS_PER_HOUR', 'MS_PER_MIN', 'DEFAULT_DELAY_HOURS', 'MAX_DELAY_HOURS'];
  const values = Object.fromEntries(consts.map((c) => [c, readConst(src, c)]));

  const code = [
    ...consts.map((c) => `const ${c} = ${values[c]};`),
    ...names.map((n) => extractFunction(src, n)),
  ].join('\n\n');

  // eslint-disable-next-line no-new-func
  const factory = new Function(`${code}\nreturn { ${names.join(', ')} };`);
  return { ...factory(), ...values };
}

const {
  normalizeDelayHours,
  schedule,
  isDue,
  pendingFor,
  resolve,
  cancel,
  upsert,
  remainingMs,
  formatRemaining,
  MS_PER_HOUR,
  DEFAULT_DELAY_HOURS,
  MAX_DELAY_HOURS,
} = loadCommitment();

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let passed = 0;
const failures = [];

function check(label, actual, expected) {
  if (actual === expected) passed++;
  else
    failures.push(
      `${label}\n      expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
}

function section(name) {
  console.log(`\n${name}`);
}

const T0 = 1_770_000_000_000; // an arbitrary fixed "now"
const HOUR = MS_PER_HOUR;

// ---------------------------------------------------------------------------
// 1. The constants themselves
// ---------------------------------------------------------------------------

section('constants');
check('default delay is a full day', DEFAULT_DELAY_HOURS, 24);
check('max delay is a week', MAX_DELAY_HOURS, 168);
check('an hour is an hour', MS_PER_HOUR, 3_600_000);

// ---------------------------------------------------------------------------
// 2. normalizeDelayHours — the clamps
// ---------------------------------------------------------------------------

section('normalizeDelayHours');
check('ordinary value passes through', normalizeDelayHours(24), 24);
check('one hour is allowed', normalizeDelayHours(1), 1);
check('zero means off', normalizeDelayHours(0), 0);
check('negative degrades to off', normalizeDelayHours(-5), 0);
check('NaN degrades to off', normalizeDelayHours(NaN), 0);
check('Infinity degrades to off', normalizeDelayHours(Infinity), 0);
check('undefined degrades to off', normalizeDelayHours(undefined), 0);
check('a string number is coerced', normalizeDelayHours('12'), 12);
check('fractional hours floor', normalizeDelayHours(2.9), 2);
check('above the max is clamped', normalizeDelayHours(10_000), MAX_DELAY_HOURS);
check('exactly the max is kept', normalizeDelayHours(MAX_DELAY_HOURS), MAX_DELAY_HOURS);

// ---------------------------------------------------------------------------
// 3. schedule
// ---------------------------------------------------------------------------

section('schedule');
{
  const c = schedule('blockReels', T0);
  check('uses the default delay', c.effectiveAt - T0, DEFAULT_DELAY_HOURS * HOUR);
  check('records when it was asked for', c.requestedAt, T0);
  check('carries its key', c.key, 'blockReels');
}
{
  const c = schedule('blockReels', T0, 3);
  check('honours an explicit delay', c.effectiveAt - T0, 3 * HOUR);
}
// A zero delay is the feature switched off; the caller applies immediately
// rather than storing an entry that is already due.
check('zero delay schedules nothing', schedule('k', T0, 0), null);
check('negative delay schedules nothing', schedule('k', T0, -1), null);
check(
  'an over-long delay is clamped, not rejected',
  schedule('k', T0, 10_000).effectiveAt - T0,
  MAX_DELAY_HOURS * HOUR
);

// ---------------------------------------------------------------------------
// 4. isDue / remainingMs — the boundary
// ---------------------------------------------------------------------------

section('isDue and remainingMs');
{
  const c = schedule('k', T0, 24);
  check('not due at the moment of asking', isDue(c, T0), false);
  check('not due one ms early', isDue(c, c.effectiveAt - 1), false);
  check('due exactly on the boundary', isDue(c, c.effectiveAt), true);
  check('due after', isDue(c, c.effectiveAt + 1), true);

  check('remaining is the full delay at t0', remainingMs(c, T0), 24 * HOUR);
  check('remaining is zero on the boundary', remainingMs(c, c.effectiveAt), 0);
  // A clock moved FORWARD past the boundary just makes it due; a clock moved
  // backwards must never produce a negative countdown to render.
  check('remaining never goes negative', remainingMs(c, c.effectiveAt + 999_999), 0);
  check('a backwards clock lengthens the wait', remainingMs(c, T0 - HOUR), 25 * HOUR);
}

// ---------------------------------------------------------------------------
// 5. resolve — splitting due from waiting
// ---------------------------------------------------------------------------

section('resolve');
{
  const soon = schedule('soon', T0, 1);
  const later = schedule('later', T0, 48);
  const list = [soon, later];

  const atStart = resolve(list, T0);
  check('nothing due at the start', atStart.due.length, 0);
  check('everything waiting at the start', atStart.waiting.length, 2);

  const midway = resolve(list, T0 + 2 * HOUR);
  check('the short one comes due', midway.due.length, 1);
  check('…and it is the right one', midway.due[0].key, 'soon');
  check('the long one still waits', midway.waiting[0].key, 'later');

  const after = resolve(list, T0 + 100 * HOUR);
  check('everything eventually comes due', after.due.length, 2);
  check('nothing left waiting', after.waiting.length, 0);

  check('an empty list resolves to nothing', resolve([], T0).due.length, 0);
  // resolve must not mutate what it was handed — the store persists `waiting`.
  check('input list is untouched', list.length, 2);
}

// ---------------------------------------------------------------------------
// 6. upsert / cancel / pendingFor
// ---------------------------------------------------------------------------

section('upsert, cancel, pendingFor');
{
  let list = [];
  list = upsert(list, schedule('a', T0, 24));
  check('first request is stored', list.length, 1);
  check('pendingFor finds it', pendingFor(list, 'a').key, 'a');
  check('pendingFor misses cleanly', pendingFor(list, 'b'), null);

  // Re-requesting must NOT restart the clock, or tapping the toggle repeatedly
  // keeps the protection permanently one tap from expiry.
  const restarted = upsert(list, schedule('a', T0 + 12 * HOUR, 24));
  check('re-request does not add a duplicate', restarted.length, 1);
  check(
    're-request does not restart the clock',
    pendingFor(restarted, 'a').effectiveAt,
    T0 + 24 * HOUR
  );

  list = upsert(list, schedule('b', T0, 24));
  check('a second key is stored separately', list.length, 2);

  const cancelled = cancel(list, 'a');
  check('cancel removes one', cancelled.length, 1);
  check('…the right one', cancelled[0].key, 'b');
  check('cancel of an absent key is a no-op', cancel(list, 'zzz').length, 2);
  check('cancel does not mutate the input', list.length, 2);
}

// ---------------------------------------------------------------------------
// 7. formatRemaining
// ---------------------------------------------------------------------------

section('formatRemaining');
check('a full day', formatRemaining(24 * HOUR), '24h');
check('hours and minutes', formatRemaining(23 * HOUR + 14 * 60_000), '23h 14m');
check('whole hours drop the minutes', formatRemaining(2 * HOUR), '2h');
check('under an hour is minutes only', formatRemaining(14 * 60_000), '14m');
check('one minute', formatRemaining(60_000), '1m');
check('under a minute is not a countdown', formatRemaining(59_000), 'less than a minute');
check('zero', formatRemaining(0), 'less than a minute');
// Seconds are floored, never rounded up into a minute that has not passed.
check('59m 59s is still 59m', formatRemaining(59 * 60_000 + 59_000), '59m');

// ---------------------------------------------------------------------------
// 8. The lifecycle, as the store will run it
// ---------------------------------------------------------------------------
//
// This is the regression that matters most: a user turns a protection off,
// changes their mind, turns it back on — and the scheduled disable must be gone.
// Without the cancel-on-strengthen rule it fires hours later and silently undoes
// a deliberate choice, which is the worst thing this feature could do.

section('lifecycle');

function makeStore(delayHours) {
  return {
    on: true,
    pending: [],
    delayHours,
    /** The user flips the switch. */
    set(value, now) {
      this.tick(now);
      if (value) {
        // Strengthening is instant AND clears any scheduled weakening.
        this.on = true;
        this.pending = cancel(this.pending, 'on');
        return;
      }
      const c = schedule('on', now, this.delayHours);
      if (!c) {
        this.on = false; // delay disabled — apply immediately
        return;
      }
      this.pending = upsert(this.pending, c);
    },
    /** Called on every read; applies anything that has come due. */
    tick(now) {
      const { due, waiting } = resolve(this.pending, now);
      for (const c of due) if (c.key === 'on') this.on = false;
      this.pending = waiting;
    },
  };
}

{
  // Straight through: request, wait a day, it applies.
  const s = makeStore(24);
  s.set(false, T0);
  check('still protected immediately after asking', s.on, true);
  check('the request is visible', s.pending.length, 1);
  s.tick(T0 + 23 * HOUR);
  check('still protected 23h later', s.on, true);
  s.tick(T0 + 24 * HOUR);
  check('off after the full day', s.on, false);
  check('nothing left pending', s.pending.length, 0);
}

{
  // Changed their mind. The scheduled disable must not survive.
  const s = makeStore(24);
  s.set(false, T0);
  s.set(true, T0 + 2 * HOUR);
  check('back on immediately', s.on, true);
  check('the pending disable is gone', s.pending.length, 0);
  s.tick(T0 + 48 * HOUR);
  check('and it does not fire later', s.on, true);
}

{
  // Toggling off repeatedly must not keep pushing the deadline back.
  const s = makeStore(24);
  s.set(false, T0);
  s.set(false, T0 + 12 * HOUR);
  s.set(false, T0 + 20 * HOUR);
  check('one pending entry only', s.pending.length, 1);
  s.tick(T0 + 24 * HOUR);
  check('fires on the ORIGINAL deadline', s.on, false);
}

{
  // Cooldown switched off entirely — the old instant behaviour.
  const s = makeStore(0);
  s.set(false, T0);
  check('applies immediately with no delay', s.on, false);
  check('and stores nothing', s.pending.length, 0);
}

{
  // The app is closed for a week and reopened; everything due applies at once.
  const s = makeStore(24);
  s.set(false, T0);
  s.tick(T0 + 7 * 24 * HOUR);
  check('a long absence applies the change', s.on, false);
  check('and clears the queue', s.pending.length, 0);
}

// ---------------------------------------------------------------------------

console.log('');
if (failures.length) {
  console.log(`FAILED — ${passed} passed, ${failures.length} failed\n`);
  for (const f of failures) console.log(`  ✗ ${f}\n`);
  process.exit(1);
}
console.log(`${passed} passed, 0 failed`);
