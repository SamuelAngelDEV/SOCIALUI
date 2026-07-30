import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, ChevronRight, Settings as SettingsIcon, Shield } from 'lucide-react-native';
import { PLATFORM_LIST, PlatformConfig, PlatformId } from '@/constants/platforms';
import { COMING_SOON, FEATURES } from '@/constants/features';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PlatformTile } from '@/components/PlatformTile';
import { useSettingsStore } from '@/store/settingsStore';
import { useStatsStore } from '@/store/statsStore';
import { dayKey, weekKey } from '@/utils/stats';

const SCREEN_MARGIN = 16;
const GRID_GAP = 16;

function formatMs(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 1) return '<1m';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function countActiveFeatures(platformId: PlatformId, settings: Record<string, unknown>): number {
  const features = FEATURES[platformId] ?? [];
  let count = 0;
  for (const f of features) {
    const v = settings[f.key];
    if (f.alwaysOn) { count++; continue; }
    if (v === true || (typeof v === 'string' && v !== 'visible')) count++;
  }
  return count;
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const onboarded = useSettingsStore((s) => s.onboarded);
  const allSettings = useSettingsStore((s) => s.platformSettings);

  useEffect(() => {
    if (hydrated && !onboarded) {
      router.replace('/onboarding');
    }
  }, [hydrated, onboarded, router]);

  const tileWidth = (width - SCREEN_MARGIN * 2 - GRID_GAP) / 2;

  const days = useStatsStore((s) => s.days);
  const weeklyShownFor = useStatsStore((s) => s.weeklyShownFor);
  const markWeeklyShown = useStatsStore((s) => s.markWeeklyShown);
  const thisWeek = weekKey();
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeek = weekKey(lastWeekDate);
  const lastWeekHasData = Object.keys(days).some((d) => weekKey(new Date(d)) === lastWeek);
  const reportReady = lastWeekHasData && weeklyShownFor !== thisWeek;

  const today = days[dayKey()];
  const todayTotal = today?.total ?? 0;
  const todayPlatforms = today?.platforms ?? {};

  const totalActiveFilters = PLATFORM_LIST.filter(
    (p) => !COMING_SOON.includes(p.id)
  ).reduce((sum, p) => sum + countActiveFeatures(p.id, allSettings[p.id] ?? {}), 0);

  const openReport = () => {
    markWeeklyShown(thisWeek);
    router.push('/insights');
  };

  const openPlatform = (platform: PlatformConfig) => {
    if (COMING_SOON.includes(platform.id)) return;
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

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>
              {todayTotal > 0 ? formatMs(todayTotal) : '0m'}
            </Text>
            <Text style={styles.statusLabel}>today</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <View style={styles.statusValueRow}>
              <Shield size={16} color={Colors.primary} />
              <Text style={styles.statusValue}>{totalActiveFilters}</Text>
            </View>
            <Text style={styles.statusLabel}>filters active</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {PLATFORM_LIST.map((platform) => (
          <PlatformTile
            key={platform.id}
            platform={platform}
            width={tileWidth}
            comingSoon={COMING_SOON.includes(platform.id)}
            todayMs={todayPlatforms[platform.id]}
            activeCount={countActiveFeatures(platform.id, allSettings[platform.id] ?? {})}
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
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.separator,
  },
  statusValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  statusValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    ...Typography.callout,
    color: Colors.textTertiary,
    marginTop: 2,
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
