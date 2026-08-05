import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, ChevronRight, MoonStar, Settings as SettingsIcon, Shield } from 'lucide-react-native';
import { PLATFORM_LIST, PlatformConfig, PlatformId } from '@/constants/platforms';
import { COMING_SOON, FEATURES } from '@/constants/features';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Strings } from '@/constants/strings';
import { PlatformTile } from '@/components/PlatformTile';
import { Card, IconChip, NoticeRow, Pill, SectionLabel, StatTile } from '@/components/ui';
import { useSettingsStore } from '@/store/settingsStore';
import { useStatsStore } from '@/store/statsStore';
import { dayKey, formatHourRange, splitByKind, weekKey } from '@/utils/stats';
import { isWithinWindow, nextBoundary } from '@/utils/schedule';

const SCREEN_MARGIN = 16;
const GRID_GAP = 12;

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
  const platformInUse = useSettingsStore((s) => s.platformInUse);

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

  // Quiet hours are surfaced here but NOT enforced here. Opening a platform
  // still navigates; the wall (and the only "open anyway" path) lives on the
  // platform screen. One wall in one place beats a dead tile the user can't get
  // past and a second override UI to keep in sync.
  const quietHours = useSettingsStore((s) => s.quietHours);
  const [quietNow, setQuietNow] = useState(false);
  useEffect(() => {
    if (!quietHours.enabled) {
      setQuietNow(false);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const evaluate = () => {
      setQuietNow(isWithinWindow(new Date(), quietHours));
      const ms = nextBoundary(new Date(), quietHours);
      if (ms !== null) timer = setTimeout(evaluate, ms + 1000);
    };
    evaluate();
    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quietHours.enabled, quietHours.startHour, quietHours.endHour]);

  /*
   * Only the apps the user claimed in onboarding. An install predating the
   * picker has every flag true, so it sees exactly what it saw before.
   */
  const visiblePlatforms = PLATFORM_LIST.filter((p) => platformInUse[p.id] !== false);

  // Counted over visible apps only — a filter armed on an app the user has said
  // isn't theirs is not protecting them from anything.
  const totalActiveFilters = visiblePlatforms
    .filter((p) => !COMING_SOON.includes(p.id))
    .reduce((sum, p) => sum + countActiveFeatures(p.id, allSettings[p.id] ?? {}), 0);

  const openReport = () => {
    markWeeklyShown(thisWeek);
    router.push('/insights');
  };

  /*
   * The hero is the app that took the most time TODAY, and only if it took any.
   * On a fresh day there is no hero and the grid is uniform — promoting an app
   * with no data would be inventing a ranking, and the layout would flip around
   * for no reason the user could see.
   */
  const hero = (() => {
    let best: PlatformConfig | null = null;
    let bestMs = 0;
    for (const p of visiblePlatforms) {
      if (COMING_SOON.includes(p.id)) continue;
      const ms = todayPlatforms[p.id] ?? 0;
      if (ms > bestMs) {
        best = p;
        bestMs = ms;
      }
    }
    return best;
  })();

  const gridPlatforms = visiblePlatforms.filter((p) => p.id !== hero?.id);

  // Today's split, for the one line under the headline figure.
  const todayAlgorithmicPct = (() => {
    if (!today) return null;
    const share = splitByKind(today.categories).algorithmicShare;
    return share === null ? null : Math.round(share * 100);
  })();

  const openPlatform = (platform: PlatformConfig) => {
    if (COMING_SOON.includes(platform.id)) return;
    if (platform.kind === 'block-only') {
      router.push('/snapchat');
    } else {
      router.push({ pathname: '/platform/[id]', params: { id: platform.id } });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={Typography.statement}>{Strings.app.name}</Text>
          <Text style={[Typography.callout, styles.subtitle]}>{Strings.app.tagline}</Text>
        </View>
        {/* Icon chips rather than bare glyphs: they give the two controls a
            shape, which is what stops the header reading as a toolbar. */}
        <View style={styles.headerIcons}>
          <Pressable onPress={() => router.push('/insights')} hitSlop={10}>
            <IconChip size={40}>
              <BarChart3 size={19} color={Colors.primary} />
            </IconChip>
          </Pressable>
          <Pressable onPress={() => router.push('/settings')} hitSlop={10}>
            <IconChip size={40}>
              <SettingsIcon size={19} color={Colors.primary} />
            </IconChip>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/*
          ONE card carrying today, instead of a stat strip plus two stacked
          banners. The banners were the main source of the "half the page is
          blank" problem: three full-width blocks each holding one short
          sentence, pushing the grid — the thing the screen is actually for —
          below the fold.
        */}
        <Card style={styles.todayCard}>
          <View style={styles.todayTop}>
            <StatTile
              value={todayTotal > 0 ? formatMs(todayTotal) : '0m'}
              label="today"
              emphasis="xl"
            />
            <View style={styles.todayPills}>
              {quietNow && (
                <Pill
                  label={Strings.quietHours.tileBadge}
                  leading={<MoonStar size={11} color={Colors.primary} />}
                />
              )}
              <Pill
                label={`${totalActiveFilters} filters`}
                tone="quiet"
                leading={<Shield size={11} color={Colors.textSecondary} />}
              />
            </View>
          </View>

          {/* The split, if there is one to show. This is the product's whole
              argument, and the home screen is where it is seen most often —
              gated on the same `algorithmicShare === null` as Insights, so it
              stays silent rather than printing a placeholder percentage. */}
          {todayAlgorithmicPct !== null && (
            <Text style={[Typography.callout, styles.todaySplit]}>
              {todayAlgorithmicPct}% of that was chosen for you.
            </Text>
          )}
        </Card>

        {reportReady && (
          <View style={styles.notice}>
            <NoticeRow
              icon={<BarChart3 size={17} color={Colors.primary} />}
              text="Your weekly report is ready"
              action={<ChevronRight size={17} color={Colors.primary} />}
              onPress={openReport}
            />
          </View>
        )}

        {quietNow && (
          <View style={styles.notice}>
            <NoticeRow
              icon={<MoonStar size={17} color={Colors.primary} />}
              text={Strings.quietHours.ctaActive(
                formatHourRange(quietHours.startHour, quietHours.endHour)
              )}
            />
          </View>
        )}

        {/* The bento: the app that actually took time today leads at full
            width, the rest run two-up underneath. */}
        {hero && (
          <View style={styles.heroWrap}>
            <PlatformTile
              platform={hero}
              wide
              todayMs={todayPlatforms[hero.id]}
              share={todayTotal > 0 ? (todayPlatforms[hero.id] ?? 0) / todayTotal : 0}
              activeCount={countActiveFeatures(hero.id, allSettings[hero.id] ?? {})}
              onPress={() => openPlatform(hero)}
            />
          </View>
        )}

        <SectionLabel>{hero ? 'Everything else' : 'Your apps'}</SectionLabel>

        <View style={styles.grid}>
          {gridPlatforms.map((platform) => (
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Transparent so ThemeBackground shows through. The ground is owned by
    // app/_layout.tsx, once, rather than by each screen.
    backgroundColor: 'transparent',
    paddingHorizontal: SCREEN_MARGIN,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  scroll: {
    paddingBottom: Spacing.xxl,
  },
  todayCard: {
    marginBottom: Spacing.md,
  },
  todayTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  todayPills: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  todaySplit: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
    color: Colors.textSecondary,
  },
  notice: {
    marginBottom: Spacing.md,
  },
  heroWrap: {
    marginBottom: Spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
});
