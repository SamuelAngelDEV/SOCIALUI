import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlatformId } from '@/constants/platforms';
import { Category, dayKey } from '@/utils/stats';

export type DayStats = {
  /** All values are milliseconds. */
  total: number;
  platforms: Partial<Record<PlatformId, number>>;
  categories: Partial<Record<Category, number>>;
};

type StatsState = {
  /** Usage per local day, keyed 'YYYY-MM-DD'. Kept for the last 60 days. */
  days: Record<string, DayStats>;
  /** Week (Monday key) whose report banner was already opened. */
  weeklyShownFor: string | null;
  addTime: (platform: PlatformId, category: Category, ms: number) => void;
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

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      days: {},
      weeklyShownFor: null,

      addTime: (platform, category, ms) => {
        if (ms < 500) return; // ignore sub-half-second noise
        set((state) => {
          const key = dayKey();
          const day = state.days[key] ?? { total: 0, platforms: {}, categories: {} };
          const next: DayStats = {
            total: day.total + ms,
            platforms: { ...day.platforms, [platform]: (day.platforms[platform] ?? 0) + ms },
            categories: { ...day.categories, [category]: (day.categories[category] ?? 0) + ms },
          };
          return { days: prune({ ...state.days, [key]: next }) };
        });
      },

      markWeeklyShown: (week) => set({ weeklyShownFor: week }),
    }),
    {
      name: 'quiet-stats-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
