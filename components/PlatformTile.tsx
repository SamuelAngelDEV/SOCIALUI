import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PlatformConfig } from '@/constants/platforms';
import { PlatformLogo } from './PlatformLogo';

type Props = {
  platform: PlatformConfig;
  width: number;
  onPress: () => void;
};

const LOGO_SIZE = 62;

export function PlatformTile({ platform, width, onPress }: Props) {
  const blockOnly = platform.kind === 'block-only';

  return (
    <Pressable style={[styles.tile, { width }]} onPress={onPress}>
      <View>
        <PlatformLogo platform={platform.id} size={LOGO_SIZE} />
        {platform.beta && (
          <View style={styles.betaBadge}>
            <Text style={styles.betaText}>BETA</Text>
          </View>
        )}
        {blockOnly && (
          <View style={styles.blockBadge}>
            <Text style={styles.blockText}>BLOCK ONLY</Text>
          </View>
        )}
      </View>
      <Text style={[Typography.tileLabel, styles.label]}>{platform.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  label: {
    marginTop: 12,
  },
  // Red sticker at the lower-left of the icon, as in SocialLite.
  betaBadge: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    backgroundColor: Colors.badgeRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  betaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.4,
    color: '#FFFFFF',
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
  blockText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.4,
    color: '#FFFFFF',
  },
});
