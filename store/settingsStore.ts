import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlatformId, PLATFORM_ORDER } from '@/constants/platforms';
import {
  defaultSettingsFor,
  DEFAULT_FEED_LIMIT,
  FEED_LIMIT_MIN,
  FEED_LIMIT_MAX,
  METRIC_FEATURE_KEYS,
  MetricVisibility,
} from '@/constants/features';
import { dayKey } from '@/utils/stats';
import { PRESETS } from '@/constants/presets';
import {
  AmountAnswer,
  GoalAnswer,
  isAmountAnswer,
  isGoalAnswer,
  isKeepAnswer,
  isWhenAnswer,
  KeepAnswer,
  WhenAnswer,
} from '@/constants/survey';

type PlatformSettings = Record<string, boolean | MetricVisibility>;

/** Cross-platform overrides — applied on top of per-platform settings. */
export type MasterSettings = {
  killAllMetrics: boolean;
  killAllBadges: boolean;
  messagesOnly: boolean;
  grayscaleEverything: boolean;
};

const MASTER_DEFAULTS: MasterSettings = {
  killAllMetrics: false,
  killAllBadges: false,
  messagesOnly: false,
  grayscaleEverything: false,
};

type SettingsState = {
  onboarded: boolean;
  goals: string[];
  /**
   * The rest of the onboarding survey. Every field is optional: an install that
   * onboarded before these questions existed hydrates with them undefined, and
   * every reader has to treat "not asked" as its own case anyway — it is not
   * the same as an empty answer.
   */
  /** Q2 — the user's own guess at a day, for the report to compare against. */
  timeEstimate?: AmountAnswer;
  /** Q3 — the window(s) they think they lose time in. Seeds Rhythm's prior. */
  timeOfDay?: WhenAnswer[];
  /** Q4 — what has to keep working. This is what chose the mode. */
  keeps?: KeepAnswer[];
  /** Q5 — what the weekly report measures against, in place of a streak. */
  monthGoal?: GoalAnswer;
  platformEnabled: Record<PlatformId, boolean>;
  platformSettings: Record<PlatformId, PlatformSettings>;
  /** How many posts before "Limit Feed" stops the feed, per platform. */
  feedLimits: Record<PlatformId, number>;
  masterSettings: MasterSettings;
  /** Day a toggle was last switched ON — powers "since enabling" savings lines. */
  toggleEnabledAt: Partial<Record<PlatformId, Record<string, string>>>;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setOnboarded: (value: boolean) => void;
  setGoals: (goals: string[]) => void;
  setTimeEstimate: (value: AmountAnswer) => void;
  setTimeOfDay: (values: WhenAnswer[]) => void;
  setKeeps: (values: KeepAnswer[]) => void;
  setMonthGoal: (value: GoalAnswer) => void;
  applyPreset: (presetId: string) => void;
  setToggle: (platform: PlatformId, key: string, value: boolean) => void;
  setMetricToggle: (platform: PlatformId, key: string, value: MetricVisibility) => void;
  setPlatformEnabled: (platform: PlatformId, value: boolean) => void;
  setFeedLimit: (platform: PlatformId, value: number) => void;
  setMasterToggle: (key: keyof MasterSettings, value: boolean) => void;
  resetPlatform: (platform: PlatformId) => void;
};

function allDefaults() {
  const enabled = {} as Record<PlatformId, boolean>;
  const settings = {} as Record<PlatformId, PlatformSettings>;
  const limits = {} as Record<PlatformId, number>;
  for (const id of PLATFORM_ORDER) {
    enabled[id] = true;
    settings[id] = defaultSettingsFor(id);
    limits[id] = DEFAULT_FEED_LIMIT;
  }
  return { enabled, settings, limits };
}

const clampLimit = (n: number) =>
  Math.max(FEED_LIMIT_MIN, Math.min(FEED_LIMIT_MAX, Math.round(n)));

