import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radii, Spacing } from '@/constants/spacing';
import { Strings } from '@/constants/strings';
import { PENDING_QUIET_HOURS, useSettingsStore } from '@/store/settingsStore';
import { formatHour, formatHourRange } from '@/utils/stats';
import { windowLengthHours } from '@/utils/schedule';
import { formatRemaining, pendingFor, remainingMs } from '@/utils/commitment';
import { SettingsGroup } from './SettingsGroup';
import { SettingsRow } from './SettingsRow';

const COPY = Strings.quietHours;

/**
 * Quiet Hours in Settings.
 *
 * This exists so the feature is reachable when Insights is not. The Insights
 * call to action lives inside RhythmCard, which renders nothing once a finding
 * ages out of the 14-day window — turning the feature on there and then losing
 * the only "off" switch a fortnight later is a trap, not a design.
 *
 * Hours step rather than opening a picker: the window is hour-granular by
 * definition (`QuietWindow` holds whole local hours), so a minute-precise
 * control would be offering precision the model does not have.
 */
function HourStepper({
  label,
  hour,
  onChange,
}: {
  label: string;
  hour: number;
  onChange: (next: number) => void;
}) {
  const step = (delta: number) => onChange((((hour + delta) % 24) + 24) % 24);
  return (
    <View style={styles.stepperRow}>
      <Text style={[Typography.body, styles.stepperLabel]}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          onPress={() => step(-1)}
          hitSlop={8}
          style={styles.stepBtn}
          accessibilityRole="button"
          accessibilityLabel={`${label} one hour earlier`}
        >
          <Minus size={16} color={Colors.textPrimary} />
        </Pressable>
        <Text style={[Typography.headline, styles.stepperValue]}>{formatHour(hour)}</Text>
        <Pressable
          onPress={() => step(1)}
          hitSlop={8}
          style={styles.stepBtn}
          accessibilityRole="button"
          accessibilityLabel={`${label} one hour later`}
        >
          <Plus size={16} color={Colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

export function QuietHoursSection() {
  const quietHours = useSettingsStore((s) => s.quietHours);
  const setQuietHours = useSettingsStore((s) => s.setQuietHours);
  const pendingChanges = useSettingsStore((s) => s.pendingChanges);
  const cancelPending = useSettingsStore((s) => s.cancelPending);

  const length = windowLengthHours(quietHours);
  const status = quietHours.enabled
    ? COPY.settingsOn(formatHourRange(quietHours.startHour, quietHours.endHour))
    : COPY.settingsOff;

  // Switching quiet hours off is the relapse move this cooldown is for, so the
  // pending state has to be legible right here rather than only in the group
  // that owns the delay setting.
  const pending = pendingFor(pendingChanges, PENDING_QUIET_HOURS);

  return (
    <SettingsGroup title={COPY.settingsTitle} footer={COPY.settingsSubtitle}>
      <SettingsRow
        label={status}
        accessory="switch"
        value={quietHours.enabled}
        onValueChange={(v) => setQuietHours({ enabled: v })}
        pending={
          pending
            ? {
                label: Strings.commitment.pending(
                  formatRemaining(remainingMs(pending, Date.now()))
                ),
                onCancel: () => cancelPending(PENDING_QUIET_HOURS),
              }
            : undefined
        }
      />

      {quietHours.enabled && (
        <View style={styles.editor}>
          <HourStepper
            label={COPY.settingsStart}
            hour={quietHours.startHour}
            // A hand-set window is no longer the one Rhythm measured, so the
            // overlay must stop claiming it was.
            onChange={(h) => setQuietHours({ startHour: h, source: 'manual' })}
          />
          <HourStepper
            label={COPY.settingsEnd}
            hour={quietHours.endHour}
            onChange={(h) => setQuietHours({ endHour: h, source: 'manual' })}
          />
          {/* A zero-length window is treated as "never" by isWithinWindow. Say
              so here rather than letting the feature read as silently broken. */}
          <Text style={[Typography.callout, styles.lengthNote]}>
            {length === 0
              ? 'Start and end are the same, so this never applies.'
              : `${length} hour${length === 1 ? '' : 's'} a day.`}
          </Text>
        </View>
      )}
    </SettingsGroup>
  );
}

const styles = StyleSheet.create({
  editor: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  stepperLabel: {
    color: Colors.textSecondary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 72,
    textAlign: 'center',
  },
  lengthNote: {
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
});
