import { PlatformId } from '@/constants/platforms';

export type Category =
  | 'feed'
  | 'reels'
  | 'explore'
  | 'messages'
  | 'video'
  | 'search'
  | 'other';

export const CATEGORY_LABELS: Record<Category, string> = {
  feed: 'Feed',
  reels: 'Reels & Shorts',
  explore: 'Explore',
  messages: 'Messages',
  video: 'Watching',
  search: 'Search',
  other: 'Other',
};

/**
 * What a category is called on a given platform.
 *
 * Storage stays one category per *kind of surface* — Instagram Reels, YouTube
 * Shorts and TikTok's For You page are the same thing wearing three brand
 * names, and splitting them in storage would need a data migration to buy
 * nothing. The naming is a read-time concern, so it lives here: the user sees
 * the word their app uses, and `CATEGORY_KIND` still has one row to reason about.
 *
 * Falls back to `CATEGORY_LABELS` for anything not overridden.
 */
const PLATFORM_CATEGORY_LABELS: Partial<
  Record<PlatformId, Partial<Record<Category, string>>>
> = {
  instagram: { reels: 'Reels', feed: 'Feed', video: 'Video' },
  youtube: { reels: 'Shorts', feed: 'Home', video: 'Videos' },
  tiktok: { reels: 'For You', feed: 'For You' },
  facebook: { reels: 'Reels', video: 'Watch' },
  twitter: { feed: 'Timeline' },
  reddit: { feed: 'Subreddits', explore: 'Popular' },
  linkedin: { feed: 'Feed' },
};

/** The label for `category` as `platform` names it. */
export function categoryLabel(platform: PlatformId, category: Category): string {
  return PLATFORM_CATEGORY_LABELS[platform]?.[category] ?? CATEGORY_LABELS[category];
}

/**
 * Reduce whatever the WebView handed us to a bare, comparable pathname.
 *
 * The engine sends `location.pathname`, but this function is the only thing
 * standing between a URL and a permanently-recorded category, so it does not
 * assume that: a full href, a query string or a fragment are all tolerated.
 * Trailing slashes are stripped (except on the root) because the exact-match
 * branches below would otherwise miss — `/home/` and `/home` are the same page,
 * and Instagram and LinkedIn both serve trailing-slash canonical URLs.
 */
