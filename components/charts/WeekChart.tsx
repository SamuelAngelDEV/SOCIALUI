import { StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/typography';

/** Mon..Sun, matching `weekDays()` in utils/stats. */
export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** One stacked column. Segments render bottom-up in the order given. */
export type WeekColumn = {
  segments: { key: string; value: number; color: string }[];
};

export type WeekChartProps = {
  columns: WeekColumn[];
  /** Column labels. Defaults to Mon..Sun initials. */
  labels?: string[];
  height?: number;
  barWidth?: number;
};

/**
 * Vertical stacked bars, one column per day.
 *
 * STACKED, NOT FLAT — and that is the point. This chart used to take a single
 * total per day, which threw away the intentional/algorithmic split on the one
 * screen whose entire argument is that split. The data was already there; the
 * chart simply wasn't reading it, so a heavy feed day and a heavy messaging day
 * drew identically.
 *
 * Purely presentational: it never formats or aggregates, it draws the segments
 * it is handed, in the order it is handed them. Callers order algorithmic
 * before intentional (see `orderedCategories` in constants/activityColors.ts)
 * so the warm block sits consistently at the base of every column.
 */
export function WeekChart({
  columns,
  labels = DAY_LETTERS,
  height = 96,
  barWidth = 14,
}: WeekChartProps) {
  const totals = columns.map((c) => c.segments.reduce((sum, s) => sum + s.value, 0));
  const max = Math.max(...totals, 1);

  return (
    <View style={[styles.chart, { height }]}>
      {columns.map((col, i) => {
        const total = totals[i];
        return (
          <View key={i} style={styles.col}>
            <View style={[styles.well, { width: barWidth }]}>
              {/*
                A day with four minutes must not read as a day with none, so a
                non-zero column keeps a visible stub. The floor applies to the
                COLUMN, then segments divide it proportionally — flooring each
                segment instead would let a three-segment day grow taller than
                a one-segment day carrying more time.
              */}
              <View
                style={[
                  styles.stack,
                  {
                    width: barWidth,
                    height: `${Math.max((total / max) * 100, total > 0 ? 4 : 0)}%`,
                  },
                ]}
              >
                {total > 0 &&
                  col.segments
                    .filter((s) => s.value > 0)
                    .map((s) => (
                      <View
                        key={s.key}
                        style={{
                          height: `${(s.value / total) * 100}%`,
                          backgroundColor: s.color,
                        }}
                      />
                    ))}
              </View>
            </View>
            <Text style={styles.dayLabel}>{labels[i] ?? ''}</Text>
          </View>
        );
      })}
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
  stack: {
    borderRadius: 4,
    overflow: 'hidden',
    // Bottom-up: the first segment given sits at the base of the column.
    flexDirection: 'column-reverse',
  },
  dayLabel: {
    ...Typography.caption,
    marginTop: 6,
  },
});
