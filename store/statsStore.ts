import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlatformId } from '@/constants/platforms';
import { Category, dayKey, HourBuckets, HOURS_IN_DAY } from '@/utils/stats';

export type DayStats = {
  /** All values are milliseconds. */
  total: number;
  platforms: Partial<Record<PlatformId, number>>;
  /** Global activity rollup, kept for totals and for pre-upgrade data. */
  categories: Partial<Record<Category, number>>;
  /**
   * Activity split PER platform — what makes "Instagram → Feed 20m" possible.
   * Optional because days recorded before this existed won't have it.
   */
  byPlatform?: Partial<Record<PlatformId, Partial<Record<Category, number>>>>;
  /**
   * Time-of-day split: for each activity category, 24 local-hour buckets of ms
   * (index 0 = 00:00–00:59). Powers Rhythm.
   *
   * Kept per category rather than as one flat 24-bucket array so that the
   * intentional/algorithmic classification stays a pure read-time function
   * (`CATEGORY_KIND` in utils/stats) instead of being baked into stored data —
   * reclassifying a category later must not invalidate history.
   *
   * Optional, exactly like `byPlatform`: days persisted before this field
   * existed load fine and simply contribute no rhythm data.
   */
  hours?: HourBuckets;
};

type StatsState = {
  /** Usage per local day, keyed 'YYYY-MM-DD'. Kept for the last 60 days. */
  days: Record<string, DayStats>;
  /** Week (Monday key) whose report banner was already opened. */
  weeklyShownFor: string | null;
  /** Wipe everything. Only reachable from the dev-only Settings row. */
  resetAll: () => void;
  /**
   * `endedAt` is when the segment closed (defaults to now). The segment is the
   * span [endedAt - ms, endedAt), and it is split across the local hour — and
   * day — boundaries it actually crosses.
   */
  addTime: (platform: PlatformId, category: Category, ms: number, endedAt?: number) => void;
  markWeeklyShown: (week: string) => void;
};

const KEEP_DAYS = 60;

function prune(days: Record<string, DayStats>): Record<string, DayStats> {
  const keys = Object.keys(days);
  if (keys.length <= KEEP_DAYS) return days;
  const sorted = keys.sort(); // ISO keys sort chronologically
  const keep = new Set(sorted.slice(-KEEP_DAYS));
  const out: Record<string, DayStats> = {};
  for (const k of sorted) if (keep.has(k)) out[k] = days[k];
  return out;
}

/** A slice of a segment that falls entirely inside one local hour of one day. */
type Slice = { key: string; hour: number; ms: number };

const HOUR_MS = 3_600_000;
/**
 * Safety stop for the slicing loop. 400 hours is ~16 days — far beyond any real
 * segment, but a device clock jump could produce one. On hitting it the leftover
 * is added to the final slice rather than dropped: totals must never lose time.
 */
const MAX_SLICES = 400;

/**
 * Split [startMs, endMs) into per-local-hour pieces.
 *
 * We split by real elapsed time rather than attributing the whole segment to the
 * hour it started in. A 40-minute scroll that begins at 10:50pm belongs mostly to
 * 11pm, and "after 10:30pm"-style findings are exactly what start-hour
 * attribution would systematically distort. Splitting also keeps the invariant
 * that a day's hour buckets sum to the time recorded for that day, including for
 * segments that run across midnight — those land on the days they happened on.
 */
function sliceByHour(startMs: number, endMs: number): Slice[] {
  const out: Slice[] = [];
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return out;

  let cursor = startMs;
  while (cursor < endMs) {
    const at = new Date(cursor);
    // Start of the NEXT local hour. Going through the Date constructor (rather
    // than +3600000) keeps this correct across DST shifts and day rollovers.
    let boundary = new Date(
      at.getFullYear(), at.getMonth(), at.getDate(), at.getHours() + 1, 0, 0, 0
    ).getTime();
    if (!(boundary > cursor)) boundary = cursor + HOUR_MS; // guarantee progress

    const sliceEnd = Math.min(boundary, endMs);
    const isLast = out.length + 1 >= MAX_SLICES;
    out.push({
      key: dayKey(at),
      hour: at.getHours(),
      ms: (isLast ? endMs : sliceEnd) - cursor,
    });
    if (isLast) break;
    cursor = sliceEnd;
  }
  return out;
}

/** A defensive copy of a 24-slot bucket array — persisted data may be short or absent. */
function toBuckets(existing: number[] | undefined): number[] {
  const next = new Array<number>(HOURS_IN_DAY).fill(0);
  if (existing) {
    for (let h = 0; h < HOURS_IN_DAY; h++) next[h] = existing[h] ?? 0;
  }
  return next;
}

const EMPTY_DAY: DayStats = { total: 0, platforms: {}, categories: {} };

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      days: {},
      weeklyShownFor: null,

      addTime: (platform, category, ms, endedAt) => {
        if (ms < 500) return; // ignore sub-half-second noise
        const end = endedAt ?? Date.now();
        const slices = sliceByHour(end - ms, end);
        // Clock went backwards or the span was unusable — still record the time,
        // on today, rather than losing it.
        if (!slices.length) slices.push({ key: dayKey(), hour: new Date().getHours(), ms });

        set((state) => {
          const days = { ...state.days };
          for (const slice of slices) {
            if (slice.ms <= 0) continue;
            const day = days[slice.key] ?? EMPTY_DAY;
            const platCats = day.byPlatform?.[platform] ?? {};
            const catHours = toBuckets(day.hours?.[category]);
            catHours[slice.hour] += slice.ms;
            days[slice.key] = {
              total: day.total + slice.ms,
              platforms: {
                ...day.platforms,
                [platform]: (day.platforms[platform] ?? 0) + slice.ms,
              },
              categories: {
                ...day.categories,
                [category]: (day.categories[category] ?? 0) + slice.ms,
              },
              byPlatform: {
                ...day.byPlatform,
                [platform]: { ...platCats, [category]: (platCats[category] ?? 0) + slice.ms },
              },
              hours: { ...day.hours, [category]: catHours },
            };
          }
          return { days: prune(days) };
        });
      },

      markWeeklyShown: (week) => set({ weeklyShownFor: week }),

      /**
       * Wipe all recorded time. Dev-only, for testing a first run.
       *
       * Clears the persisted copy as well as the in-memory one, or the next
       * write would re-persist whatever was still in state.
       */
      resetAll: () => {
        useStatsStore.persist.clearStorage();
        set({ days: {}, weeklyShownFor: null });
      },
    }),
    {
      name: 'quiet-stats-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // No custom merge or version bump needed: `hours` is additive and optional,
      // so the default shallow merge loads pre-upgrade days untouched. Every read
      // path treats a missing/short `hours` as zero.
    }
  )
);
