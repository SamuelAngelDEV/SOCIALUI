/**
 * Delayed disable — the cooldown that stands between an impulse and an unguarded
 * feed.
 *
 * THE PROBLEM THIS SOLVES
 *
 * Screen Time's per-app limits lose to a two-tap "Ignore Limit". The protection
 * is real for as long as the user still wants it and evaporates the moment they
 * don't, which is precisely the moment it was for. Anyone who has bypassed it
 * once stops believing in it, and an unbelieved limit does no work at all.
 *
 * THE ASYMMETRY, WHICH IS THE WHOLE DESIGN
 *
 * Turning a protection ON is instant. Turning one OFF is scheduled — it takes
 * effect after `delayHours`, and until then it is shown and can be cancelled.
 * Strengthening is never delayed; weakening always is. A user in the grip of the
 * impulse the app was installed to interrupt cannot act on it faster than the
 * impulse passes, and a user who has genuinely changed their mind waits a day
 * and gets exactly what they asked for.
 *
 * WHAT THIS IS NOT
 *
 * It is not a lock, and it does not govern access. The per-session "open anyway"
 * on QuietHoursOverlay and the feed wall are untouched: someone who needs into
 * an app right now still gets in right now, in seconds, every time. This governs
 * only whether the protection is still there tomorrow. `CLAUDE.md`'s rule —
 * friction is the mechanism, a lock is a different product — is about the door,
 * and this is not the door.
 *
 * TWO HONEST LIMITS, STATED RATHER THAN PAPERED OVER
 *
 * 1. The device clock is the only clock. Someone who moves it forward skips the
 *    wait, and on an on-device-only product with no network calls (see
 *    `CLAUDE.md`) there is no way to detect that and no intention of trying. The
 *    delay is a speed bump for an impulse, not a security control against a
 *    determined user — and the person it is for is not attacking it.
 * 2. Deleting the app removes everything. That is correct and deliberate.
 *
 * Pure module: no React, no store import, no app imports, no side effects — the
 * same discipline as `utils/schedule.ts` and `utils/reclaimed.ts`, and load-
 * bearing for the same reason: `scripts/verify-commitment.js` lifts these
 * function bodies out of the source and evaluates them.
 *
 * NOTE THE CONTRAST WITH `utils/schedule.ts`. That file forbids raw millisecond
 * arithmetic because a quiet-hours window is a WALL-CLOCK idea ("10pm" means
 * 10pm on the clock in front of you, including on the two days a year the clock
 * jumps). This file is the opposite case: a cooldown is a DURATION. "Twenty-four
 * hours from now" is twenty-four elapsed hours whether or not a DST boundary
 * falls inside it, so raw ms offsets are not merely acceptable here, they are
 * the correct model. Do not "fix" this file to match that one.
 */

const MS_PER_HOUR = 3_600_000;
const MS_PER_MIN = 60_000;

/** How long a weakening waits by default. A night's sleep sits inside it. */
export const DEFAULT_DELAY_HOURS = 24;

/**
 * The longest cooldown that can be set.
 *
 * A week is long enough to outlast any impulse and short enough that a user who
 * has genuinely changed their mind is not left arguing with an app for a
 * fortnight. Longer values start to be a lock wearing a delay's clothes.
 */
export const MAX_DELAY_HOURS = 168;

/** A weakening that has been requested but has not taken effect yet. */
export type PendingChange = {
  /** Identifies what is being weakened. Opaque here; the store assigns meaning. */
  key: string;
  /** Epoch ms when it was requested — drives "asked for it 2 hours ago" copy. */
  requestedAt: number;
  /** Epoch ms when it takes effect. */
  effectiveAt: number;
};

/** Hours clamped into `[0, MAX_DELAY_HOURS]`. Non-finite input degrades to 0. */
export function normalizeDelayHours(hours: number): number {
  const n = Number(hours);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.floor(n), MAX_DELAY_HOURS);
}

/**
 * Schedule a weakening.
 *
 * Returns `null` when the delay is zero — that is the feature switched off, and
 * the caller should apply the change immediately rather than store a pending
 * entry that is already due. Returning a due-on-arrival record instead would
 * work, but it would put a "turns off in 0 seconds" pill on screen for one
 * frame, which reads as a bug.
 */
export function schedule(
  key: string,
  now: number,
  delayHours: number = DEFAULT_DELAY_HOURS
): PendingChange | null {
  const hours = normalizeDelayHours(delayHours);
  if (hours === 0) return null;
  return { key, requestedAt: now, effectiveAt: now + hours * MS_PER_HOUR };
}

/** Has this change come due? */
export function isDue(change: PendingChange, now: number): boolean {
  return now >= change.effectiveAt;
}

/** The pending entry for `key`, or `null`. */
export function pendingFor(
  list: readonly PendingChange[],
  key: string
): PendingChange | null {
  for (const c of list) if (c.key === key) return c;
  return null;
}

/**
 * `resolve`'s result.
 *
 * A NAMED type, not an inline `{ due: …; waiting: … }` on the signature, and it
 * has to stay that way: `scripts/verify-commitment.js` locates a function body
 * by finding the first `{` after the parameter list, so an inline object return
 * type is picked up as the body and the lift fails. Named alias, no braces on
 * the signature, extractor stays simple.
 */
export type Resolution = { due: PendingChange[]; waiting: PendingChange[] };

/**
 * Split a pending list into the changes that should now be applied and the ones
 * still waiting. Callers apply `due` and persist `waiting`.
 */
export function resolve(list: readonly PendingChange[], now: number): Resolution {
  return {
    due: list.filter((c) => isDue(c, now)),
    waiting: list.filter((c) => !isDue(c, now)),
  };
}

/**
 * Drop any pending weakening of `key`.
 *
 * Used for an explicit cancel AND — importantly — whenever the user turns the
 * same protection back ON. Without that second call a scheduled disable would
 * survive the user changing their mind and fire hours later on a setting they
 * had already restored, silently undoing a deliberate choice. That is the worst
 * failure this feature could have: it would make the app untrustworthy in
 * exactly the direction it is asking to be trusted.
 */
export function cancel(
  list: readonly PendingChange[],
  key: string
): PendingChange[] {
  return list.filter((c) => c.key !== key);
}

/**
 * Add or replace a pending change.
 *
 * Re-requesting a weakening that is already pending does NOT restart the clock —
 * the existing entry wins. Otherwise the cooldown could be reset indefinitely by
 * tapping the toggle, which would leave the protection permanently one tap from
 * expiry and the delay doing no work.
 */
export function upsert(
  list: readonly PendingChange[],
  change: PendingChange
): PendingChange[] {
  return pendingFor(list, change.key) ? [...list] : [...list, change];
}

/** ms until `change` takes effect. Never negative. */
export function remainingMs(change: PendingChange, now: number): number {
  const left = change.effectiveAt - now;
  return left > 0 ? left : 0;
}

/**
 * '23h 14m', '14m', 'less than a minute'.
 *
 * Deliberately not a live-ticking seconds countdown. A day-long timer counting
 * down by the second is an urgency device, and manufacturing urgency is the
 * thing this product exists to argue against — see `research/03` §1.4 on
 * reserving salience for the user's own chosen action.
 */
export function formatRemaining(ms: number): string {
  if (ms < MS_PER_MIN) return 'less than a minute';
  const totalMin = Math.floor(ms / MS_PER_MIN);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}
