/**
 * Quiet Hours — the daily window the user has asked to be kept out of.
 *
 * Pure module: no React, no store import, no side effects. Same discipline as
 * utils/reclaimed.ts, and here it is load-bearing twice over —
 * `scripts/verify-schedule.js` lifts these function bodies out of the source and
 * evaluates them, so nothing in this file may reference app state or imports.
 *
 * ALL ARITHMETIC GOES THROUGH `Date`, NEVER RAW MILLISECOND OFFSETS.
 * A window is a wall-clock idea: "keep me out after 10pm" means 10pm on the
 * clock in front of the user, including on the two days a year that clock jumps.
 * `setHours` resolves that against the real local calendar; adding 3_600_000 by
 * hand does not, and that is precisely how a schedule ends up an hour out every
 * spring.
 */

/** `[startHour, endHour)` in local hours. Wraps past midnight when end <= start. */
export type QuietWindow = {
  /** Inclusive local hour the window opens on. */
  startHour: number;
  /** Exclusive local hour it closes on. */
  endHour: number;
};

/** A Rhythm finding, reduced to what a window needs. Matches `RhythmFinding`. */
export type WindowSeed = {
  startHour: number;
  lengthHours: number;
};

/**
 * The longest window that can be expressed. A 24-hour window would normalise its
 * end hour back onto its start hour, which reads as zero-length and silently
 * turns "block me all day" into "block me never" — the opposite of what was
 * asked. 23 keeps it a real window.
 */
export const MAX_WINDOW_HOURS = 23;

/** Any integer hour, wrapped into 0..23. Non-finite input degrades to 0. */
function normHour(h: number): number {
  const n = Math.floor(Number(h));
  if (!Number.isFinite(n)) return 0;
  return ((n % 24) + 24) % 24;
}

/**
 * Is `date` inside the window?
 *
 * `start === end` is treated as ZERO length — never active — rather than as a
 * full day. With half-open wrapping bounds the two are genuinely indistinguishable,
 * so this is a judgement call, and it is made in the safe direction: a slider
 * dragged into a degenerate state should do nothing, not lock the user out of
 * every app permanently with no obvious way back.
 */
export function isWithinWindow(date: Date, w: QuietWindow): boolean {
  const start = normHour(w.startHour);
  const end = normHour(w.endHour);
  if (start === end) return false;
  const hour = date.getHours();
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

/** ms from `from` until local `hour` next strikes. */
function msUntilHour(from: Date, hour: number): number {
  const target = new Date(from.getTime());
  target.setHours(hour, 0, 0, 0);
  if (target.getTime() <= from.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime() - from.getTime();
}

/**
 * ms until the window's state next flips — open if we're outside it, closed if
 * we're inside. `null` when the window is degenerate and will never flip.
 *
 * Callers arm a single `setTimeout` on this rather than polling on an interval:
 * the answer is exact, so a timer that fires once is enough.
 */
export function nextBoundary(from: Date, w: QuietWindow): number | null {
  const start = normHour(w.startHour);
  const end = normHour(w.endHour);
  if (start === end) return null;
  return msUntilHour(from, isWithinWindow(from, w) ? end : start);
}

/** Length in hours, wrapping. 0 for a degenerate window. */
export function windowLengthHours(w: QuietWindow): number {
  const start = normHour(w.startHour);
  const end = normHour(w.endHour);
  if (start === end) return 0;
  return start < end ? end - start : 24 - start + end;
}

/**
 * The window to offer the user, preferring what was measured over what was said.
 *
 * A Rhythm finding is evidence; an onboarding answer is a claim. When both
 * exist the measured one wins, which is the same ordering the rest of the app
 * follows. Returns `null` when there is neither — offering an arbitrary default
 * would be inventing a recommendation.
 */
export function suggestWindow(
  finding: WindowSeed | null,
  stated: readonly QuietWindow[]
): QuietWindow | null {
  if (finding && finding.lengthHours > 0) {
    const length = Math.min(Math.floor(finding.lengthHours), MAX_WINDOW_HOURS);
    return {
      startHour: normHour(finding.startHour),
      endHour: normHour(finding.startHour + length),
    };
  }
  const first = stated && stated.length > 0 ? stated[0] : null;
  if (!first) return null;
  const start = normHour(first.startHour);
  const end = normHour(first.endHour);
  return start === end ? null : { startHour: start, endHour: end };
}
