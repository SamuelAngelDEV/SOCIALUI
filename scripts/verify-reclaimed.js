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

// ---------- 3. one full past week -> never a trend ----------
{
  // This case used to assert `kind === 'rate'` and failed every Sunday. A full
  // previous ISO week does not overlap the rolling 7-day window at all on a
  // Sunday, so rollingWeekMs is 0 and 'learning' is the correct, honest answer —
  // you cannot state a "current pace" for someone who has opened nothing in 7
  // days. The invariant the case exists to guard is that one week is never a
  // trend, so that is what it now asserts.
  const r = R.computeReclaimed(week(1, HOUR));
  ok('one full week -> never change', r.kind !== 'change', r.kind);

  // Pin the 'rate' branch weekday-independently by adding recent activity.
  const withRecent = { ...week(1, HOUR), [key(new Date())]: { total: 30 * MIN } };
  const r2 = R.computeReclaimed(withRecent);
  ok('one full week + recent -> rate', r2.kind === 'rate', r2.kind);
  ok('one full week + recent -> still not change', r2.kind !== 'change', r2.kind);
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
  // Same weekday sensitivity as case 3: the point is that no rise is claimed,
  // not which of the two non-trend branches reports it.
  ok('clipped first week is excluded', r.kind !== 'change', r.kind + ' (should not claim a rise)');

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

// ---------- 13. formatLongSpan steps up through the units ----------
{
  // Under 14 days it defers to formatSpan entirely.
  ok('longSpan 0.5 -> hours', R.formatLongSpan(0.5) === '12 hours', R.formatLongSpan(0.5));
  ok('longSpan 4.32 -> days w/ decimal', R.formatLongSpan(4.32) === '4.3 days', R.formatLongSpan(4.32));
  ok('longSpan 13.9 -> still days', R.formatLongSpan(13.9).endsWith('days'), R.formatLongSpan(13.9));

  ok('longSpan 14 -> 2 weeks', R.formatLongSpan(14) === '2 weeks', R.formatLongSpan(14));
  ok('longSpan 43 -> 6 weeks', R.formatLongSpan(43) === '6 weeks', R.formatLongSpan(43));
  ok('longSpan 59 -> 8 weeks', R.formatLongSpan(59) === '8 weeks', R.formatLongSpan(59));

  ok('longSpan 60 -> 2 months', R.formatLongSpan(60) === '2 months', R.formatLongSpan(60));
  ok('longSpan 212 -> 7 months', R.formatLongSpan(212) === '7 months', R.formatLongSpan(212));

  ok('longSpan 365.25 -> 1 year', R.formatLongSpan(365.25) === '1 year', R.formatLongSpan(365.25));
  ok('longSpan 3652.5 -> 10 years', R.formatLongSpan(3652.5) === '10 years', R.formatLongSpan(3652.5));

  // A decade projected from two measured weeks does not support a decimal.
  const noDecimalUnits = [20, 43, 59, 60, 212, 364].every(
    (d) => !/\.\d/.test(R.formatLongSpan(d))
  );
  ok('weeks/months carry no false precision', noDecimalUnits);

  // Singulars, not "1 weeks".
  ok('longSpan 7.5 -> singular-safe', !/\b1 (weeks|months|years)\b/.test(R.formatLongSpan(30.44)),
    R.formatLongSpan(30.44));
}

// ---------- 14. projectYears ----------
{
  ok('HORIZON_YEARS = 10', R.HORIZON_YEARS === 10, R.HORIZON_YEARS);
  ok('projectYears defaults to the horizon', R.projectYears(4) === 40, R.projectYears(4));
  ok('projectYears explicit', R.projectYears(4, 5) === 20, R.projectYears(4, 5));
  ok('projectYears(0) is 0, not NaN', R.projectYears(0) === 0, R.projectYears(0));
}

// ---------- 15. projectFromEstimate — their guess, never a measurement ----------
{
  ok('null band ("unsure") -> null', R.projectFromEstimate(null) === null);
  ok('undefined band -> null', R.projectFromEstimate(undefined) === null);

  // under1: 0-60m -> midpoint 30m/day -> 30*7*52/1440 = 7.583 days a year
  const under1 = R.projectFromEstimate({ minMs: 0, maxMs: 60 * MIN });
  ok('under1 uses the band midpoint', under1.msPerDay === 30 * MIN, under1.msPerDay);
  ok('under1 daysPerYear ~7.58', Math.abs(under1.daysPerYear - 7.583) < 0.01, under1.daysPerYear);
  ok('under1 is not open-ended', under1.atLeast === false, under1.atLeast);

  // two4: 2-4h -> midpoint 3h/day -> 45.5 days a year
  const two4 = R.projectFromEstimate({ minMs: 120 * MIN, maxMs: 240 * MIN });
  ok('two4 midpoint = 3h', two4.msPerDay === 180 * MIN, two4.msPerDay);
  ok('two4 daysPerYear = 45.5', Math.abs(two4.daysPerYear - 45.5) < 0.01, two4.daysPerYear);

  // over4 is open-ended: use the floor, and say so. Inventing a ceiling would be
  // us making the number up rather than reporting theirs.
  const over4 = R.projectFromEstimate({ minMs: 240 * MIN, maxMs: null });
  ok('over4 uses the floor', over4.msPerDay === 240 * MIN, over4.msPerDay);
  ok('over4 flags atLeast', over4.atLeast === true, over4.atLeast);

  // A zero-width band at zero is not a claim.
  ok('zero band -> null', R.projectFromEstimate({ minMs: 0, maxMs: 0 }) === null);

  // The horizon is consistent with projectYears.
  ok('daysPerHorizon = daysPerYear * 10',
    Math.abs(two4.daysPerHorizon - two4.daysPerYear * 10) < 1e-6, two4.daysPerHorizon);

  // Everything finite.
  const finite = [under1, two4, over4].every((p) =>
    Object.values(p).every((v) => typeof v !== 'number' || Number.isFinite(v))
  );
  ok('estimate projections are finite', finite);
}

// ---------- 16. msPerWeekToDaysPerYear is the same maths as the rest ----------
{
  // 7h/week is the delta from case 4, which asserted 15.166 days a year.
  ok('exported rate helper matches computeReclaimed',
    Math.abs(R.msPerWeekToDaysPerYear(7 * HOUR) - 15.166) < 0.01,
    R.msPerWeekToDaysPerYear(7 * HOUR));
  ok('rate helper: 0 -> 0', R.msPerWeekToDaysPerYear(0) === 0);
}

console.log('');
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