const initial = allDefaults();

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      onboarded: false,
      goals: [],
      platformEnabled: initial.enabled,
      platformSettings: initial.settings,
      feedLimits: initial.limits,
      masterSettings: { ...MASTER_DEFAULTS },
      toggleEnabledAt: {},
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      setOnboarded: (value) => set({ onboarded: value }),
      setGoals: (goals) => set({ goals }),
      setTimeEstimate: (value) => set({ timeEstimate: value }),
      setTimeOfDay: (values) => set({ timeOfDay: values }),
      setKeeps: (values) => set({ keeps: values }),
      setMonthGoal: (value) => set({ monthGoal: value }),

      applyPreset: (presetId) =>
        set((state) => {
          const preset = PRESETS.find((p) => p.id === presetId);
          if (!preset) return {};
          const newSettings = { ...state.platformSettings };
          const newLimits = { ...state.feedLimits };
          for (const id of PLATFORM_ORDER) {
            if (!state.platformEnabled[id]) continue;
            const merged = { ...newSettings[id] };
            for (const [key, val] of Object.entries(preset.settings)) {
              if (key in merged) merged[key] = val;
            }
            newSettings[id] = merged;
            if (preset.feedLimit) newLimits[id] = preset.feedLimit;
          }
          return {
            platformSettings: newSettings,
            feedLimits: newLimits,
            masterSettings: {
              ...state.masterSettings,
              ...(preset.masterOverrides ?? {}),
            },
          };
        }),

      setMasterToggle: (key, value) =>
        set((state) => ({
          masterSettings: { ...state.masterSettings, [key]: value },
        })),

      setToggle: (platform, key, value) =>
        set((state) => {
          const platEnabled = { ...(state.toggleEnabledAt[platform] ?? {}) };
          if (value) platEnabled[key] = dayKey();
          else delete platEnabled[key];
          return {
            platformSettings: {
              ...state.platformSettings,
              [platform]: { ...state.platformSettings[platform], [key]: value },
            },
            toggleEnabledAt: { ...state.toggleEnabledAt, [platform]: platEnabled },
          };
        }),

      setMetricToggle: (platform, key, value) =>
        set((state) => {
          const platEnabled = { ...(state.toggleEnabledAt[platform] ?? {}) };
          if (value !== 'visible') platEnabled[key] = dayKey();
          else delete platEnabled[key];
          return {
            platformSettings: {
              ...state.platformSettings,
              [platform]: { ...state.platformSettings[platform], [key]: value },
            },
            toggleEnabledAt: { ...state.toggleEnabledAt, [platform]: platEnabled },
          };
        }),

      setPlatformEnabled: (platform, value) =>
        set((state) => ({
          platformEnabled: { ...state.platformEnabled, [platform]: value },
        })),

      setFeedLimit: (platform, value) =>
        set((state) => ({
          feedLimits: { ...state.feedLimits, [platform]: clampLimit(value) },
        })),

      resetPlatform: (platform) =>
        set((state) => ({
          platformSettings: {
            ...state.platformSettings,
            [platform]: defaultSettingsFor(platform),
          },
          feedLimits: { ...state.feedLimits, [platform]: DEFAULT_FEED_LIMIT },
        })),
    }),
    {
      name: 'quiet-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only user data, not the hydration flag or actions.
      partialize: (state) => ({
        onboarded: state.onboarded,
        goals: state.goals,
        timeEstimate: state.timeEstimate,
        timeOfDay: state.timeOfDay,
        keeps: state.keeps,
        monthGoal: state.monthGoal,
        platformEnabled: state.platformEnabled,
        platformSettings: state.platformSettings,
        feedLimits: state.feedLimits,
        masterSettings: state.masterSettings,
        toggleEnabledAt: state.toggleEnabledAt,
      }),
      // Merge stored values over fresh defaults so features added in a later
      // release appear with their default rather than as `undefined`.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<SettingsState>;
        const mergedSettings = {} as Record<PlatformId, PlatformSettings>;
        const mergedLimits = {} as Record<PlatformId, number>;
        for (const id of PLATFORM_ORDER) {
          const defaults = defaultSettingsFor(id);
          const savedPlat = saved.platformSettings?.[id] ?? {};
          const merged = { ...defaults };
          for (const [key, val] of Object.entries(savedPlat)) {
            if (METRIC_FEATURE_KEYS.has(key)) {
              // Migrate old booleans → MetricVisibility
              if (typeof val === 'boolean') {
                merged[key] = val ? 'hidden-both' : 'visible';
              } else {
                merged[key] = val;
              }
            } else {
              merged[key] = val;
            }
          }
          // Instagram migration: old hideLikeButton folds into hideLikeCounts
          if (id === 'instagram' && typeof savedPlat.hideLikeButton === 'boolean') {
            const hadButton = savedPlat.hideLikeButton;
            const hadCounts = savedPlat.hideLikeCounts;
            if (hadButton && !hadCounts) {
              merged.hideLikeCounts = 'hidden-both';
            } else if (hadButton && hadCounts) {
              merged.hideLikeCounts = 'hidden-both';
            } else if (!hadButton && hadCounts) {
              merged.hideLikeCounts = 'hidden-number';
            }
            delete (merged as Record<string, unknown>).hideLikeButton;
          }
          mergedSettings[id] = merged;
          const savedLimit = saved.feedLimits?.[id];
          mergedLimits[id] =
            typeof savedLimit === 'number' ? clampLimit(savedLimit) : DEFAULT_FEED_LIMIT;
        }
        return {
          ...current,
          onboarded: saved.onboarded ?? false,
          goals: saved.goals ?? [],
          timeEstimate: isAmountAnswer(saved.timeEstimate) ? saved.timeEstimate : undefined,
          timeOfDay: Array.isArray(saved.timeOfDay)
            ? saved.timeOfDay.filter(isWhenAnswer)
            : undefined,
          keeps: Array.isArray(saved.keeps) ? saved.keeps.filter(isKeepAnswer) : undefined,
          monthGoal: isGoalAnswer(saved.monthGoal) ? saved.monthGoal : undefined,
          platformEnabled: { ...current.platformEnabled, ...(saved.platformEnabled ?? {}) },
          platformSettings: mergedSettings,
          feedLimits: mergedLimits,
          masterSettings: { ...MASTER_DEFAULTS, ...(saved.masterSettings ?? {}) },
          toggleEnabledAt: saved.toggleEnabledAt ?? {},
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
