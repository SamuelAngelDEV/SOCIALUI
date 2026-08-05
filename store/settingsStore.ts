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
import { DEFAULT_THEME, isThemeId, ThemeId } from '@/constants/themes';
import { QuietWindow, windowLengthHours } from '@/utils/schedule';
import {
  cancel,
  DEFAULT_DELAY_HOURS,
  normalizeDelayHours,
  PendingChange,
  resolve,
  schedule,
  upsert,
} from '@/utils/commitment';

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

/**
 * Quiet Hours — the daily window the user asked to be kept out of.
 *
 * Additive, like `byPlatform`/`hours` in statsStore: an install predating it
 * hydrates to the default and every reader treats a missing or degenerate
 * window as off, so no store version bump is needed.
 *
 * There is deliberately no per-platform field here. It would apply to every
 * WebView platform either way in this iteration, and a stored setting that
 * nothing reads is the `needsSetup: 'window'` mistake this codebase has already
 * paid for once — add it when something consumes it.
 */
export type QuietHours = QuietWindow & {
  enabled: boolean;
  /**
   * Where the window came from. Read by QuietHoursOverlay, which says "you set
   * this from your own measured pattern" — a sentence that is only true for
   * 'rhythm', so the distinction is stored rather than assumed.
   */
  source: 'rhythm' | 'manual';
};

/** 10pm–2am is only the picker's starting position; `enabled` gates everything. */
const QUIET_HOURS_DEFAULT: QuietHours = {
  enabled: false,
  startHour: 22,
  endHour: 2,
  source: 'manual',
};

const isHour = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 23;

/** Re-validated on hydration rather than trusting whatever an older build wrote. */
function validQuietHours(saved: unknown): QuietHours {
  if (!saved || typeof saved !== 'object') return { ...QUIET_HOURS_DEFAULT };
  const q = saved as Partial<QuietHours>;
  if (!isHour(q.startHour) || !isHour(q.endHour)) return { ...QUIET_HOURS_DEFAULT };
  return {
    enabled: q.enabled === true,
    startHour: q.startHour,
    endHour: q.endHour,
    source: q.source === 'rhythm' ? 'rhythm' : 'manual',
  };
}

// ---------------------------------------------------------------------------
// Delayed disable — see utils/commitment.ts for the reasoning
// ---------------------------------------------------------------------------

/**
 * The cooldown starts OFF, and `DEFAULT_DELAY_HOURS` is what it becomes when
 * the user turns it on.
 *
 * Two reasons it cannot ship on by default. It would trap anyone still
 * exploring: lowering the delay is itself delayed, so a person who turned it up
 * and changed their mind waits a full day to undo it. And a commitment device
 * only does any work when it was chosen — imposed friction gets uninstalled,
 * which protects nobody. The app offers it once there is something worth
 * protecting.
 */
const INITIAL_DELAY_HOURS = 0;

/** The pending key for Quiet Hours. */
export const PENDING_QUIET_HOURS = 'quietHours';
const MASTER_PREFIX = 'master:';
/** The pending key for lowering the cooldown itself. */
export const PENDING_DELAY = 'disableDelay';

export const masterPendingKey = (key: keyof MasterSettings) => `${MASTER_PREFIX}${key}`;

/**
 * Is this window actually keeping the user out of anything?
 *
 * Both halves matter. `enabled: false` is the obvious off switch, but a
 * zero-length window is equally off — `isWithinWindow` treats `start === end`
 * as never active — so dragging the start hour onto the end hour would
 * otherwise be an instant, undelayed way to switch the whole feature off. One
 * predicate covers both, which is why this asks what the window DOES rather
 * than which field changed.
 */
const isProtecting = (q: QuietHours) => q.enabled && windowLengthHours(q) > 0;

