import type { MetricVisibility } from './features';
import type { MasterSettings } from '@/store/settingsStore';

/**
 * A mode is a named bundle of settings applied to every enabled platform.
 *
 * Modes are named for the JOB, not for how much they block. "Calm / Focus /
 * Strict" tells you the intensity dial position; it doesn't tell you which one
 * to pick. "Look it up" does — you came for a tutorial and don't want a feed.
 *
 * The five below map to distinct reasons people install a blocker at all:
 *   - they came to reply to someone
 *   - they came to look something up
 *   - they want to see friends' posts without the tail
 *   - the problem is specifically at night
 *   - they want out for a while
 */
export type Preset = {
  id: string;
  /** Shown as the card title. Should read as a situation, not an intensity. */
  name: string;
  /** One line: what survives, so the tradeoff is visible before tapping. */
  description: string;
  settings: Record<string, boolean | MetricVisibility>;
  feedLimit?: number;
  masterOverrides?: Partial<MasterSettings>;
  /** Marks a mode that needs extra setup after onboarding (a window, a duration). */
  needsSetup?: 'window' | 'duration';
};

/** Applied by every mode — the surfaces nobody installs this app to keep. */
const BASE = {
  blockReels: true,
  blockShorts: true,
  blockSuggested: true,
  blockSponsored: true,
};

export const PRESETS: Preset[] = [
  {
    id: 'messages',
    name: 'Just messages',
    description: 'Opens straight to your inbox. No feed to walk past on the way.',
    settings: { ...BASE, blockExplore: true, limitFeed: true },
    feedLimit: 3,
    masterOverrides: { messagesOnly: true, killAllMetrics: true },
  },
  {
    id: 'lookup',
    name: 'Look it up',
    description:
      'Search and your subscriptions work. No home feed, no recommendations, no Shorts.',
    settings: {
      ...BASE,
      blockExplore: true,
      blockRecommendations: true,
      searchOnly: true,
      hideSearchBar: false,
    },
    masterOverrides: { killAllMetrics: true },
  },
  {
    id: 'keepup',
    name: 'Keep up',
    description:
      "Friends' posts, capped at 10, then it ends. No Explore, no Reels, no suggested.",
    settings: { ...BASE, blockExplore: true, limitFeed: true },
    feedLimit: 10,
  },
  {
    id: 'afterhours',
    name: 'After hours',
    description:
      'Normal during the day. Locks down inside the window where you lose the most time.',
    settings: { ...BASE },
    needsSetup: 'window',
  },
  {
    id: 'reset',
    name: 'Reset',
    description: 'Everything off for a set number of days. Messages still get through.',
    settings: {
      ...BASE,
      blockExplore: true,
      blockRecommendations: true,
      limitFeed: true,
      hideSearchBar: true,
    },
    feedLimit: 3,
    masterOverrides: { messagesOnly: true, killAllMetrics: true, killAllBadges: true },
    needsSetup: 'duration',
  },
];

/**
 * Maps a survey answer to the mode it argues for. Several answers can point at
 * the same mode; the winner is whichever collects the most votes.
 */
const GOAL_TO_PRESET: Record<string, string> = {
  // "what's pulling you in"
  scrolling: 'keepup',
  reels: 'keepup',
  counts: 'keepup',
  time: 'keepup',
  habit: 'messages',
  // "what do you want to keep"
  keep_messages: 'messages',
  keep_search: 'lookup',
  keep_subs: 'lookup',
  keep_posting: 'keepup',
  keep_nothing: 'reset',
  // "when does it get away from you"
  when_night: 'afterhours',
  // "what would success look like"
  goal_half: 'keepup',
  goal_hour: 'keepup',
  goal_night: 'afterhours',
  goal_stop: 'reset',
};

export function presetForGoals(goals: string[]): string {
  const scores: Record<string, number> = {};
  for (const g of goals) {
    const p = GOAL_TO_PRESET[g];
    if (!p) continue;
    scores[p] = (scores[p] ?? 0) + 1;
  }
  let best = 'keepup'; // the safest default: still shows you your friends
  let max = 0;
  for (const [id, score] of Object.entries(scores)) {
    if (score > max) {
      best = id;
      max = score;
    }
  }
  return best;
}
