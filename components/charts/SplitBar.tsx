import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export type SplitSegment = {
  key: string;
  label: string;
  value: number;
  /** Right-hand text in the legend. Formatted by the caller. */
  valueLabel: string;
  color: string;
};

export type SplitBarProps = {
  segments: SplitSegment[];
  height?: number;
  /** Render the label/value legend beneath the bar. */
  showLegend?: boolean;
  trackColor?: string;
};

/**
 * One stacked horizontal bar — the whole of something, divided. Presentational:
 * proportions are computed from the values given, nothing else.
 */
export function SplitBar({
  segments,
  height = 12,
  showLegend = true,
  trackColor = Colors.groupedBackground,
}: SplitBarProps) {
  const parts = segments.filter((s) => s.value > 0);
  const total = parts.reduce((sum, s) => sum + s.value, 0);

  return (
    <View>
      <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}>
        {total > 0 &&
          parts.map((segment) => (
            <View
              key={segment.key}
              style={{
                width: `${(segment.value / total) * 100}%`,
                backgroundColor: segment.color,
              }}
            />
          ))}
      </View>

      {showLegend && (
        <View style={styles.legend}>
          {segments.map((segment) => (
            <View key={segment.key} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: segment.color }]} />
              <Text style={[Typography.body, styles.legendLabel]}>{segment.label}</Text>
              <Text style={[Typography.body, styles.legendValue]}>{segment.valueLabel}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    overflow: 'hidden',
    width: '100%',
  },
  legend: {
    marginTop: 14,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  legendLabel: {
    flex: 1,
    color: Colors.textSecondary,
  },
  legendValue: {
    color: Colors.textPrimary,
  },
});
