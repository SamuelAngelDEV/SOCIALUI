import { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
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
            trackColor={{ true: Colors.switchOn, false: '#E4E4E1' }}
            ios_backgroundColor="#E4E4E1"
          />
        )}
        {accessory === 'metric' && (
          <Switch
            value={metricIsOn}
            onValueChange={(on) =>
              onMetricChange?.(on ? 'hidden-number' : 'visible')
            }
            trackColor={{ true: Colors.switchOn, false: '#E4E4E1' }}
            ios_backgroundColor="#E4E4E1"
            disabled={disabled}
          />
        )}
        {accessory === 'alwaysOn' && (
          <View style={styles.alwaysOnPill}>
            <Text style={styles.alwaysOnText}>Always On</Text>
          </View>
        )}
        {accessory === 'chevron' && <ChevronRight size={18} color={Colors.textTertiary} />}
      </View>

      {accessory === 'metric' && metricIsOn && (
        <View style={styles.childRow}>
          <View style={styles.row}>
            <View style={styles.textCol}>
              <Text style={[Typography.body, disabled && styles.disabledText]}>
                Hide Button Too
              </Text>
              <Text style={styles.note}>
                Also removes the tap target, not just the number.
              </Text>
            </View>
            <Switch
              value={metricIsHideBoth}
              onValueChange={(on) =>
                onMetricChange?.(on ? 'hidden-both' : 'hidden-number')
              }
              trackColor={{ true: Colors.switchOn, false: '#E4E4E1' }}
              ios_backgroundColor="#E4E4E1"
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
  },
  leading: {
    marginRight: 12,
  },
  textCol: {
    flex: 1,
    paddingRight: 12,
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
    backgroundColor: 'rgba(52,199,89,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  alwaysOnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.switchOn,
  },
  childRow: {
    paddingLeft: 16,
    backgroundColor: Colors.groupedBackground,
  },
});
