import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export type CategoryBarRow = {
  key: string;
  label: string;
  /** Drives the bar width. */
  value: number;
  /** Right-hand text. The caller formats it — this component knows nothing about time. */
  valueLabel: string;
  color?: string;
};

export type CategoryBarsProps = {
  rows: CategoryBarRow[];
  /** Denominator for bar widths. Defaults to the largest row value. */
  total?: number;
  /** Shown in place of the rows when there are none. */
  emptyLabel?: string;
  labelWidth?: number;
  color?: string;
  trackColor?: string;
  /** Hairline above each row — matches the card-section look. */
  divided?: boolean;
};

/**
 * Horizontal labelled bars: label · bar · value. Presentational only; callers
 * sort, filter and format before handing rows over.
 */
export function CategoryBars({
  rows,
  total,
  emptyLabel,
  labelWidth = 110,
  color = Colors.primary,
  trackColor = Colors.primarySubtle,
  divided = true,
}: CategoryBarsProps) {
  const denominator = Math.max(total ?? Math.max(...rows.map((r) => r.value), 0), 1);

  if (rows.length === 0) {
    if (!emptyLabel) return null;
    return (
      <View style={[styles.row, divided && styles.rowBorder]}>
        <Text style={[Typography.callout, styles.empty]}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <>
      {rows.map((row) => (
        <View key={row.key} style={[styles.row, divided && styles.rowBorder]}>
          <Text style={[Typography.body, { width: labelWidth }]}>{row.label}</Text>
          <View style={[styles.well, { backgroundColor: trackColor }]}>
            <View
              style={[
                styles.bar,
                {
                  backgroundColor: row.color ?? color,
                  width: `${Math.max((row.value / denominator) * 100, 2)}%`,
                },
              ]}
            />
          </View>
          <Text style={[Typography.callout, styles.value]}>{row.valueLabel}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  well: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  value: {
    minWidth: 56,
    textAlign: 'right',
    color: Colors.textSecondary,
  },
  empty: {
    color: Colors.textTertiary,
  },
});