function normalizePath(path: string): string {
  let p = (path || '').trim();
  if (!p) return '/';
  if (p.includes('://')) {
    // A full URL slipped through. Take the pathname without needing URL().
    const afterScheme = p.slice(p.indexOf('://') + 3);
    const slash = afterScheme.indexOf('/');
    p = slash === -1 ? '/' : afterScheme.slice(slash);
  }
  p = p.split('?')[0].split('#')[0].toLowerCase();
  if (!p.startsWith('/')) p = '/' + p;
  // '/' must survive; '/r/foo/' becomes '/r/foo'.
  while (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

/**
 * Does `p` contain `seg` as a whole path segment?
 *
 * Substring matching is wrong here and it fails quietly: `/r/searchengines`
 * contains the substring `/search`, so a naive `includes` would book every
 * visit to that subreddit as search time, permanently and invisibly. Splitting
 * on '/' is the only test that can't do that.
 */
function hasSegment(p: string, seg: string): boolean {
  return p.split('/').filter(Boolean).includes(seg);
}

/** Map a pathname inside a platform's WebView to a time category. */
export function mapPathToCategory(platform: PlatformId, path: string): Category {
  const p = normalizePath(path);
  switch (platform) {
    case 'instagram':
      if (p.startsWith('/direct')) return 'messages';
      // '/reels' is the Reels tab and '/reel/{id}' a single reel — the app's own
      // route guards in injection/instagram.ts key on exactly these two shapes.
      if (p.startsWith('/reels') || p.startsWith('/reel/')) return 'reels';
      // Search lives UNDER explore ('/explore/search/keyword'), so it has to be
      // tested first or every search is booked as algorithmic Explore time.
      if (p.startsWith('/explore/search')) return 'search';
      if (p.startsWith('/explore')) return 'explore';
      if (p === '/' || p.startsWith('/p/')) return 'feed';
      return 'other';
    case 'youtube':
      if (p.startsWith('/shorts')) return 'reels';
      if (p.startsWith('/watch')) return 'video';
      // '/results' is where '?search_query=' lands; the query is already stripped.
      if (p.startsWith('/results')) return 'search';
      if (p.startsWith('/feed/explore') || p.startsWith('/feed/trending')) return 'explore';
      if (p === '/') return 'feed';
      return 'other';
    case 'twitter':
      if (p.startsWith('/messages')) return 'messages';
      if (p.startsWith('/search')) return 'search';
      if (p.startsWith('/explore')) return 'explore';
      if (p === '/home' || p === '/') return 'feed';
      return 'other';
    case 'facebook':
      if (p.startsWith('/messages')) return 'messages';
      if (p.startsWith('/reel')) return 'reels';
      if (p.startsWith('/watch')) return 'video';
      if (p.startsWith('/search')) return 'search';
      // m.facebook.com still serves the old '/home.php' alongside '/'.
      if (p === '/' || p.startsWith('/home')) return 'feed';
      return 'other';
    case 'reddit':
      if (p.startsWith('/message') || p.startsWith('/chat')) return 'messages';
      // A comment permalink ('/r/{sub}/comments/{id}/{slug}') is a specific
      // thread the user opened, not the ranked subreddit listing. Both live
      // under '/r/', so the listing test has to exclude it — otherwise every
      // thread read is booked as algorithmic feed time and the headline
      // useful-vs-algorithmic split is inflated on Reddit's heaviest surface.
      if (p.includes('/comments/')) return 'other';
      // Subreddit search is '/r/{sub}/search', so this can't be a prefix test
      // and can't be a substring one either — see `hasSegment`.
      if (hasSegment(p, 'search')) return 'search';
      // r/popular and r/all are Reddit's cross-subreddit ranked listings — the
      // same job Explore does elsewhere, and not a subreddit the user chose.
      if (p === '/r/popular' || p === '/r/all') return 'explore';
      if (p === '/' || p.startsWith('/r/')) return 'feed';
      return 'other';
    case 'tiktok':
      if (p.startsWith('/messages')) return 'messages';
      // Search is the one TikTok surface the user drives themselves; everything
      // else really is the short-video wall.
      if (p.startsWith('/search')) return 'search';
      return 'reels';
    case 'linkedin':
      if (p.startsWith('/messaging')) return 'messages';
      if (p.startsWith('/search')) return 'search';
      if (p.startsWith('/feed') || p === '/') return 'feed';
      return 'other';
    default:
      return 'other';
  }
}

// ---------------------------------------------------------------------------
// Idle
// ---------------------------------------------------------------------------

/**
 * How long after the last real interaction we keep crediting time.
 *
 * A WebView left open on a feed accrues time forever otherwise — the phone put
 * down mid-scroll is the single largest source of over-counting, and it inflates
 * exactly the algorithmic categories the product's headline claim is about.
 * 60s is chosen to sit comfortably above the gap between two deliberate reads of
 * a long post or comment thread (which produce no touch events at all) while
 * still capping an abandoned session at one minute of phantom use.
 */
export const IDLE_GRACE_MS = 60_000;

/**
 * The instant a segment should be treated as having ended.
 *
 * Normally that is `now`. If the last interaction is further back than the grace
 * window, the segment is cut off at `lastActivityAt + graceMs` and the dead span
 * after it is discarded. Never returns a value before `start`, so a segment can
 * shrink to zero but never go negative — a clamp must not be able to invent
 * time, and the caller relies on `end - start >= 0`.
 */
export function effectiveSegmentEnd(
  start: number,
  now: number,
  lastActivityAt: number,
  graceMs: number
): number {
  const cutoff = lastActivityAt + graceMs;
  if (cutoff >= now) return now;
  return cutoff > start ? cutoff : start;
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
 * `messages`, `video` and `search` are things the user went looking for: a
 * specific person, a specific video, a specific query. `feed`, `reels` and
 * `explore` are things a ranking model chose for them. That distinction — not
 * "which app" — is what we report.
 *
 * `other` is deliberately its own kind rather than being folded into either
 * side: profiles, notifications, settings, anything a pathname didn't identify.
 * Assigning it would move the headline percentage by an amount we could not
 * defend, so it is excluded from the ratio and reported on its own line.
 *
 * WHY `explore` AND `search` EXIST AS THEIR OWN CATEGORIES.
 *
 * Both used to fall through to `other`, and the comment here used to justify
 * that by saying we "cannot tell which from a URL". That was true of the
 * bucket, not of its contents — Explore and a search results page have their
 * own routes on every platform, and both were being discarded from the ratio
 * only because nothing was reading those routes. The honest fix was to read
 * them, not to keep declining to classify. This shrinks `other` and moves real
 * time into `classified`, which is the only denominator the headline uses.
 *
 * Note the direction is not self-serving: `search` lands on the intentional
 * side and so pushes the algorithmic percentage DOWN. A change that could only
 * ever inflate the number the product is arguing about would not be worth
 * making.
 */
export const CATEGORY_KIND: Record<Category, CategoryKind> = {
  messages: 'intentional',
  video: 'intentional',
  search: 'intentional',
  feed: 'algorithmic',
  reels: 'algorithmic',
  explore: 'algorithmic',
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

/** '10pm–2am'. The shared spelling of a local-hour window. */
export function formatHourRange(startHour: number, endHour: number): string {
  return `${formatHour(startHour)}–${formatHour(endHour)}`;
}

/** The Rhythm headline. Observational — states the pattern, asks for nothing. */
export function describeRhythm(finding: RhythmFinding): string {
  const pct = Math.round(finding.share * 100);
  return finding.openEnded
    ? `${pct}% of your algorithmic time happened after ${formatHour(finding.startHour)}.`
    : `${pct}% of your algorithmic time happened between ` +
        `${formatHour(finding.startHour)} and ${formatHour(finding.endHour)}.`;
}
