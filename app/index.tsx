import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, ChevronRight, Settings as SettingsIcon } from 'lucide-react-native';
import { PLATFORM_LIST, PlatformConfig } from '@/constants/platforms';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PlatformTile } from '@/components/PlatformTile';
import { useStatsStore } from '@/store/statsStore';
import { weekKey } from '@/utils/stats';

const SCREEN_MARGIN = 16;
const GRID_GAP = 16;

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const tileWidth = (width - SCREEN_MARGIN * 2 - GRID_GAP) / 2;

  // A new week began and last week has data the user hasn't reviewed yet.
  const days = useStatsStore((s) => s.days);
  const weeklyShownFor = useStatsStore((s) => s.weeklyShownFor);
  const markWeeklyShown = useStatsStore((s) => s.markWeeklyShown);
  const thisWeek = weekKey();
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeek = weekKey(lastWeekDate);
  const lastWeekHasData = Object.keys(days).some((d) => weekKey(new Date(d)) === lastWeek);
  const reportReady = lastWeekHasData && weeklyShownFor !== thisWeek;

  const openReport = () => {
    markWeeklyShown(thisWeek);
    router.push('/insights');
  };

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
        <View style={styles.headerIcons}>
          <Pressable onPress={() => router.push('/insights')} hitSlop={12}>
            <BarChart3 size={22} color={Colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
            <SettingsIcon size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {reportReady && (
        <Pressable style={styles.reportBanner} onPress={openReport}>
          <Text style={[Typography.headline, { color: Colors.primary }]}>
            Your weekly report is ready
          </Text>
          <ChevronRight size={18} color={Colors.primary} />
        </Pressable>
      )}

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
  headerIcons: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  reportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primarySubtle,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
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
