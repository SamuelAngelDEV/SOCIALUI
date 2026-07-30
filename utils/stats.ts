import { PlatformId } from '@/constants/platforms';

export type Category = 'feed' | 'reels' | 'messages' | 'video' | 'other';

export const CATEGORY_LABELS: Record<Category, string> = {
  feed: 'Feed',
  reels: 'Reels & Shorts',
  messages: 'Messages',
  video: 'Watching',
  other: 'Other',
};

/** Map a pathname inside a platform's WebView to a time category. */
export function mapPathToCategory(platform: PlatformId, path: string): Category {
  const p = path.toLowerCase();
  switch (platform) {
    case 'instagram':
      if (p.startsWith('/direct')) return 'messages';
      if (p.startsWith('/reels') || p.startsWith('/reel/')) return 'reels';
      if (p === '/' || p.startsWith('/p/')) return 'feed';
      return 'other';
    case 'youtube':
      if (p.startsWith('/shorts')) return 'reels';
      if (p.startsWith('/watch')) return 'video';
      if (p === '/' || p === '') return 'feed';
      return 'other';
    case 'twitter':
      if (p.startsWith('/messages')) return 'messages';
      if (p === '/home' || p === '/') return 'feed';
      return 'other';
    case 'facebook':
      if (p.startsWith('/messages')) return 'messages';
      if (p.startsWith('/reel')) return 'reels';
      if (p.startsWith('/watch')) return 'video';
      if (p === '/' || p.startsWith('/home')) return 'feed';
      return 'other';
    case 'reddit':
      if (p.startsWith('/message') || p.startsWith('/chat')) return 'messages';
      if (p === '/' || p.startsWith('/r/')) return 'feed';
      return 'other';
    case 'tiktok':
      if (p.startsWith('/messages')) return 'messages';
      return 'reels'; // TikTok is short video wall-to-wall
    case 'linkedin':
      if (p.startsWith('/messaging')) return 'messages';
      if (p.startsWith('/feed') || p === '/') return 'feed';
      return 'other';
    default:
      return 'other';
  }
}

/** Local-time day key, e.g. '2026-07-23'. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday of the week containing d, as a day key — identifies the week. */
export function weekKey(d: Date = new Date()): string {
  const copy = new Date(d);
  const dow = (copy.getDay() + 6) % 7; // Mon=0 … Sun=6
  copy.setDate(copy.getDate() - dow);
  return dayKey(copy);
}

/** The 7 day keys of the week identified by its Monday key, Mon..Sun. */
export function weekDays(monKey: string): string[] {
  const [y, m, d] = monKey.split('-').map(Number);
  const mon = new Date(y, m - 1, d);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(mon);
    day.setDate(mon.getDate() + i);
    return dayKey(day);
  });
}

/** The day keys for the last n days, newest first. `endOffset` skips recent days. */
export function lastNDayKeys(n: number, endOffset = 0): string[] {
  const keys: string[] = [];
  for (let i = endOffset; i < n + endOffset; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(dayKey(d));
  }
  return keys;
}

/** '1h 24m', '4m 32s', '12s'. */
export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const min = Math.floor(s / 60);
  if (min < 60) {
    const rs = s % 60;
    return rs ? `${min}m ${rs}s` : `${min}m`;
  }
  const h = Math.floor(min / 60);
  const rm = min % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

// ---------------------------------------------------------------------------
// Useful vs algorithmic
// ---------------------------------------------------------------------------

export type CategoryKind = 'intentional' | 'algorithmic' | 'unclassified';

/**
 * Which side of the split each activity category falls on.
 *
 * `messages` and `video` are things the user went looking for: a specific person
 * to talk to, a specific video to watch. `feed` and `reels` are things a ranking
 * model chose for them. That distinction — not "which app" — is what we report.
 *
 * `other` is deliberately its own kind rather than being folded into either side.
 * It is the fallback branch of `mapPathToCategory`: profiles, search, notifications,
 * settings, Explore, anything a pathname didn't identify. Some of that is clearly
 * intentional (searching for a person) and some is clearly algorithmic (Explore,
 * "suggested for you"), and we cannot tell which from a URL. Assigning it to
 * either side would move the headline percentage by an amount we could not
 * defend, so it is excluded from the ratio and reported on its own line instead.
 */
export const CATEGORY_KIND: Record<Category, CategoryKind> = {
  messages: 'intentional',
  video: 'intentional',
  feed: 'algorithmic',
  reels: 'algorithmic',
  other: 'unclassified',
};

export const KIND_LABELS: Record<CategoryKind, string> = {
  intentional: 'Chosen by you',
  algorithmic: 'Chosen for you',
  unclassified: 'Unclassified',
};

/** The categories on one side of the split, in display order. */
export function categoriesOfKind(kind: CategoryKind): Category[] {
  return (Object.keys(CATEGORY_KIND) as Category[]).filter((c) => CATEGORY_KIND[c] === kind);
}

export type KindSplit = {
  intentional: number;
  algorithmic: number;
  unclassified: number;
  /** intentional + algorithmic — the only honest denominator for the ratio. */
  classified: number;
  /** Algorithmic share of classified time, 0..1. `null` when nothing is classified. */
  algorithmicShare: number | null;
};

/** Roll a category map up into the useful-vs-algorithmic split. */
export function splitByKind(categories: Partial<Record<Category, number>>): KindSplit {
  const out: KindSplit = {
    intentional: 0,
    algorithmic: 0,
    unclassified: 0,
    classified: 0,
    algorithmicShare: null,
  };
  for (const [cat, ms] of Object.entries(categories) as [Category, number | undefined][]) {
    const kind = CATEGORY_KIND[cat];
    if (!kind || !ms) continue;
    out[kind] += ms;
  }
  out.classified = out.intentional + out.algorithmic;
  if (out.classified > 0) out.algorithmicShare = out.algorithmic / out.classified;
  return out;
}

