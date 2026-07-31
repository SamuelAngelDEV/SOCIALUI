import { Strings } from './strings';

/**
 * The five onboarding questions as data: the answer ids, and what each id means
 * to the rest of the app.
 *
 * Copy lives in `constants/strings.ts` and is referenced here rather than
 * repeated. What this file adds is the semantics — the daily band an estimate
 * stands for, the local hours a "when" answer claims — so the answers are
 * usable by the weekly report and by Rhythm without either of them knowing how
 * onboarding was laid out.
 *
 * The ids are also the persisted values, which is why the type guards at the
 * bottom exist: `store/settingsStore.ts` runs stored answers back through them
 * on hydration rather than trusting whatever an older build wrote.
 */
const COPY = Strings.onboarding;

/** Q1 — the hook. */
export type GoalsAnswer = 'scrolling' | 'reels' | 'counts' | 'time' | 'habit';
/** Q2 — the user's own estimate of a day. */
export type AmountAnswer = 'under1' | 'one2' | 'two4' | 'over4' | 'unsure';
/** Q3 — when it gets away from them. */
export type WhenAnswer = 'morning' | 'work' | 'evening' | 'night' | 'unsure';
/** Q4 — what has to keep working. Decides the mode. */
export type KeepAnswer = 'messages' | 'search' | 'subs' | 'posting' | 'nothing';
/** Q5 — what the weekly report measures against. */
export type GoalAnswer = 'half' | 'hour' | 'night' | 'stop';

export type Option<Id extends string> = { id: Id; label: string };

export const GOALS_OPTIONS: readonly Option<GoalsAnswer>[] = [
  { id: 'scrolling', label: COPY.goals.scrolling },
  { id: 'reels', label: COPY.goals.reels },
  { id: 'counts', label: COPY.goals.counts },
  { id: 'time', label: COPY.goals.time },
  { id: 'habit', label: COPY.goals.habit },
];

export const AMOUNT_OPTIONS: readonly Option<AmountAnswer>[] = [
  { id: 'under1', label: COPY.amount.under1 },
  { id: 'one2', label: COPY.amount.one2 },
  { id: 'two4', label: COPY.amount.two4 },
  { id: 'over4', label: COPY.amount.over4 },
  { id: 'unsure', label: COPY.amount.unsure },
];

export const WHEN_OPTIONS: readonly Option<WhenAnswer>[] = [
  { id: 'morning', label: COPY.when.morning },
  { id: 'work', label: COPY.when.work },
  { id: 'evening', label: COPY.when.evening },
  { id: 'night', label: COPY.when.night },
  { id: 'unsure', label: COPY.when.unsure },
];

export const KEEP_OPTIONS: readonly Option<KeepAnswer>[] = [
  { id: 'messages', label: COPY.keep.messages },
  { id: 'search', label: COPY.keep.search },
  { id: 'subs', label: COPY.keep.subs },
  { id: 'posting', label: COPY.keep.posting },
  { id: 'nothing', label: COPY.keep.nothing },
];

export const GOAL_OPTIONS: readonly Option<GoalAnswer>[] = [
  { id: 'half', label: COPY.goal.half },
  { id: 'hour', label: COPY.goal.hour },
  { id: 'night', label: COPY.goal.night },
  { id: 'stop', label: COPY.goal.stop },
];

const MINUTE = 60_000;

/**
 * The daily band each estimate stands for, in ms — the guess the first weekly
 * report compares its measurement against.
 *
 * `null` for "I honestly don't know", and that is the point: a missing guess is
 * a real answer, not a zero. A report that treated it as zero would open by
 * telling someone they were wrong about something they never claimed.
 */
export const AMOUNT_BANDS: Record<
  AmountAnswer,
  { minMs: number; maxMs: number | null } | null
> = {
  under1: { minMs: 0, maxMs: 60 * MINUTE },
  one2: { minMs: 60 * MINUTE, maxMs: 120 * MINUTE },
  two4: { minMs: 120 * MINUTE, maxMs: 240 * MINUTE },
  over4: { minMs: 240 * MINUTE, maxMs: null },
  unsure: null,
};

/**
 * The local-hour window a "when" answer claims: `[startHour, endHour)`, wrapping
 * past midnight. Same shape Rhythm reports its own findings in, so the two are
 * directly comparable.
 *
 * `unsure` claims nothing — that answer is a request for Rhythm to find the
 * window instead, and returning a window there would fabricate the very thing
 * the user said they didn't know.
 */
export const WHEN_WINDOWS: Record<
  WhenAnswer,
  { startHour: number; endHour: number } | null
> = {
  morning: { startHour: 6, endHour: 10 },
  work: { startHour: 9, endHour: 17 },
  evening: { startHour: 18, endHour: 22 },
  night: { startHour: 22, endHour: 2 },
  unsure: null,
};

/** The windows a set of Q3 answers claims, in the order they were offered. */
export function statedWindows(
  answers: readonly WhenAnswer[] | undefined
): { startHour: number; endHour: number }[] {
  if (!answers?.length) return [];
  return WHEN_OPTIONS.map((o) => o.id)
    .filter((id) => answers.includes(id))
    .map((id) => WHEN_WINDOWS[id])
    .filter((w): w is { startHour: number; endHour: number } => w !== null);
}

/** Lowercase phrase for an amount answer, for use mid-sentence (e.g. "you guessed ~"). */
export const AMOUNT_PHRASE: Record<AmountAnswer, string> = {
  under1: 'under an hour',
  one2: '1–2 hours',
  two4: '2–4 hours',
  over4: 'more than 4 hours',
  unsure: "you weren't sure",
};

const idSet = <Id extends string>(options: readonly Option<Id>[]) =>
  new Set<string>(options.map((o) => o.id));

const AMOUNT_IDS = idSet(AMOUNT_OPTIONS);
const WHEN_IDS = idSet(WHEN_OPTIONS);
const KEEP_IDS = idSet(KEEP_OPTIONS);
const GOAL_IDS = idSet(GOAL_OPTIONS);

export const isAmountAnswer = (v: unknown): v is AmountAnswer =>
  typeof v === 'string' && AMOUNT_IDS.has(v);
export const isWhenAnswer = (v: unknown): v is WhenAnswer =>
  typeof v === 'string' && WHEN_IDS.has(v);
export const isKeepAnswer = (v: unknown): v is KeepAnswer =>
  typeof v === 'string' && KEEP_IDS.has(v);
export const isGoalAnswer = (v: unknown): v is GoalAnswer =>
  typeof v === 'string' && GOAL_IDS.has(v);
