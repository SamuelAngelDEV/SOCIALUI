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
  CostAnswer,
  GoalAnswer,
  isAmountAnswer,
  isCostAnswer,
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
  /** Q1 — the consequences they've noticed. Adjusts the mode; see `recommendMode`. */
  costs: CostAnswer[];
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
  setCosts: (values: CostAnswer[]) => void;
  setTimeEstimate: (value: AmountAnswer) => void;
  setTimeOfDay: (values: WhenAnswer[]) => void;
  setKeeps: (values: KeepAnswer[]) => void;
  setMonthGoal: (value: GoalAnswer) => void;
  applyPreset: (
    presetId: string,
    options?: { feedLimit?: number; hideCounts?: boolean }
  ) => void;
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
      costs: [],
      platformEnabled: initial.enabled,
      platformSettings: initial.settings,
      feedLimits: initial.limits,
      masterSettings: { ...MASTER_DEFAULTS },
      toggleEnabledAt: {},
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      setOnboarded: (value) => set({ onboarded: value }),
      setCosts: (values) => set({ costs: values }),
      setTimeEstimate: (value) => set({ timeEstimate: value }),
      setTimeOfDay: (values) => set({ timeOfDay: values }),
      setKeeps: (values) => set({ keeps: values }),
      setMonthGoal: (value) => set({ monthGoal: value }),

      /**
       * Apply a mode as a COMPLETE bundle: reset each enabled platform to its
       * defaults, then write the mode's keys over that.
       *
       * The reset is the whole point. This used to merge, so keys the previous
       * mode had set and the new one didn't mention simply survived — going from
       * the strictest mode to the loosest left search hidden and recommendations
       * blocked, and no mode description could be made true. A mode is a
       * destination, not a layer.
       *
       * Master settings are deliberately NOT touched. They are a user-level
       * "everywhere" choice made in Settings; a mode has no business clearing a
       * global the user set on purpose. Modes work per-platform only.
       */
      applyPreset: (presetId, options) =>
        set((state) => {
          const preset = PRESETS.find((p) => p.id === presetId);
          if (!preset) return {};
          const limit = clampLimit(options?.feedLimit ?? preset.feedLimit);
          const newSettings = { ...state.platformSettings };
          const newLimits = { ...state.feedLimits };
          const newEnabledAt = { ...state.toggleEnabledAt };
          const today = dayKey();
          for (const id of PLATFORM_ORDER) {
            if (!state.platformEnabled[id]) continue;
            const next = defaultSettingsFor(id);
            for (const [key, val] of Object.entries(preset.settings)) {
              if (key in next) next[key] = val;
            }
            // Q1's "I feel worse after" — every count behind its control, but
            // the control itself still works. 'hidden-both' would take away the
            // like button, which nobody asked for.
            if (options?.hideCounts) {
              for (const key of Object.keys(next)) {
                if (METRIC_FEATURE_KEYS.has(key)) next[key] = 'hidden-number';
              }
            }
            newSettings[id] = next;
            newLimits[id] = limit;
            // Stamp what this turned on so the "since you enabled this" savings
            // lines have a start date here too, preserving any earlier stamp so
            // re-applying a mode doesn't reset the clock on an unchanged key.
            const stamps: Record<string, string> = {};
            for (const [key, val] of Object.entries(next)) {
              const on = METRIC_FEATURE_KEYS.has(key) ? val !== 'visible' : val === true;
              if (on) stamps[key] = newEnabledAt[id]?.[key] ?? today;
            }
            newEnabledAt[id] = stamps;
          }
          return {
            platformSettings: newSettings,
            feedLimits: newLimits,
            toggleEnabledAt: newEnabledAt,
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
        costs: state.costs,
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
          // Q1's ids changed when the question did, so anything an older build
          // stored under the previous option set is dropped here rather than
          // carried forward as a value nothing understands.
          costs: Array.isArray(saved.costs) ? saved.costs.filter(isCostAnswer) : [],
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
