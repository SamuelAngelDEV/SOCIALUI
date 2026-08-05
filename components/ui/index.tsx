import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radii, Spacing } from '@/constants/spacing';

/**
 * The shared surface primitives.
 *
 * These exist because the density fix has to be systemic, not per-screen. Every
 * screen had been inventing its own card padding, its own icon treatment, its
 * own status strip — which is how the app ended up with half-empty screens that
 * were each individually defensible. One set of parts, used everywhere, is what
 * makes a layout read as designed rather than assembled.
 *
 * Structure is borrowed from the reference shot (tinted icon chips, pill
 * badges, generous internal padding, mixed-size bento tiles). The VALUES are
 * ours: radii cap at `Radii.lg` (16) rather than the reference's 24–32, and
 * every colour is an existing token with a computed WCAG ratio. Copy the
 * layout, never the visual style — `research/03-visual-direction.md`.
 */

/** Card padding. 20 rather than 16: the cheapest "expensive" signal there is. */
export const CARD_PADDING = 20;

export function Card({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Off for cards that manage their own internal padding (row lists). */
  padded?: boolean;
}) {
  return (
    <View style={[styles.card, padded && { padding: CARD_PADDING }, style]}>{children}</View>
  );
}

/**
 * A tinted rounded-square holding an icon or logo.
 *
 * The container is doing the work, not the icon: a row of mixed brand marks
 * (Instagram's gradient next to YouTube's red) reads as noise until each one
 * sits in an identical frame. Chips are what let the home grid carry real logos
 * without looking like a link farm.
 */
export function IconChip({
  children,
  size = 44,
  tint = Colors.primarySubtle,
  style,
}: {
  children: ReactNode;
  size?: number;
  tint?: string;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        styles.chip,
        { width: size, height: size, borderRadius: size >= 44 ? Radii.md : 10, backgroundColor: tint },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * A small status pill.
 *
 * `tone` picks a PRE-VALIDATED pair, deliberately — there is no free colour
 * prop. Every combination below was computed, and the one that failed
 * (`warning` on `groupedBackground`, 4.30:1) is why this is a closed set rather
 * than a `color` parameter someone can pass anything to.
 */
export type PillTone = 'brand' | 'quiet' | 'caution';

const PILL_TONES: Record<PillTone, { bg: string; fg: string }> = {
  // primary #6B2D78 on primarySubtle #F0DDF4 — 7.20:1.
  brand: { bg: Colors.primarySubtle, fg: Colors.primary },
  // Neutral, for "coming soon" and other non-states.
  // textSecondary #5E5166 on groupedBackground #EFE6F2 — 6.07:1.
  quiet: { bg: Colors.groupedBackground, fg: Colors.textSecondary },
  // A scheduled disable. warning #96610F on surface #FDFAFE is 5.05:1; on
  // groupedBackground it is 4.30:1 and FAILS the 4.5 minimum, so this tone pins
  // the lighter ground deliberately rather than inheriting whatever it sits on.
  caution: { bg: Colors.surface, fg: Colors.warning },
};

export function Pill({
  label,
  tone = 'brand',
  leading,
}: {
  label: string;
  tone?: PillTone;
  leading?: ReactNode;
}) {
  const { bg, fg } = PILL_TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {leading}
      <Text style={[Typography.tag, { color: fg }]}>{label}</Text>
    </View>
  );
}

/** Uppercase eyebrow above a block. Positive tracking, per the type scale. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={[Typography.caption, styles.sectionLabel]}>{children}</Text>;
}

/**
 * A figure with its label underneath — the unit of the stat row.
 *
 * Numerals are set LIGHT and large (`figureXL`/`figureLG` are `Inter_300Light`).
 * Big-and-bold reads as an alert; big-and-light reads as a fact, and this
 * product should never look like it is raising its voice about the user's own
 * numbers.
 */
export function StatTile({
  value,
  label,
  leading,
  emphasis = 'lg',
}: {
  value: string;
  label: string;
  leading?: ReactNode;
  emphasis?: 'xl' | 'lg';
}) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statValueRow}>
        {leading}
        <Text style={emphasis === 'xl' ? Typography.figureXL : Typography.figureLG}>
          {value}
        </Text>
      </View>
      <Text style={[Typography.callout, styles.statLabel]}>{label}</Text>
    </View>
  );
}

/** Full-width tappable strip. Used for the report prompt and the quiet banner. */
export function NoticeRow({
  icon,
  text,
  action,
  onPress,
}: {
  icon: ReactNode;
  text: string;
  action?: ReactNode;
  onPress?: () => void;
}) {
  const body = (
    <View style={styles.notice}>
      {icon}
      <Text style={[Typography.callout, styles.noticeText]}>{text}</Text>
      {action}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
  },
  statTile: {
    gap: 2,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statLabel: {
    color: Colors.textTertiary,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primarySubtle,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  noticeText: {
    flex: 1,
    color: Colors.primary,
  },
});
