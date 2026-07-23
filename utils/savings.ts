import { PlatformId } from '@/constants/platforms';
import { DayStats } from '@/store/statsStore';
import { Category, dayKey, formatDuration } from './stats';

/**
 * Which of OUR logged time categories a feature would remove, per platform.
 * Only features with an honest mapping appear here — anything else shows no
 * estimate rather than a fabricated one. (blockStories, blockExplore etc. aren't
 * separable in the category data, so they are deliberately absent.)
 */
const IMPACT: Partial<Record<PlatformId, Record<string, Category[]>>> = {
  instagram: {
    blockReels: ['reels'],
    dmsOnly: ['feed', 'reels', 'video', 'other'],
  },
  youtube: {
    blockShorts: ['reels'],
    searchOnly: ['feed'],
    blockRecommendations: ['feed'],
  },
  twitter: {
    dmsOnly: ['feed', 'reels', 'video', 'other'],
  },
  tiktok: {
    blockFYP: ['reels'],
    dmsOnly: ['feed', 'reels', 'video', 'other'],
  },
  facebook: {
    blockReels: ['reels'],
    blockWatch: ['video'],
  },
  linkedin: {
    hideFeed: ['feed'],
    dmsOnly: ['feed', 'reels', 'video', 'other'],
  },
};

const MIN_DAYS_OF_DATA = 3;
const MIN_MS_TO_MENTION = 60_000; // under a minute isn't worth a line

function lastNDayKeys(n: number, endOffset = 0): string[] {
  const keys: string[] = [];
  for (let i = endOffset; i < n + endOffset; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(dayKey(d));
  }
  return keys;
}

function sumCategories(
  days: Record<string, DayStats>,
  keys: string[],
  platform: PlatformId,
  cats: Category[]
): { ms: number; daysWithData: number } {
  let ms = 0;
  let daysWithData = 0;
  for (const k of keys) {
    const day = days[k];
    if (!day || !(day.platforms[platform] ?? 0)) continue;
    daysWithData++;
    for (const c of cats) ms += day.categories[c] ?? 0;
  }
  return { ms, daysWithData };
}

/**
 * The savings line for a settings row, or null for features with no honest
 * mapping (no line rendered at all).
 *
 * OFF  → projection from the user's own last 7 days.
 * ON   → achieved change since the enable date, when there's enough history.
 */
export function getSavingsLine(
  platform: PlatformId,
  featureKey: string,
  isOn: boolean,
  days: Record<string, DayStats>,
  enabledAt?: string
): string | null {
  const cats = IMPACT[platform]?.[featureKey];
  if (!cats) return null;

  if (!isOn) {
    const week = sumCategories(days, lastNDayKeys(7), platform, cats);
    if (week.daysWithData < MIN_DAYS_OF_DATA) return 'Learning your patterns…';
    if (week.ms < MIN_MS_TO_MENTION) return null; // nothing meaningful to save
    return `~${formatDuration(week.ms)} of your last 7 days went here.`;
  }

  if (!enabledAt) return null;
  const allKeys = Object.keys(days).sort();
  const before = allKeys.filter((k) => k < enabledAt);
  const after = allKeys.filter((k) => k >= enabledAt);
  if (after.length < MIN_DAYS_OF_DATA) return null; // too early to claim anything

  const afterSum = sumCategories(days, after, platform, cats);
  if (before.length >= MIN_DAYS_OF_DATA) {
    const beforeSum = sumCategories(days, before, platform, cats);
    const beforeRate = beforeSum.ms / Math.max(beforeSum.daysWithData, 1);
    const afterRate = afterSum.ms / Math.max(afterSum.daysWithData, 1);
    const saved = beforeRate - afterRate;
    if (saved > 30_000) {
      return `Down ~${formatDuration(saved)}/day since you turned this on.`;
    }
    return null; // no measurable change — say nothing rather than spin
  }

  // No usable "before" period — report the near-zero present honestly.
  if (afterSum.ms < MIN_MS_TO_MENTION) {
    return 'Holding at ~0m since you turned this on.';
  }
  return null;
}