// ---------------------------------------------------------------------------
// Rhythm — the time of day algorithmic feeds take the most
// ---------------------------------------------------------------------------

export const HOURS_IN_DAY = 24;

/** Local-hour buckets of milliseconds, per activity category. Index 0 = 00:00–00:59. */
export type HourBuckets = Partial<Record<Category, number[]>>;

/** Structural view of a day's stats — avoids a utils → store import cycle. */
type HourSource = { hours?: HourBuckets };

/** How many recent days a Rhythm reading looks at. */
export const RHYTHM_WINDOW_DAYS = 14;
/**
 * Gates, in the same spirit as `utils/savings.ts`: never assert a pattern from
 * one afternoon. All four must hold before a finding is returned.
 */
export const RHYTHM_MIN_DAYS = 3;
export const RHYTHM_MIN_MS = 30 * 60_000;
/** A window has to hold at least this much of the algorithmic time to be worth naming. */
const RHYTHM_MIN_SHARE = 0.3;
/** …and be at least this many times denser than an even spread across the day. */
const RHYTHM_MIN_DENSITY = 1.6;
const RHYTHM_MIN_WINDOW = 2;
const RHYTHM_MAX_WINDOW = 6;

export type HourHistogram = {
  /** 24 buckets of ms. */
  hours: number[];
  total: number;
  /** Days in range that actually carried hour data — the gate for claiming a pattern. */
  daysWithData: number;
};

/**
 * Sum the given categories per local hour across `keys`.
 * Days saved before `hours` existed simply contribute nothing — they are not
 * counted as days-with-data, so they can't prop up a premature finding.
 */
export function hourHistogram(
  days: Record<string, HourSource>,
  keys: string[],
  cats: Category[]
): HourHistogram {
  const hours = new Array<number>(HOURS_IN_DAY).fill(0);
  let total = 0;
  let daysWithData = 0;
  for (const key of keys) {
    const buckets = days[key]?.hours;
    if (!buckets) continue;
    let dayMs = 0;
    for (const cat of cats) {
      const arr = buckets[cat];
      if (!arr) continue;
      for (let h = 0; h < HOURS_IN_DAY; h++) {
        const ms = arr[h] ?? 0;
        if (!ms) continue;
        hours[h] += ms;
        dayMs += ms;
      }
    }
    if (dayMs > 0) daysWithData++;
    total += dayMs;
  }
  return { hours, total, daysWithData };
}

export type RhythmFinding = {
  /** Inclusive local hour the window opens on. */
  startHour: number;
  /** Exclusive local hour it closes on, already wrapped into 0..23. */
  endHour: number;
  lengthHours: number;
  /** Share of algorithmic time inside the window, 0..1. */
  share: number;
  windowMs: number;
  totalMs: number;
  daysWithData: number;
  /** True when the window runs into the small hours — reads better as "after 10pm". */
  openEnded: boolean;
};

/**
 * The contiguous stretch of the day (wrapping past midnight) that holds the most
 * algorithmic time relative to its length. Returns null when the data is too thin
 * or too evenly spread to support a claim — saying nothing is the correct output.
 */
export function findRhythmWindow(histogram: HourHistogram): RhythmFinding | null {
  const { hours, total, daysWithData } = histogram;
  if (daysWithData < RHYTHM_MIN_DAYS || total < RHYTHM_MIN_MS) return null;

  let best: { start: number; length: number; ms: number; score: number } | null = null;
  for (let length = RHYTHM_MIN_WINDOW; length <= RHYTHM_MAX_WINDOW; length++) {
    for (let start = 0; start < HOURS_IN_DAY; start++) {
      let ms = 0;
      for (let i = 0; i < length; i++) ms += hours[(start + i) % HOURS_IN_DAY];
      // Reward concentration, not raw size — otherwise the widest window always wins.
      const score = ms / total - length / HOURS_IN_DAY;
      if (!best || score > best.score) best = { start, length, ms, score };
    }
  }
  if (!best) return null;

  const share = best.ms / total;
  const evenShare = best.length / HOURS_IN_DAY;
  if (share < RHYTHM_MIN_SHARE) return null;
  if (share < evenShare * RHYTHM_MIN_DENSITY) return null;

  const endHour = (best.start + best.length) % HOURS_IN_DAY;
  return {
    startHour: best.start,
    endHour,
    lengthHours: best.length,
    share,
    windowMs: best.ms,
    totalMs: total,
    daysWithData,
    // A window that starts in the evening and spills past midnight is the
    // late-night pattern the user actually recognises; phrase it open-ended.
    openEnded: best.start + best.length > HOURS_IN_DAY && endHour <= 6 && best.start >= 19,
  };
}

/** '10pm', '1am', 'midnight', 'noon'. */
export function formatHour(h: number): string {
  const hour = ((h % HOURS_IN_DAY) + HOURS_IN_DAY) % HOURS_IN_DAY;
  if (hour === 0) return 'midnight';
  if (hour === 12) return 'noon';
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

/** The Rhythm headline. Observational — states the pattern, asks for nothing. */
export function describeRhythm(finding: RhythmFinding): string {
  const pct = Math.round(finding.share * 100);
  return finding.openEnded
    ? `${pct}% of your algorithmic time happened after ${formatHour(finding.startHour)}.`
    : `${pct}% of your algorithmic time happened between ` +
        `${formatHour(finding.startHour)} and ${formatHour(finding.endHour)}.`;
}
