import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings as SettingsIcon } from 'lucide-react-native';
import { PLATFORM_LIST, PlatformConfig } from '@/constants/platforms';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PlatformTile } from '@/components/PlatformTile';

const SCREEN_MARGIN = 16;
const GRID_GAP = 16;

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const tileWidth = (width - SCREEN_MARGIN * 2 - GRID_GAP) / 2;

  const openPlatform = (platform: PlatformConfig) => {
    if (platform.kind === 'block-only') {
      router.push('/snapchat');
    } else {
      router.push({ pathname: '/platform/[id]', params: { id: platform.id } });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <View style={styles.header}>
        <View>
          <Text style={Typography.largeTitle}>Quiet</Text>
          <Text style={[Typography.callout, styles.subtitle]}>less noise, more signal</Text>
        </View>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
          <SettingsIcon size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {PLATFORM_LIST.map((platform) => (
          <PlatformTile
            key={platform.id}
            platform={platform}
            width={tileWidth}
            onPress={() => openPlatform(platform)}
          />
        ))}
      </ScrollView>

      <Text style={[Typography.callout, styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        Change your relationship with your phone.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: SCREEN_MARGIN,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  subtitle: {
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  footer: {
    textAlign: 'center',
    paddingTop: 20,
    color: Colors.textTertiary,
  },
});
