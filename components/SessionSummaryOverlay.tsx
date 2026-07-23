import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Category, CATEGORY_LABELS, formatDuration } from '@/utils/stats';

type Props = {
  platformName: string;
  sessionMs: number;
  perCategory: Partial<Record<Category, number>>;
  todayTotalMs: number;
  onDone: () => void;
};

/**
 * Shown once when the user closes a platform. One glance, one tap — awareness,
 * not judgment. No streaks, no scores, no red.
 */
export function SessionSummaryOverlay({
  platformName,
  sessionMs,
  perCategory,
  todayTotalMs,
  onDone,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [opacity]);

  const rows = (Object.entries(perCategory) as [Category, number][])
    .filter(([, ms]) => ms >= 1000)
    .sort((a, b) => b[1] - a[1]);

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Clock size={28} color={Colors.primary} />
        </View>

        <Text style={[Typography.title, styles.title]}>
          {formatDuration(sessionMs)} on {platformName}
        </Text>

        <View style={styles.rows}>
          {rows.map(([cat, ms]) => (
            <View key={cat} style={styles.row}>
              <Text style={[Typography.body, styles.rowLabel]}>{CATEGORY_LABELS[cat]}</Text>
              <Text style={[Typography.body, styles.rowValue]}>{formatDuration(ms)}</Text>
            </View>
          ))}
        </View>

        <Text style={[Typography.callout, styles.today]}>
          {formatDuration(todayTotalMs)} across all platforms today.
        </Text>

        <Pressable style={styles.doneBtn} onPress={onDone}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 420,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  rows: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowLabel: {
    color: Colors.textSecondary,
  },
  rowValue: {
    color: Colors.textPrimary,
  },
  today: {
    color: Colors.textTertiary,
    marginBottom: 28,
  },
  doneBtn: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  doneText: {
    ...Typography.headline,
    color: Colors.surface,
  },
});
