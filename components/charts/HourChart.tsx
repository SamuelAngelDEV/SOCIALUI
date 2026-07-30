import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/colors';

/** Hours labelled under the axis. */
const TICKS: { hour: number; label: string }[] = [
  { hour: 0, label: '12a' },
  { hour: 6, label: '6a' },
  { hour: 12, label: '12p' },
  { hour: 18, label: '6p' },
];

const AXIS_HEIGHT = 16;
const HOURS = 24;

export type HourChartProps = {
  /** 24 values, index = local hour. Shorter arrays are padded with zeros. */
  values: number[];
  /** Inclusive local hour a highlighted window opens on. */
  highlightStart?: number;
  /** Length of the highlighted window in hours; wraps past midnight. */
  highlightLength?: number;
  height?: number;
  color?: string;
  /** Bars outside the highlighted window. Ignored when nothing is highlighted. */
  mutedColor?: string;
};

/**
 * A day laid out left to right: one bar per local hour, with an optional band
 * marking a window of interest. Presentational — it draws the 24 numbers it is
 * given and nothing more.
 */
export function HourChart({
  values,
  highlightStart,
  highlightLength = 0,
  height = 84,
  color = Colors.primary,
  mutedColor = Colors.primarySubtle,
}: HourChartProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next !== width) setWidth(next);
  };

  const hasHighlight = highlightStart !== undefined && highlightLength > 0;
  const highlighted = new Set<number>();
  if (hasHighlight) {
    for (let i = 0; i < Math.min(highlightLength, HOURS); i++) {
      highlighted.add((highlightStart + i) % HOURS);
    }
  }

  const plotHeight = Math.max(height - AXIS_HEIGHT, 1);
  const max = Math.max(...values.slice(0, HOURS), 1);
  const slot = width / HOURS;
  const barWidth = Math.max(slot - 2, 1);

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {/* Band behind the highlighted hours. Drawn per-hour so a window that
              wraps past midnight simply appears at both ends. */}
          {hasHighlight &&
            Array.from(highlighted).map((hour) => (
              <Rect
                key={`band-${hour}`}
                x={hour * slot}
                y={0}
                width={slot}
                height={plotHeight}
                fill={Colors.primarySubtle}
                opacity={0.7}
              />
            ))}

          {Array.from({ length: HOURS }, (_, hour) => {
            const value = values[hour] ?? 0;
            const barHeight = value > 0 ? Math.max((value / max) * plotHeight, 2) : 0;
            if (barHeight === 0) return null;
            const active = !hasHighlight || highlighted.has(hour);
            return (
              <Rect
                key={`bar-${hour}`}
                x={hour * slot + (slot - barWidth) / 2}
                y={plotHeight - barHeight}
                width={barWidth}
                height={barHeight}
                rx={Math.min(barWidth / 2, 2)}
                fill={active ? color : mutedColor}
              />
            );
          })}

          {TICKS.map((tick) => (
            <SvgText
              key={tick.label}
              x={tick.hour * slot + slot / 2}
              y={height - 3}
              fontSize={10}
              fontFamily="Inter_400Regular"
              fill={Colors.textTertiary}
              textAnchor="middle"
            >
              {tick.label}
            </SvgText>
          ))}
        </Svg>
      )}
    </View>
  );
}
