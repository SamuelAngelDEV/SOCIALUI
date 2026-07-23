import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlatformId, PLATFORM_ORDER } from '@/constants/platforms';
import {
  defaultSettingsFor,
  DEFAULT_FEED_LIMIT,
  FEED_LIMIT_MIN,
  FEED_LIMIT_MAX,
} from '@/constants/features';

type PlatformSettings = Record<string, boolean>;

type SettingsState = {
  platformEnabled: Record<PlatformId, boolean>;
  platformSettings: Record<PlatformId, PlatformSettings>;
  /** How many posts before "Limit Feed" stops the feed, per platform. */
  feedLimits: Record<PlatformId, number>;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setToggle: (platform: PlatformId, key: string, value: boolean) => void;
  setPlatformEnabled: (platform: PlatformId, value: boolean) => void;
  setFeedLimit: (platform: PlatformId, value: number) => void;
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
      platformEnabled: initial.enabled,
      platformSettings: initial.settings,
      feedLimits: initial.limits,
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setToggle: (platform, key, value) =>
        set((state) => ({
          platformSettings: {
            ...state.platformSettings,
            [platform]: { ...state.platformSettings[platform], [key]: value },
          },
        })),

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
        })),
    }),
    {
      name: 'quiet-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only user data, not the hydration flag or actions.
      partialize: (state) => ({
        platformEnabled: state.platformEnabled,
        platformSettings: state.platformSettings,
        feedLimits: state.feedLimits,
      }),
      // Merge stored values over fresh defaults so features added in a later
      // release appear with their default rather than as `undefined`.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<SettingsState>;
        const mergedSettings = {} as Record<PlatformId, PlatformSettings>;
        const mergedLimits = {} as Record<PlatformId, number>;
        for (const id of PLATFORM_ORDER) {
          mergedSettings[id] = {
            ...defaultSettingsFor(id),
            ...(saved.platformSettings?.[id] ?? {}),
          };
          const savedLimit = saved.feedLimits?.[id];
          mergedLimits[id] =
            typeof savedLimit === 'number' ? clampLimit(savedLimit) : DEFAULT_FEED_LIMIT;
        }
        return {
          ...current,
          platformEnabled: { ...current.platformEnabled, ...(saved.platformEnabled ?? {}) },
          platformSettings: mergedSettings,
          feedLimits: mergedLimits,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
