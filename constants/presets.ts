import type { MetricVisibility } from './features';
import type { CostAnswer, KeepAnswer } from './survey';

/**
 * A mode is a named bundle of settings applied to every enabled platform.
 *
 * Modes are named for the JOB, not for how much they block. "Calm / Focus /
 * Strict" tells you the intensity dial position; it doesn't tell you which one
 * to pick. "Looking something up" does — you came for a tutorial and don't want
 * a feed.
 *
 * The three below map to distinct reasons people open one of these apps at all:
 *   - they came to reply to someone
 *   - they came to see what people posted, without the tail
 *   - they came to look one thing up
 *
 * TWO RULES THIS FILE HAS TO KEEP
 *
 * 1. Every mode sets every key it depends on, explicitly, including the `false`
 *    ones. `applyPreset` resets a platform to its defaults before writing these,
 *    so an omitted key means "the default", not "leave whatever was there" — and
 *    a description can only be true if the payload actually says all of it.
 *
 * 2. A mode never promises something the app cannot do yet. A scheduled mode
 *    ("normal during the day, locked down at night") is the obvious fourth entry
 *    and is deliberately absent: it needs a stored window and a time-of-day
 *    branch at the injection call site, and shipping the card without them would
 *    be exactly the unbacked claim `utils/reclaimed.ts` exists to prevent.
 *    Until that lands, Q1's `sleep`/`focus` answers tighten the cap instead.
 */
export type Preset = {
  id: string;
  /** Shown as the card title. Should read as a situation, not an intensity. */
  name: string;
  /** One line: what survives, so the tradeoff is visible before tapping. */
  description: string;
  settings: Record<string, boolean | MetricVisibility>;
  feedLimit: number;
};

/**
 * The ranked surfaces — the ones nobody installs this app to keep. Every mode
 * sets all of them, so no mode can silently leave one on.
 *
 * Keys a platform doesn't define are dropped by `applyPreset`, which is why this
 * can name both Instagram's and YouTube's without either of them breaking.
 */
const RANKED = {
  blockReels: true,
  blockShorts: true,
  blockSuggested: true,
  blockSponsored: true,
  blockExplore: true,
  blockRecommendations: true,
} as const;

export const PRESETS: Preset[] = [
  {
    id: 'finite',
    name: 'Ten posts, then it ends',
    description:
      "Your friends' posts, capped at ten. You reach the end and it tells you, instead of refilling.",
    settings: {
      ...RANKED,
      blockStories: false,
      hideSearchBar: false,
      searchOnly: false,
      dmsOnly: false,
      limitFeed: true,
    },
    feedLimit: 10,
  },
  {
    id: 'inbox',
    name: 'Messages only',
    description:
      'Instagram opens straight to your inbox. YouTube keeps search only — it has no inbox to open.',
    settings: {
      ...RANKED,
      blockStories: true,
      // Search stays reachable — you still need to find the person to message.
      hideSearchBar: false,
      dmsOnly: true,
      // `dmsOnly` is an Instagram key; YouTube has no inbox for it to mean
      // anything on. Without this, "messages only" would leave YouTube's home
      // feed browsable and the mode would be lying about one of its two
      // platforms. `searchOnly` is the nearest true equivalent there.
      searchOnly: true,
      limitFeed: true,
    },
    feedLimit: 3,
  },
  {
    id: 'lookup',
    name: 'Looking something up',
    description:
      'Search and the people you follow still work. No home feed, no recommendations, no Shorts.',
    settings: {
      ...RANKED,
      blockStories: true,
      hideSearchBar: false,
      searchOnly: true,
      dmsOnly: false,
      limitFeed: true,
    },
    feedLimit: 3,
  },
];

export const DEFAULT_PRESET_ID = 'finite';

/** Cap used when Q1 says the cost is sleep or focus — the same mode, less rope. */
const TIGHT_FEED_LIMIT = 5;

export type Recommendation = {
  presetId: string;
  /** Completes "Recommended because …". Stated so the pick is auditable. */
  reason: string;
  /** Overrides the mode's own cap. Set when Q1 argues for less rope. */
  feedLimit?: number;
  /** Q1's `mood`: put every count behind its control. */
  hideCounts: boolean;
  /** Second line on the card, when a Q1 answer changed something. */
  note?: string;
};

/**
 * Two axes, deterministic, no voting.
 *
 * The previous version summed fifteen votes across four questions, and seven of
 * them pointed at the same mode — so Q1 could outvote Q4, the question that is
 * actually about what has to keep working. Here Q4 alone picks the shape, and Q1
 * only adjusts it. Each question does one job and the result is explainable in a
 * sentence, which is what lets the card say *why* it was recommended.
 */
export function recommendMode(
  cost: readonly CostAnswer[],
  keeps: readonly KeepAnswer[]
): Recommendation {
  const hideCounts = cost.includes('mood');
  const tighten = cost.includes('sleep') || cost.includes('focus');

  // ── Axis 1: what has to keep working decides the shape ──────────────────
  let presetId: string;
  let reason: string;
  if (keeps.includes('nothing')) {
    presetId = 'inbox';
    reason = 'you said you want out for a while';
  } else if (keeps.includes('search') || keeps.includes('subs')) {
    presetId = 'lookup';
    reason = 'you need search and the people you follow to keep working';
  } else if (keeps.includes('messages') && !keeps.includes('posting')) {
    presetId = 'inbox';
    reason = 'messages are the only part you said you need';
  } else {
    presetId = DEFAULT_PRESET_ID;
    reason = "you still want to see what people posted, just not endlessly";
  }

  // ── Axis 2: what it costs adjusts that shape, never overrides it ────────
  const notes: string[] = [];
  let feedLimit: number | undefined;
  if (tighten && presetId === DEFAULT_PRESET_ID) {
    feedLimit = TIGHT_FEED_LIMIT;
    notes.push(
      cost.includes('sleep')
        ? `Capped at ${TIGHT_FEED_LIMIT} rather than ten, since it's costing you sleep`
        : `Capped at ${TIGHT_FEED_LIMIT} rather than ten, since it's breaking up your work`
    );
  }
  if (hideCounts) {
    notes.push("Like and follower counts are hidden — they're what a comparison runs on");
  }

  return {
    presetId,
    reason,
    feedLimit,
    hideCounts,
    note: notes.length ? `${notes.join('. ')}.` : undefined,
  };
}