/** Pending entries re-validated on hydration, like every other persisted shape. */
function validPendingChanges(saved: unknown): PendingChange[] {
  if (!Array.isArray(saved)) return [];
  return saved.filter(
    (c): c is PendingChange =>
      !!c &&
      typeof c === 'object' &&
      typeof (c as PendingChange).key === 'string' &&
      Number.isFinite((c as PendingChange).effectiveAt) &&
      Number.isFinite((c as PendingChange).requestedAt)
  );
}

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
  /**
   * The exact ms/day the Q2 slider was left on.
   *
   * Kept alongside `timeEstimate` rather than replacing it: the band still
   * drives `recommendMode` and `AMOUNT_PHRASE`, and an install that answered
   * before the slider existed has a band but no exact figure. Readers must
   * treat a missing value as "not asked", not as zero.
   */
  timeEstimateMsPerDay?: number;
  /** Only used to turn a yearly figure into a remaining-life one. Optional. */
  age?: number;
  /** Q3 — the window(s) they think they lose time in. Seeds Rhythm's prior. */
  timeOfDay?: WhenAnswer[];
  /** Q4 — what has to keep working. This is what chose the mode. */
  keeps?: KeepAnswer[];
  /** Q5 — what the weekly report measures against, in place of a streak. */
  monthGoal?: GoalAnswer;
  /** Filters apply to this platform. Gates injection in `app/platform/[id].tsx`. */
  platformEnabled: Record<PlatformId, boolean>;
  /**
   * The user says they use this app at all — it appears on the home grid.
   *
   * A SEPARATE axis from `platformEnabled`, because onboarding asks two
   * questions: which apps are yours, and which of those you want changed. An
   * app can be in use and deliberately unrestricted (time still counted, feed
   * untouched); collapsing the two would make "just track this one" impossible
   * to express, and tracking without restricting is the honest starting point
   * for someone who doesn't yet know what they want blocked.
   *
   * Defaults to all-true so an install predating the picker is unchanged.
   */
  platformInUse: Record<PlatformId, boolean>;
  platformSettings: Record<PlatformId, PlatformSettings>;
  /** How many posts before "Limit Feed" stops the feed, per platform. */
  feedLimits: Record<PlatformId, number>;
  masterSettings: MasterSettings;
  /** The daily window the user asked to be kept out of. Off by default. */
  quietHours: QuietHours;
  /**
   * How long a request to weaken a protection waits before it applies.
   * 0 switches the cooldown off entirely.
   */
  disableDelayHours: number;
  /** Weakenings that have been asked for and have not taken effect yet. */
  pendingChanges: PendingChange[];
  /** The lower delay waiting to replace `disableDelayHours`, if one was asked for. */
  pendingDelayHours?: number;
  /** The decorative ground. Purely visual — see constants/themes.ts. */
  theme: ThemeId;
  /** Day a toggle was last switched ON — powers "since enabling" savings lines. */
  toggleEnabledAt: Partial<Record<PlatformId, Record<string, string>>>;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setOnboarded: (value: boolean) => void;
  setCosts: (values: CostAnswer[]) => void;
  setTimeEstimate: (value: AmountAnswer, msPerDay?: number) => void;
  setAge: (value: number | undefined) => void;
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
  setPlatformInUse: (platform: PlatformId, value: boolean) => void;
  setTheme: (value: ThemeId) => void;
  setFeedLimit: (platform: PlatformId, value: number) => void;
  setMasterToggle: (key: keyof MasterSettings, value: boolean) => void;
  /** Partial so "turn it on" and "adopt this window" are the same call. */
  setQuietHours: (value: Partial<QuietHours>) => void;
  setDisableDelayHours: (hours: number) => void;
  /** Drop a scheduled weakening. The user changed their mind back. */
  cancelPending: (key: string) => void;
  /** Apply anything that has come due. Cheap; safe to call often. */
  tickCommitments: () => void;
  /** Back to a fresh install. Only reachable from the dev-only Settings row. */
  resetAll: () => void;
  resetPlatform: (platform: PlatformId) => void;
};

