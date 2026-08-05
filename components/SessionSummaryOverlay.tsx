import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radii, Spacing } from '@/constants/spacing';
import { Strings } from '@/constants/strings';
import { PlatformId } from '@/constants/platforms';
import { categoryColor } from '@/constants/activityColors';
import { PlatformLogo } from '@/components/PlatformLogo';
import { CategoryBars } from '@/components/charts';
import { Category, categoryLabel, formatDuration, splitByKind } from '@/utils/stats';

const COPY = Strings.session;

/** Rows below this are noise — a half-second of transit through a route. */
const MIN_ROW_MS = 1000;

type Props = {
  platform: PlatformId;
  platformName: string;
  sessionMs: number;
  perCategory: Partial<Record<Category, number>>;
  todayTotalMs: number;
  onDone: () => void;
};

/**
 * Shown once when the user closes a platform. One glance, one tap — awareness,
 * not judgment. No streaks, no scores, no red.
 *
 * It reports the session at SURFACE level rather than as a single total, because
 * "14 minutes" is a fact nobody can act on and "9 of those minutes were Reels"
 * is the same fact with the interesting part left in. The surfaces are named the
 * way the platform names them (`categoryLabel`), so the row says "Shorts" on
 * YouTube and "For You" on TikTok rather than making the reader translate.
 *
 * The bars carry the same two colours as the Insights split, from one shared
 * definition — this screen is the week's argument at session scale, and the two
 * disagreeing would undermine both.
 */
export function SessionSummaryOverlay({
  platform,
  platformName,
  sessionMs,
  perCategory,
  todayTotalMs,
  onDone,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [opacity, translate]);

  const rows = (Object.entries(perCategory) as [Category, number][])
    .filter(([, ms]) => ms >= MIN_ROW_MS)
    .sort((a, b) => b[1] - a[1]);

  const split = splitByKind(perCategory);

  /*
   * The verdict is gated on there being a split to describe at all. A session
   * spent entirely on unclassified pages has no honest one-liner available, and
   * inventing one — "you were on Instagram for 6 minutes" — would be filling the
   * slot rather than saying something. It renders nothing instead.
   */
  const verdict =
    split.algorithmicShare === null
      ? null
      : split.algorithmicShare >= 0.6
        ? COPY.verdictAlgorithmic
        : split.algorithmicShare <= 0.4
          ? COPY.verdictIntentional
          : COPY.verdictEven;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.content, { transform: [{ translateY: translate }] }]}>
        <View style={styles.header}>
          <View style={styles.logoChip}>
            <PlatformLogo platform={platform} size={26} />
          </View>
          <View style={styles.headerText}>
            <Text style={Typography.caption}>{COPY.eyebrow}</Text>
            <Text style={[Typography.callout, styles.headerOn]}>{COPY.on(platformName)}</Text>
          </View>
        </View>

        <Text style={[Typography.figureXL, styles.figure]}>{formatDuration(sessionMs)}</Text>

        {verdict && <Text style={[Typography.quote, styles.verdict]}>{verdict}</Text>}

        <View style={styles.card}>
          <CategoryBars
            total={sessionMs}
            emptyLabel="Nothing long enough to break down."
            rows={rows.map(([cat, ms]) => ({
              key: cat,
              label: categoryLabel(platform, cat),
              value: ms,
              valueLabel: formatDuration(ms),
              color: categoryColor(cat),
            }))}
          />
        </View>

        <View style={styles.footnotes}>
          {split.unclassified > 0 && (
            <Text style={[Typography.callout, styles.footnote]}>
              {COPY.unclassified(formatDuration(split.unclassified))}
            </Text>
          )}
          <Text style={[Typography.callout, styles.footnote]}>
            {COPY.today(formatDuration(todayTotalMs))}
          </Text>
        </View>

        <Pressable style={styles.doneBtn} onPress={onDone} accessibilityRole="button">
          <Text style={styles.doneText}>{COPY.done}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.xxl,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  // Tinted rounded-square chip rather than a bare logo — the container is what
  // makes a row of mixed brand marks read as one system.
  logoChip: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    gap: 2,
  },
  headerOn: {
    color: Colors.textSecondary,
  },
  figure: {
    marginBottom: Spacing.sm,
  },
  verdict: {
    marginBottom: Spacing.xl,
    lineHeight: 26,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  footnotes: {
    gap: Spacing.xs,
    marginBottom: Spacing.xxl,
  },
  footnote: {
    color: Colors.textTertiary,
  },
  doneBtn: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  doneText: {
    ...Typography.headline,
    color: Colors.surface,
  },
});
