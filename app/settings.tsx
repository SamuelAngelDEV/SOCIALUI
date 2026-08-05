import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radii, Spacing } from '@/constants/spacing';
import { Strings } from '@/constants/strings';
import { PLATFORM_LIST } from '@/constants/platforms';
import { THEMES, themeById } from '@/constants/themes';
import { useStatsStore } from '@/store/statsStore';
import {
  MasterSettings,
  masterPendingKey,
  PENDING_DELAY,
  useSettingsStore,
} from '@/store/settingsStore';
import {
  DEFAULT_DELAY_HOURS,
  formatRemaining,
  MAX_DELAY_HOURS,
  pendingFor,
  remainingMs,
} from '@/utils/commitment';
import { PlatformSection } from '@/components/settings/PlatformSection';
import { QuietHoursSection } from '@/components/settings/QuietHoursSection';
import { SettingsGroup } from '@/components/settings/SettingsGroup';
import { SettingsRow } from '@/components/settings/SettingsRow';

const COPY = Strings.settings;

const MASTER_ROWS: { key: keyof MasterSettings; label: string; note?: string }[] = [
  { key: 'killAllMetrics', ...COPY.master.killAllMetrics },
  { key: 'killAllBadges', ...COPY.master.killAllBadges },
  { key: 'messagesOnly', ...COPY.master.messagesOnly },
  { key: 'grayscaleEverything', ...COPY.master.grayscaleEverything },
];

