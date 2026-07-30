import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

/** Mon..Sun, matching `weekDays()` in utils/stats. */
export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export type WeekChartProps = {
  /** One value per column. Only relative size matters — units are the caller's. */
  values: number[];
  /** Column labels. Defaults to Mon..Sun initials. */
  labels?: string[];
  height?: number;
  barWidth?: number;
  color?: string;
};

/**
 * Vertical bars, one per day. Purely presentational — it never formats or
 * aggregates anything, it just draws the numbers it is handed.
 */
export function WeekChart({
  values,
  labels = DAY_LETTERS,
  height = 96,
  barWidth = 14,
  color = Colors.primary,
}: WeekChartProps) {
  const max = Math.max(...values, 1);

  return (
    <View style={[styles.chart, { height }]}>
      {values.map((value, i) => (
        <View key={i} style={styles.col}>
          <View style={[styles.well, { width: barWidth }]}>
            <View
              style={[
                styles.bar,
                {
                  width: barWidth,
                  backgroundColor: color,
                  // Non-zero days keep a visible stub so "a little" never reads as "none".
                  height: `${Math.max((value / max) * 100, value > 0 ? 4 : 0)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.dayLabel}>{labels[i] ?? ''}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  well: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 4,
  },
  dayLabel: {
    ...Typography.caption,
    marginTop: 6,
  },
});
