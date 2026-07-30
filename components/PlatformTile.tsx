import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
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
            <Text style={styles.badgeText}>BETA</Text>
          </View>
        )}
        {!comingSoon && blockOnly && (
          <View style={styles.blockBadge}>
            <Text style={styles.badgeText}>BLOCK ONLY</Text>
          </View>
        )}
        {comingSoon && (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.badgeText}>SOON</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[Typography.headline, comingSoon && styles.dimmedText]}>
          {platform.name}
        </Text>
        {!comingSoon && hasTime && (
          <Text style={styles.statText}>{formatMs(todayMs)} today</Text>
        )}
        {!comingSoon && !hasTime && activeCount !== undefined && activeCount > 0 && (
          <Text style={styles.statText}>
            {activeCount} filter{activeCount !== 1 ? 's' : ''} active
          </Text>
        )}
        {comingSoon && (
          <Text style={styles.statText}>Coming soon</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
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
  betaBadge: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    backgroundColor: Colors.badgeRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  blockBadge: {
    position: 'absolute',
    bottom: -6,
    left: -14,
    backgroundColor: Colors.accentGold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  comingSoonBadge: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    backgroundColor: Colors.textTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.4,
    color: '#FFFFFF',
  },
  tileDimmed: {
    opacity: 0.85,
  },
  dimmedText: {
    color: Colors.textTertiary,
  },
});