/** The cooldown lengths offered. 0 is "off", and it is deliberately reachable. */
const DELAY_CHOICES = [0, 1, DEFAULT_DELAY_HOURS, 72, MAX_DELAY_HOURS];

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const master = useSettingsStore((s) => s.masterSettings);
  const setMasterToggle = useSettingsStore((s) => s.setMasterToggle);
  const pendingChanges = useSettingsStore((s) => s.pendingChanges);
  const cancelPending = useSettingsStore((s) => s.cancelPending);
  const disableDelayHours = useSettingsStore((s) => s.disableDelayHours);
  const pendingDelayHours = useSettingsStore((s) => s.pendingDelayHours);
  const setDisableDelayHours = useSettingsStore((s) => s.setDisableDelayHours);
  const platformInUse = useSettingsStore((s) => s.platformInUse);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const resetSettings = useSettingsStore((s) => s.resetAll);
  const resetStats = useStatsStore((s) => s.resetAll);

  const delayLabel = (h: number) =>
    h === 0 ? Strings.commitment.immediate : Strings.commitment.hours(h);

  /*
   * Read once per render rather than on a ticking clock. The label is coarse
   * ("23h 14m") and utils/commitment.ts explains why it is not a live
   * countdown: a day-long timer counting down by the second is an urgency
   * device, which is the thing this product argues against.
   */
  const now = Date.now();
  const pendingProps = (key: string) => {
    const c = pendingFor(pendingChanges, key);
    if (!c) return undefined;
    return {
      label: Strings.commitment.pending(formatRemaining(remainingMs(c, now))),
      onCancel: () => cancelPending(key),
    };
  };

  const delayPending = pendingFor(pendingChanges, PENDING_DELAY);

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={26} color={Colors.textPrimary} />
        </Pressable>
        <View>
          <Text style={Typography.title}>{COPY.title}</Text>
          <Text style={[Typography.callout, styles.subtitle]}>{COPY.subtitle}</Text>
        </View>
      </View>

      {hydrated ? (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + Spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <SettingsGroup
            title={COPY.master.groupTitle}
            footer={COPY.master.groupFooter}
          >
            {MASTER_ROWS.map((row) => (
              <SettingsRow
                key={row.key}
                label={row.label}
                note={row.note}
                accessory="switch"
                value={master[row.key]}
                onValueChange={(v) => setMasterToggle(row.key, v)}
                pending={pendingProps(masterPendingKey(row.key))}
              />
            ))}
          </SettingsGroup>

          <SettingsGroup
            title={Strings.themes.groupTitle}
            footer={Strings.themes.groupFooter}
          >
            <View style={styles.themeRow}>
              {THEMES.map((t) => {
                const on = t.id === theme;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setTheme(t.id)}
                    style={[styles.themeChip, on && styles.themeChipOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text
                      style={[
                        Typography.callout,
                        styles.themeChipText,
                        on && styles.themeChipTextOn,
                      ]}
                    >
                      {t.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[Typography.callout, styles.themeNote]}>
              {themeById(theme).note}
            </Text>
          </SettingsGroup>

          <QuietHoursSection />

          {/* The cooldown itself. Lowering it is delayed by the delay currently
              in force, which is why this row can show a pending state too. */}
          <SettingsGroup
            title={Strings.commitment.groupTitle}
            footer={Strings.commitment.groupFooter}
          >
            <SettingsRow
              label={Strings.commitment.rowLabel}
              note={delayLabel(disableDelayHours)}
              accessory="none"
              pending={
                delayPending && typeof pendingDelayHours === 'number'
                  ? {
                      label: Strings.commitment.pendingDelay(
                        delayLabel(pendingDelayHours),
                        formatRemaining(remainingMs(delayPending, now))
                      ),
                      onCancel: () => cancelPending(PENDING_DELAY),
                    }
                  : undefined
              }
            />
            <View style={styles.delayChoices}>
              {DELAY_CHOICES.map((h) => {
                const on = h === disableDelayHours;
                return (
                  <Pressable
                    key={h}
                    onPress={() => setDisableDelayHours(h)}
                    style={[styles.delayChip, on && styles.delayChipOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text
                      style={[
                        Typography.callout,
                        styles.delayChipText,
                        on && styles.delayChipTextOn,
                      ]}
                    >
                      {delayLabel(h)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SettingsGroup>

          {/* Only apps the user claimed. Settings for an app they said isn't
              theirs is a section that can never do anything. */}
          {PLATFORM_LIST.filter(
            (p) => p.kind === 'webview' && platformInUse[p.id] !== false
          ).map((p) => (
            <PlatformSection key={p.id} platform={p} />
          ))}

          <SettingsGroup footer={COPY.doctor.groupFooter}>
            <SettingsRow
              label={COPY.doctor.row}
              accessory="chevron"
              onPress={() => router.push('/doctor')}
            />
          </SettingsGroup>

          {/*
            Dev only. `__DEV__` is false in any release build, so this cannot
            ship: a one-tap "erase everything" in a production app is a support
            incident waiting to happen. It exists because testing onboarding
            otherwise means reinstalling Expo Go every time.
          */}
          {__DEV__ && (
            <SettingsGroup title="Developer" footer="Debug builds only.">
              <SettingsRow
                label="Reset all data"
                note="Wipes settings and history, then reopens onboarding."
                accessory="chevron"
                onPress={() => {
                  resetStats();
                  resetSettings();
                  router.replace('/onboarding');
                }}
              />
            </SettingsGroup>
          )}
        </ScrollView>
      ) : (
        <View style={styles.loading}>
          <Text style={[Typography.callout, { color: Colors.textTertiary }]}>
            {COPY.loading}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  back: {
    marginRight: Spacing.sm,
    // Optical: pulls the chevron's glyph bearing back into the gutter.
    marginLeft: -6,
  },
  subtitle: {
    marginTop: 1,
  },
  scroll: {
    paddingTop: Spacing.xs,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delayChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  delayChip: {
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  delayChipOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  delayChipText: {
    color: Colors.textSecondary,
  },
  delayChipTextOn: {
    color: Colors.surface,
  },
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  themeChip: {
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  themeChipOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  themeChipText: {
    color: Colors.textSecondary,
  },
  themeChipTextOn: {
    color: Colors.surface,
  },
  themeNote: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    color: Colors.textTertiary,
  },
});
