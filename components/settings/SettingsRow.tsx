import { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ChevronRight, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radii, Spacing } from '@/constants/spacing';
import { Strings } from '@/constants/strings';
import type { MetricVisibility } from '@/constants/features';

type Props = {
  label: string;
  note?: string;
  /** Data-driven savings line, rendered in the accent color under the note. */
  insight?: string;
  /** Right accessory: a switch, an "Always On" label, a chevron, or custom. */
  accessory: 'switch' | 'alwaysOn' | 'chevron' | 'none' | 'metric';
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  metricValue?: MetricVisibility;
  onMetricChange?: (value: MetricVisibility) => void;
  onPress?: () => void;
  leading?: ReactNode;
  disabled?: boolean;
  /**
   * A weakening of this row's setting that has been asked for and is waiting
   * out its cooldown. Without this the switch appears to snap back on its own,
   * which reads as a bug rather than as a deliberate wait.
   */
  pending?: { label: string; onCancel: () => void };
};

export function SettingsRow({
  label,
  note,
  insight,
  accessory,
  value,
  onValueChange,
  metricValue,
  onMetricChange,
  onPress,
  leading,
  disabled,
  pending,
}: Props) {
  const metricIsOn = metricValue !== undefined && metricValue !== 'visible';
  const metricIsHideBoth = metricValue === 'hidden-both';

  const body = (
    <View>
      <View style={styles.row}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <View style={styles.textCol}>
          <Text style={[Typography.body, disabled && styles.disabledText]}>{label}</Text>
          {note ? <Text style={styles.note}>{note}</Text> : null}
          {insight ? <Text style={styles.insight}>{insight}</Text> : null}
        </View>

        {accessory === 'switch' && (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ true: Colors.switchOn, false: Colors.switchOff }}
            ios_backgroundColor={Colors.switchOff}
          />
        )}
        {accessory === 'metric' && (
          <Switch
            value={metricIsOn}
            onValueChange={(on) =>
              onMetricChange?.(on ? 'hidden-number' : 'visible')
            }
            trackColor={{ true: Colors.switchOn, false: Colors.switchOff }}
            ios_backgroundColor={Colors.switchOff}
            disabled={disabled}
          />
        )}
        {accessory === 'alwaysOn' && (
          <View style={styles.alwaysOnPill}>
            <Text style={Typography.pill}>{Strings.settingsRow.alwaysOn}</Text>
          </View>
        )}
        {accessory === 'chevron' && <ChevronRight size={18} color={Colors.textTertiary} />}
      </View>

      {pending && (
        <View style={styles.pendingRow}>
          <Clock size={13} color={Colors.warning} />
          <Text style={styles.pendingText}>{pending.label}</Text>
          <Pressable onPress={pending.onCancel} hitSlop={10} accessibilityRole="button">
            <Text style={styles.pendingCancel}>{Strings.commitment.keepOn}</Text>
          </Pressable>
        </View>
      )}

      {accessory === 'metric' && metricIsOn && (
        <View style={styles.childRow}>
          <View style={styles.row}>
            <View style={styles.textCol}>
              <Text style={[Typography.body, disabled && styles.disabledText]}>
                {Strings.settingsRow.hideButtonToo}
              </Text>
              <Text style={styles.note}>{Strings.settingsRow.hideButtonTooNote}</Text>
            </View>
            <Switch
              value={metricIsHideBoth}
              onValueChange={(on) =>
                onMetricChange?.(on ? 'hidden-both' : 'hidden-number')
              }
              trackColor={{ true: Colors.switchOn, false: Colors.switchOff }}
              ios_backgroundColor={Colors.switchOff}
              disabled={disabled}
            />
          </View>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} android_ripple={{ color: Colors.separator }}>
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
  },
  leading: {
    marginRight: Spacing.md,
  },
  textCol: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  note: {
    ...Typography.callout,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  insight: {
    ...Typography.callout,
    color: Colors.primary,
    marginTop: 2,
  },
  disabledText: {
    color: Colors.textTertiary,
  },
  alwaysOnPill: {
    backgroundColor: Colors.pillSubtle,
    paddingHorizontal: 10,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
  },
  childRow: {
    paddingLeft: Spacing.lg,
    backgroundColor: Colors.groupedBackground,
  },
  /*
   * Deliberately NOT a tinted pill. `warning` (#96610F) is 5.05:1 on `surface`
   * but only 4.30:1 on `groupedBackground` — computed, not estimated — which
   * fails the 4.5:1 body-text minimum. The status reads on the row's own
   * surface, where it passes, rather than inside a fill that would not.
   */
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  pendingText: {
    ...Typography.callout,
    flex: 1,
    color: Colors.warning,
  },
  pendingCancel: {
    ...Typography.callout,
    color: Colors.primary,
  },
});
