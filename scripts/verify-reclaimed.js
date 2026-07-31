/* Verification for utils/reclaimed.ts — run with `node verify-reclaimed.js`. */
const R = require('C:/Users/chief/Projects/quiet-sdk54/.tmp-reclaimed/utils/reclaimed.js');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  -> ' + extra : '')); }
};

const MIN = 60_000;
const HOUR = 60 * MIN;

const key = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};
/** Monday of the week n weeks before this week. */
const mondayNWeeksAgo = (n) => {
  const d = new Date();
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow - n * 7);
  d.setHours(12, 0, 0, 0);
  return d;
};
/** Build a full Mon-Sun week n weeks ago, msPerDay each day. */
const week = (n, msPerDay, daysCount = 7) => {
  const out = {};
  const mon = mondayNWeeksAgo(n);
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    out[key(d)] = { total: msPerDay };
  }
  return out;
};

// ---------- 1. no data ----------
{
  const r = R.computeReclaimed({});
  ok('empty -> learning', r.kind === 'learning', r.kind);
  ok('empty -> 0 weeks', r.fullWeeks === 0, r.fullWeeks);
}

// ---------- 2. only the current (partial) week ----------
{
  const today = {};
  today[key(new Date())] = { total: 30 * MIN };
  const r = R.computeReclaimed(today);
  ok('current week only -> rate (not change)', r.kind === 'rate', r.kind);
  ok('current week counted in rolling 7d', r.msPerWeek === 30 * MIN, r.msPerWeek);
}

// ---------- 3. one full past week -> rate, never change ----------
{
  const r = R.computeReclaimed(week(1, HOUR));
  ok('one full week -> rate', r.kind === 'rate', r.kind);
}

// ---------- 4. real drop across two full weeks ----------
{
  const days = { ...week(2, 2 * HOUR), ...week(1, 1 * HOUR) };
  const r = R.computeReclaimed(days);
  ok('two weeks, drop -> change', r.kind === 'change', r.kind);
  ok('direction down', r.direction === 'down', r.direction);
  ok('delta = 7h', r.deltaMsPerWeek === 7 * HOUR, r.deltaMsPerWeek);
  // 7h/week * 52 / 24h = 15.17 days
  ok('daysPerYear ~15.2', Math.abs(r.daysPerYear - 15.166) < 0.01, r.daysPerYear);
}

// ---------- 5. a RISE is reported, not hidden ----------
{
  const days = { ...week(2, 1 * HOUR), ...week(1, 2 * HOUR) };
  const r = R.computeReclaimed(days);
  ok('rise -> change', r.kind === 'change', r.kind);
  ok('rise -> direction up', r.direction === 'up', r.direction);
  ok('rise -> delta positive', r.deltaMsPerWeek === 7 * HOUR, r.deltaMsPerWeek);
}

// ---------- 6. sub-threshold delta is noise, not a trend ----------
{
  // 1 min/day difference = 7 min/week, under the 15 min floor
  const days = { ...week(2, 60 * MIN), ...week(1, 59 * MIN) };
  const r = R.computeReclaimed(days);
  ok('noise -> rate not change', r.kind === 'rate', r.kind);
}

// ---------- 7. THE TRAP: install mid-week must not fake a rise ----------
{
  // Installed Thursday two weeks ago -> that week only has 4 days of data.
  // A naive baseline would read low and week 2 would look like a big increase.
  const partialFirst = {};
  const mon = mondayNWeeksAgo(2);
  for (let i = 3; i < 7; i++) {           // Thu..Sun only
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    partialFirst[key(d)] = { total: 2 * HOUR };
  }
  const days = { ...partialFirst, ...week(1, 2 * HOUR) };
  const r = R.computeReclaimed(days);
  ok('clipped first week is excluded', r.kind === 'rate', r.kind + ' (should not claim a rise)');

  const weeks = R.comparableWeeks(days);
  ok('only the full week is comparable', weeks.length === 1, weeks.length);
}

// ---------- 8. gap week with no data at all ----------
{
  const days = { ...week(3, 2 * HOUR), ...week(1, 1 * HOUR) }; // week 2 missing
  const r = R.computeReclaimed(days);
  ok('gap week -> still compares first vs last', r.kind === 'change', r.kind);
  ok('gap week -> down', r.direction === 'down', r.direction);
  const weeks = R.comparableWeeks(days);
  ok('empty week not fabricated as zero', weeks.length === 2, weeks.length);
}

// ---------- 9. current week never enters the comparison ----------
{
  const days = { ...week(2, 2 * HOUR), ...week(1, 2 * HOUR) };
  days[key(new Date())] = { total: 5 * HOUR }; // huge today
  const weeks = R.comparableWeeks(days);
  ok('current week excluded from comparison',
    weeks.every((w) => w.week !== R.dayKey(mondayNWeeksAgo(0))), JSON.stringify(weeks));
}

// ---------- 10. no divide-by-zero / NaN anywhere ----------
{
  const cases = [
    {},
    { [key(new Date())]: { total: 0 } },
    week(1, 0),
    { ...week(2, 0), ...week(1, 0) },
  ];
  let clean = true;
  for (const c of cases) {
    const r = R.computeReclaimed(c);
    for (const [k, v] of Object.entries(r)) {
      if (typeof v === 'number' && !Number.isFinite(v)) { clean = false; console.log('   non-finite', k, v); }
    }
  }
  ok('zero-usage cases produce finite numbers', clean);
}

// ---------- 11. formatSpan ----------
{
  // >= 10 drops the decimal: "15.2 days a year" is false precision on an extrapolation.
  ok('formatSpan 15.166 -> "15 days"', R.formatSpan(15.166) === '15 days', R.formatSpan(15.166));
  ok('formatSpan 4.32 keeps decimal', R.formatSpan(4.32) === '4.3 days', R.formatSpan(4.32));
  ok('formatSpan 1 -> "1 day"', R.formatSpan(1) === '1 day', R.formatSpan(1));
  ok('formatSpan 0.5 -> hours', R.formatSpan(0.5) === '12 hours', R.formatSpan(0.5));
  ok('formatSpan 40 -> "40 days"', R.formatSpan(40) === '40 days', R.formatSpan(40));
}

// ---------- 12. sourced constants ----------
{
  ok('global avg daily = 2h21m', R.GLOBAL_AVG_MS_PER_DAY === 141 * MIN, R.GLOBAL_AVG_MS_PER_DAY);
  ok('global avg weekly = 18h36m', R.GLOBAL_AVG_MS_PER_WEEK === 1116 * MIN, R.GLOBAL_AVG_MS_PER_WEEK);
  // sanity: the weekly figure is ~7x the daily one
  const ratio = R.GLOBAL_AVG_MS_PER_WEEK / R.GLOBAL_AVG_MS_PER_DAY;
  ok('weekly ~= 7.9x daily (GWI reports both)', ratio > 7 && ratio < 8.2, ratio.toFixed(2));
}

console.log('');
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