function allDefaults() {
  const enabled = {} as Record<PlatformId, boolean>;
  const inUse = {} as Record<PlatformId, boolean>;
  const settings = {} as Record<PlatformId, PlatformSettings>;
  const limits = {} as Record<PlatformId, number>;
  for (const id of PLATFORM_ORDER) {
    enabled[id] = true;
    inUse[id] = true;
    settings[id] = defaultSettingsFor(id);
    limits[id] = DEFAULT_FEED_LIMIT;
  }
  return { enabled, inUse, settings, limits };
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
      platformInUse: initial.inUse,
      platformSettings: initial.settings,
      feedLimits: initial.limits,
      masterSettings: { ...MASTER_DEFAULTS },
      quietHours: { ...QUIET_HOURS_DEFAULT },
      disableDelayHours: INITIAL_DELAY_HOURS,
      pendingChanges: [],
      pendingDelayHours: undefined,
      theme: DEFAULT_THEME,
      toggleEnabledAt: {},
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      setOnboarded: (value) => set({ onboarded: value }),
      setCosts: (values) => set({ costs: values }),
      setTimeEstimate: (value, msPerDay) =>
        set({ timeEstimate: value, timeEstimateMsPerDay: msPerDay }),
      setAge: (value) => set({ age: value }),
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

      /*
       * THE ASYMMETRY, APPLIED. See utils/commitment.ts for why it exists.
       *
       * Every action below that can weaken a protection follows the same three
       * steps: strengthening applies instantly AND cancels any scheduled
       * weakening of the same thing; weakening is scheduled instead of applied;
       * a zero delay means the cooldown is off and the change goes through.
       *
       * The cancel-on-strengthen half is not optional. Without it, a user who
       * turns something off and then changes their mind still has a timer
       * running, and it fires hours later on a setting they already restored.
       */
      setMasterToggle: (key, value) =>
        set((state) => {
          const pendKey = masterPendingKey(key);
          if (value) {
            return {
              masterSettings: { ...state.masterSettings, [key]: true },
              pendingChanges: cancel(state.pendingChanges, pendKey),
            };
          }
          if (!state.masterSettings[key]) return {};
          const change = schedule(pendKey, Date.now(), state.disableDelayHours);
          if (!change) return { masterSettings: { ...state.masterSettings, [key]: false } };
          return { pendingChanges: upsert(state.pendingChanges, change) };
        }),

      setQuietHours: (value) =>
        set((state) => {
          const next = { ...state.quietHours, ...value };
          const wasProtecting = isProtecting(state.quietHours);
          const willProtect = isProtecting(next);

          // Turning it on, or tuning it while it stays on — and tuning the
          // hours while it is already off, which protects nothing and so costs
          // nothing. All instant: the picker has to stay usable.
          if (willProtect || !wasProtecting) {
            return {
              quietHours: next,
              pendingChanges: willProtect
                ? cancel(state.pendingChanges, PENDING_QUIET_HOURS)
                : state.pendingChanges,
            };
          }

          // This change would stop the window protecting anything. Hold ALL of
          // it, not just the `enabled` flag — otherwise the hour change lands,
          // the window silently becomes inactive, and the pending entry is
          // guarding a door that is already open.
          const change = schedule(PENDING_QUIET_HOURS, Date.now(), state.disableDelayHours);
          if (!change) return { quietHours: next };
          return { pendingChanges: upsert(state.pendingChanges, change) };
        }),

      /*
       * Lowering the cooldown is itself a weakening, and the sharpest one — a
       * user who could set it to zero instantly would have a one-tap route to
       * disabling everything else instantly too, and the whole feature would be
       * decorative. Raising it is instant; lowering it waits out the delay that
       * is currently in force, and the new value is parked until then.
       */
      setDisableDelayHours: (hours) =>
        set((state) => {
          const next = normalizeDelayHours(hours);
          if (next >= state.disableDelayHours) {
            return {
              disableDelayHours: next,
              pendingDelayHours: undefined,
              pendingChanges: cancel(state.pendingChanges, PENDING_DELAY),
            };
          }
          const change = schedule(PENDING_DELAY, Date.now(), state.disableDelayHours);
          if (!change) return { disableDelayHours: next, pendingDelayHours: undefined };
          return {
            pendingDelayHours: next,
            pendingChanges: upsert(state.pendingChanges, change),
          };
        }),

      setTheme: (value) => set(() => ({ theme: value })),

      /**
       * Back to a fresh install, for testing onboarding repeatedly.
       *
       * Rebuilds the per-platform records from `allDefaults()` rather than
       * reusing the module-level `initial`, which the running app has been
       * mutating copies of; and clears the persisted blob, or the next write
       * would put the old state straight back.
       *
       * Every field is listed explicitly. A spread of defaults would silently
       * miss any field added later, which is the failure mode that makes a
       * reset button worse than no reset button: it would look like a fresh
       * install while carrying something over.
       */
      resetAll: () => {
        useSettingsStore.persist.clearStorage();
        const fresh = allDefaults();
        set({
          onboarded: false,
          costs: [],
          timeEstimate: undefined,
          timeEstimateMsPerDay: undefined,
          age: undefined,
          timeOfDay: undefined,
          keeps: undefined,
          monthGoal: undefined,
          platformEnabled: fresh.enabled,
          platformInUse: fresh.inUse,
          platformSettings: fresh.settings,
          feedLimits: fresh.limits,
          masterSettings: { ...MASTER_DEFAULTS },
          quietHours: { ...QUIET_HOURS_DEFAULT },
          disableDelayHours: INITIAL_DELAY_HOURS,
          pendingChanges: [],
          pendingDelayHours: undefined,
          theme: DEFAULT_THEME,
          toggleEnabledAt: {},
        });
      },

      cancelPending: (key) =>
        set((state) => ({
          pendingChanges: cancel(state.pendingChanges, key),
          ...(key === PENDING_DELAY ? { pendingDelayHours: undefined } : {}),
        })),

      tickCommitments: () =>
        set((state) => {
          const { due, waiting } = resolve(state.pendingChanges, Date.now());
          if (due.length === 0) return {};

          let quietHours = state.quietHours;
          let masterSettings = state.masterSettings;
          let disableDelayHours = state.disableDelayHours;
          let pendingDelayHours = state.pendingDelayHours;

          for (const c of due) {
            if (c.key === PENDING_QUIET_HOURS) {
              quietHours = { ...quietHours, enabled: false };
            } else if (c.key === PENDING_DELAY) {
              if (typeof pendingDelayHours === 'number') {
                disableDelayHours = pendingDelayHours;
              }
              pendingDelayHours = undefined;
            } else if (c.key.startsWith(MASTER_PREFIX)) {
              const k = c.key.slice(MASTER_PREFIX.length) as keyof MasterSettings;
              if (k in masterSettings) masterSettings = { ...masterSettings, [k]: false };
            }
            // An unrecognised key is dropped with the rest of `due`. A build
            // that removed a setting should not leave its timer running forever.
          }

          return {
            quietHours,
            masterSettings,
            disableDelayHours,
            pendingDelayHours,
            pendingChanges: waiting,
          };
        }),

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

      /*
       * Dropping an app also drops its restrictions. Leaving `platformEnabled`
       * true on an app the user has said isn't theirs would keep filters armed
       * for something invisible — and if they added it back later, it would
       * return already restricted without having been asked.
       */
      setPlatformInUse: (platform, value) =>
        set((state) => ({
          platformInUse: { ...state.platformInUse, [platform]: value },
          platformEnabled: value
            ? state.platformEnabled
            : { ...state.platformEnabled, [platform]: false },
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
        timeEstimateMsPerDay: state.timeEstimateMsPerDay,
        age: state.age,
        timeOfDay: state.timeOfDay,
        keeps: state.keeps,
        monthGoal: state.monthGoal,
        platformEnabled: state.platformEnabled,
        platformInUse: state.platformInUse,
        platformSettings: state.platformSettings,
        feedLimits: state.feedLimits,
        masterSettings: state.masterSettings,
        // `quietHours` was missing here while `merge` already read it, so the
        // window was rebuilt from defaults on every launch and the feature
        // silently switched itself off overnight. A field has to be in BOTH
        // lists; adding it to one is worse than adding it to neither, because
        // the read side makes it look wired.
        quietHours: state.quietHours,
        disableDelayHours: state.disableDelayHours,
        pendingChanges: state.pendingChanges,
        pendingDelayHours: state.pendingDelayHours,
        theme: state.theme,
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
          timeEstimateMsPerDay:
            typeof saved.timeEstimateMsPerDay === 'number' &&
            Number.isFinite(saved.timeEstimateMsPerDay) &&
            saved.timeEstimateMsPerDay > 0
              ? saved.timeEstimateMsPerDay
              : undefined,
          // Re-validated rather than trusted: `remainingYears` rejects an
          // absurd age anyway, but a stored NaN would render as "NaN years".
          age:
            typeof saved.age === 'number' &&
            Number.isFinite(saved.age) &&
            saved.age >= 5 &&
            saved.age <= 120
              ? Math.floor(saved.age)
              : undefined,
          timeOfDay: Array.isArray(saved.timeOfDay)
            ? saved.timeOfDay.filter(isWhenAnswer)
            : undefined,
          keeps: Array.isArray(saved.keeps) ? saved.keeps.filter(isKeepAnswer) : undefined,
          monthGoal: isGoalAnswer(saved.monthGoal) ? saved.monthGoal : undefined,
          platformEnabled: { ...current.platformEnabled, ...(saved.platformEnabled ?? {}) },
          platformInUse: { ...current.platformInUse, ...(saved.platformInUse ?? {}) },
          platformSettings: mergedSettings,
          feedLimits: mergedLimits,
          masterSettings: { ...MASTER_DEFAULTS, ...(saved.masterSettings ?? {}) },
          quietHours: validQuietHours(saved.quietHours),
          disableDelayHours:
            typeof saved.disableDelayHours === 'number'
              ? normalizeDelayHours(saved.disableDelayHours)
              : INITIAL_DELAY_HOURS,
          pendingChanges: validPendingChanges(saved.pendingChanges),
          pendingDelayHours:
            typeof saved.pendingDelayHours === 'number'
              ? normalizeDelayHours(saved.pendingDelayHours)
              : undefined,
          theme: isThemeId(saved.theme) ? saved.theme : DEFAULT_THEME,
          toggleEnabledAt: saved.toggleEnabledAt ?? {},
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
