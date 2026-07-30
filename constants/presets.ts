import type { MetricVisibility } from './features';
import type { MasterSettings } from '@/store/settingsStore';

export type Preset = {
  id: string;
  name: string;
  description: string;
  settings: Record<string, boolean | MetricVisibility>;
  feedLimit?: number;
  masterOverrides?: Partial<MasterSettings>;
};

export const PRESETS: Preset[] = [
  {
    id: 'calm',
    name: 'Calm Feed',
    description: 'Blocks Reels, Shorts, and Explore. Keeps everything else.',
    settings: {
      blockReels: true,
      blockExplore: true,
      blockShorts: true,
      blockSuggested: true,
      blockSponsored: true,
      blockRecommendations: true,
    },
  },
  {
    id: 'focus',
    name: 'Focus',
    description: 'Calm Feed plus hidden counts and a feed limit.',
    settings: {
      blockReels: true,
      blockExplore: true,
      blockShorts: true,
      blockSuggested: true,
      blockSponsored: true,
      blockRecommendations: true,
      limitFeed: true,
    },
    feedLimit: 10,
    masterOverrides: { killAllMetrics: true },
  },
  {
    id: 'dms',
    name: 'DMs Only',
    description: 'Goes straight to your inbox. Everything else hidden.',
    settings: {
      blockReels: true,
      blockExplore: true,
      blockShorts: true,
      blockSuggested: true,
      blockSponsored: true,
      blockRecommendations: true,
      limitFeed: true,
    },
    feedLimit: 10,
    masterOverrides: { killAllMetrics: true, messagesOnly: true },
  },
];

const GOAL_TO_PRESET: Record<string, string> = {
  scrolling: 'calm',
  reels: 'calm',
  counts: 'focus',
  time: 'focus',
  habit: 'dms',
};

export function presetForGoals(goals: string[]): string {
  const scores: Record<string, number> = {};
  for (const g of goals) {
    const p = GOAL_TO_PRESET[g] ?? 'calm';
    scores[p] = (scores[p] ?? 0) + 1;
  }
  let best = 'calm';
  let max = 0;
  for (const [id, score] of Object.entries(scores)) {
    if (score > max) {
      best = id;
      max = score;
    }
  }
  return best;
}
