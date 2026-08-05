import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radii, Shadow, Spacing } from '@/constants/spacing';
import { Strings } from '@/constants/strings';
import { PlatformConfig } from '@/constants/platforms';
import { IconChip, Pill } from '@/components/ui';
import { PlatformLogo } from './PlatformLogo';

type Props = {
  platform: PlatformConfig;
  /** Omitted for the wide hero tile, which stretches instead. */
  width?: number;
  comingSoon?: boolean;
  todayMs?: number;
  activeCount?: number;
  /** The wide variant: logo and text sit on one row with the figure trailing. */
  wide?: boolean;
  /** 0..1 share of today's total, drawn as a hairline meter on the wide tile. */
  share?: number;
  onPress: () => void;
};

function formatMs(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 1) return '<1m';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * A home-grid tile.
 *
 * Two variants, which is what makes the grid a bento rather than a matrix: the
 * app you actually used today gets a wide tile carrying its figure inline, and
 * everything else sits in the two-column run below it. A uniform grid gives
 * every app equal weight regardless of whether it took four minutes or four
 * hours, which throws away the one thing the home screen knows.
 *
 * The badges moved from a sticker hanging off the logo's corner to a proper
 * pill on the opposite side. The old placement collided with the logo at small
 * sizes and needed three off-grid optical offsets to sit right.
 */
export function PlatformTile({
  platform,
  width,
  comingSoon,
  todayMs,
  activeCount,
  wide,
  share,
  onPress,
}: Props) {
  const blockOnly = platform.kind === 'block-only';
  const hasTime = todayMs !== undefined && todayMs > 0;

  const badge = comingSoon
    ? { label: Strings.platformTile.soon, tone: 'quiet' as const }
    : blockOnly
      ? { label: Strings.platformTile.blockOnly, tone: 'quiet' as const }
      : platform.beta
        ? { label: Strings.platformTile.beta, tone: 'brand' as const }
        : null;

  const sub = comingSoon
    ? Strings.platformTile.comingSoon
    : hasTime
      ? Strings.platformTile.timeToday(formatMs(todayMs))
      : activeCount
        ? Strings.platformTile.filtersActive(activeCount)
        : null;

  if (wide) {
    return (
      <Pressable
        style={[styles.tile, styles.wideTile, comingSoon && styles.tileDimmed]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <View style={styles.wideRow}>
          <IconChip size={52} tint={Colors.groupedBackground}>
            <PlatformLogo platform={platform.id} size={34} />
          </IconChip>
          <View style={styles.wideText}>
            <Text style={Typography.headline}>{platform.name}</Text>
            {activeCount ? (
              <Text style={[Typography.callout, styles.subText]}>
                {Strings.platformTile.filtersActive(activeCount)}
              </Text>
            ) : null}
          </View>
          <View style={styles.wideFigure}>
            <Text style={Typography.figureLG}>{formatMs(todayMs ?? 0)}</Text>
            <Text style={[Typography.callout, styles.subText]}>today</Text>
          </View>
        </View>

        {/* A meter, not a chart. It answers one question — how much of today
            was this app — and answers it without a legend or an axis. */}
        {share !== undefined && share > 0 && (
          <View style={styles.meterTrack}>
            <View
              style={[styles.meterFill, { width: `${Math.max(2, Math.min(1, share) * 100)}%` }]}
            />
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.tile, { width }, comingSoon && styles.tileDimmed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.topRow}>
        <IconChip size={44} tint={Colors.groupedBackground}>
          <PlatformLogo platform={platform.id} size={28} />
        </IconChip>
        {badge && <Pill label={badge.label} tone={badge.tone} />}
      </View>

      <View style={styles.info}>
        <Text style={[Typography.tileLabel, comingSoon && styles.dimmedText]}>
          {platform.name}
        </Text>
        {sub && <Text style={[Typography.callout, styles.subText]}>{sub}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  wideTile: {
    alignSelf: 'stretch',
    width: '100%',
    padding: Spacing.xl,
  },
  wideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  wideText: {
    flex: 1,
    gap: 2,
  },
  wideFigure: {
    alignItems: 'flex-end',
    gap: 0,
  },
  meterTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.groupedBackground,
    marginTop: Spacing.lg,
    overflow: 'hidden',
  },
  meterFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primaryLine,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: 14,
  },
  info: {
    gap: 2,
  },
  subText: {
    color: Colors.textTertiary,
  },
  tileDimmed: {
    opacity: 0.85,
  },
  dimmedText: {
    color: Colors.textTertiary,
  },
});
