import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radii, Shadow, Spacing } from '@/constants/spacing';
import { Strings } from '@/constants/strings';
import { PlatformConfig } from '@/constants/platforms';
import { PlatformLogo } from './PlatformLogo';

type Props = {
  platform: PlatformConfig;
  width: number;
  comingSoon?: boolean;
  todayMs?: number;
  activeCount?: number;
  onPress: () => void;
};

const LOGO_SIZE = 48;

function formatMs(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 1) return '<1m';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function PlatformTile({
  platform,
  width,
  comingSoon,
  todayMs,
  activeCount,
  onPress,
}: Props) {
  const blockOnly = platform.kind === 'block-only';
  const hasTime = todayMs !== undefined && todayMs > 0;

  return (
    <Pressable
      style={[styles.tile, { width }, comingSoon && styles.tileDimmed]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <PlatformLogo platform={platform.id} size={LOGO_SIZE} />
        {!comingSoon && platform.beta && (
          <View style={styles.betaBadge}>
            <Text style={Typography.badge}>{Strings.platformTile.beta}</Text>
          </View>
        )}
        {!comingSoon && blockOnly && (
          <View style={styles.blockBadge}>
            <Text style={Typography.badge}>{Strings.platformTile.blockOnly}</Text>
          </View>
        )}
        {comingSoon && (
          <View style={styles.comingSoonBadge}>
            <Text style={Typography.badge}>{Strings.platformTile.soon}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[Typography.headline, comingSoon && styles.dimmedText]}>
          {platform.name}
        </Text>
        {!comingSoon && hasTime && (
          <Text style={styles.statText}>
            {Strings.platformTile.timeToday(formatMs(todayMs))}
          </Text>
        )}
        {!comingSoon && !hasTime && activeCount !== undefined && activeCount > 0 && (
          <Text style={styles.statText}>
            {Strings.platformTile.filtersActive(activeCount)}
          </Text>
        )}
        {comingSoon && (
          <Text style={styles.statText}>{Strings.platformTile.comingSoon}</Text>
        )}
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
  topRow: {
    marginBottom: 14,
  },
  info: {
    gap: 2,
  },
  statText: {
    ...Typography.callout,
    color: Colors.textTertiary,
  },
  // Badge offsets are optical: the sticker hangs off the logo's bottom-left corner,
  // so these stay off-grid literals rather than becoming spacing tokens.
  betaBadge: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    backgroundColor: Colors.badgeRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.badge,
  },
  blockBadge: {
    position: 'absolute',
    bottom: -6,
    left: -14,
    backgroundColor: Colors.accentGold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.badge,
  },
  comingSoonBadge: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    backgroundColor: Colors.textTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.badge,
  },
  tileDimmed: {
    opacity: 0.85,
  },
  dimmedText: {
    color: Colors.textTertiary,
  },
});
