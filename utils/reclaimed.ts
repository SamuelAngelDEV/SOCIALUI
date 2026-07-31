import { dayKey, lastNDayKeys, weekKey } from './stats';

/**
 * "How much of your life are you getting back."
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE
 *
 * The founder brief is explicit: *"We say 'a comparable intervention achieved
 * this' — never 'Quiet saved you this.' The first is arithmetic on measured
 * data. The second is an unknowable counterfactual."*
 *
 * So everything here extrapolates the user's OWN measured change and never
 * attributes it to the app. The test any copy built on this has to pass:
 * would the sentence still be true if they had cut down entirely on their own?
 * If not, it is the wrong sentence.
 *
 * Consequences, all deliberate:
 *   - the baseline is their own first full week, never a population average
 *   - a rise is reported as plainly as a fall (see `direction`)
 *   - nothing here is a streak, a score, or a goal bar — a number that punishes
 *     a bad week is the thing this product argues against
 *
 * Pure module: no React, no store import, no side effects.
 */

const MS_PER_DAY = 86_400_000;
const MS_PER_MIN = 60_000;
const WEEKS_PER_YEAR = 52;

/** Two full weeks before any trend is claimed. One week is not a trend. */
export const MIN_FULL_WEEKS = 2;

/**
 * Below this, a week-over-week difference is noise rather than a change. Same
 * spirit as `MIN_DAYS_OF_DATA` in utils/savings.ts — refuse to make a claim the
 * data does not support.
 */
export const MIN_DELTA_MS_PER_WEEK = 15 * MS_PER_MIN;

/**
 * Population context only — NEVER the basis of a projection about this user.
 *
 * Source: DataReportal / GWI, "Digital 2026 Global Overview Report".
 * Deliberately not taken from a statistics-aggregator site: the brief calls out
 * the "Google grayscale experiment", the 23-minute notification cost, and the
 * 32% Instagram figure as fabricated or misquoted, and those propagate through
 * exactly that kind of source. Refusing to repeat them is a differentiator.
 */
export const GLOBAL_AVG_MS_PER_DAY = 141 * MS_PER_MIN; // 2h 21m
export const GLOBAL_AVG_MS_PER_WEEK = 1116 * MS_PER_MIN; // 18h 36m

export type Reclaimed =
  /** Not enough full weeks to compare. Say so; don't draw a chart of one week. */
  | { kind: 'learning'; fullWeeks: number }
  /**
   * A measured rate with nothing to compare it against yet. Answers "what does
   * my current usage cost me a year?" — descriptive, no counterfactual.
   */
  | { kind: 'rate'; msPerWeek: number; daysPerYear: number }
  /** A real change between their first full week and their most recent one. */
  | {
      kind: 'change';
      baselineMsPerWeek: number;
      currentMsPerWeek: number;
      /** Always positive; read `direction` for the sign. */
      deltaMsPerWeek: number;
      daysPerYear: number;
      direction: 'down' | 'up';
      baselineWeek: string;
      currentWeek: string;
    };

type DayTotals = Record<string, { total: number }>;

/** Total ms recorded in the 7 days ending today. A real window, not a forecast. */
export function rollingWeekMs(days: DayTotals): number {
  return lastNDayKeys(7).reduce((sum, k) => sum + (days[k]?.total ?? 0), 0);
}

/**
 * Weekly totals for weeks we can compare honestly, oldest first.
 *
 * Two exclusions, and both matter:
 *
 * 1. The CURRENT week is dropped. Mid-week it is always short, so including it
 *    would manufacture progress that vanishes by Sunday.
 *
 * 2. A week that began BEFORE the first recorded day is dropped. Install on a
 *    Thursday and Mon–Wed contribute nothing, so that week reads artificially
 *    low — which would then show up as usage "going up" in week two when
 *    nothing of the sort happened. This is the trap that makes a naive version
 *    of this feature lie to almost every new user in their second week.
 */
export function comparableWeeks(days: DayTotals): { week: string; ms: number }[] {
  const dayKeys = Object.keys(days).sort();
  if (!dayKeys.length) return [];

  const firstDay = dayKeys[0];
  const thisWeek = weekKey();

  const totals = new Map<string, number>();
  for (const k of dayKeys) {
    const ms = days[k]?.total ?? 0;
    if (ms <= 0) continue;
    const [y, m, d] = k.split('-').map(Number);
    const wk = weekKey(new Date(y, m - 1, d));
    totals.set(wk, (totals.get(wk) ?? 0) + ms);
  }

  return [...totals.entries()]
    .filter(([wk]) => wk !== thisWeek && wk >= firstDay)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([week, ms]) => ({ week, ms }));
}

const toDaysPerYear = (msPerWeek: number) => (msPerWeek * WEEKS_PER_YEAR) / MS_PER_DAY;

export function computeReclaimed(days: DayTotals): Reclaimed {
  const weeks = comparableWeeks(days);

  if (weeks.length < MIN_FULL_WEEKS) {
    const msPerWeek = rollingWeekMs(days);
    // Nothing to compare against — but a measured rate is still true and useful.
    if (msPerWeek > 0) {
      return { kind: 'rate', msPerWeek, daysPerYear: toDaysPerYear(msPerWeek) };
    }
    return { kind: 'learning', fullWeeks: weeks.length };
  }

  const baseline = weeks[0];
  const current = weeks[weeks.length - 1];
  const signed = baseline.ms - current.ms; // positive = went down
  const delta = Math.abs(signed);

  if (delta < MIN_DELTA_MS_PER_WEEK) {
    // Held roughly steady. Report the rate rather than dress up noise as a trend.
    return {
      kind: 'rate',
      msPerWeek: current.ms,
      daysPerYear: toDaysPerYear(current.ms),
    };
  }

  return {
    kind: 'change',
    baselineMsPerWeek: baseline.ms,
    currentMsPerWeek: current.ms,
    deltaMsPerWeek: delta,
    daysPerYear: toDaysPerYear(delta),
    direction: signed > 0 ? 'down' : 'up',
    baselineWeek: baseline.week,
    currentWeek: current.week,
  };
}

/** "4.3 days" / "1 day" / "18 hours" — days only once it is worth saying in days. */
export function formatSpan(daysPerYear: number): string {
  if (daysPerYear < 1) {
    const hours = daysPerYear * 24;
    const h = hours < 10 ? Math.round(hours * 10) / 10 : Math.round(hours);
    return `${h} ${h === 1 ? 'hour' : 'hours'}`;
  }
  const d = daysPerYear < 10 ? Math.round(daysPerYear * 10) / 10 : Math.round(daysPerYear);
  return `${d} ${d === 1 ? 'day' : 'days'}`;
}

/** Today's key — re-exported so callers don't reach past this module for it. */
export { dayKey };
