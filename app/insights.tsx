import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PLATFORMS, PlatformId } from '@/constants/platforms';
import { useStatsStore, DayStats } from '@/store/statsStore';
import {
  Category,
  CATEGORY_LABELS,
  formatDuration,
  weekDays,
  weekKey,
} from '@/utils/stats';

type WeekAgg = {
  total: number;
  perDay: number[]; // Mon..Sun, ms
  platforms: Partial<Record<PlatformId, number>>;
  categories: Partial<Record<Category, number>>;
  daysWithData: number;
};

function aggregateWeek(days: Record<string, DayStats>, monKey: string): WeekAgg {
  const keys = weekDays(monKey);
  const agg: WeekAgg = { total: 0, perDay: [], platforms: {}, categories: {}, daysWithData: 0 };
  for (const key of keys) {
    const day = days[key];
    agg.perDay.push(day?.total ?? 0);
    if (!day) continue;
    agg.daysWithData++;
    agg.total += day.total;
    for (const [p, ms] of Object.entries(day.platforms)) {
      agg.platforms[p as PlatformId] = (agg.platforms[p as PlatformId] ?? 0) + (ms ?? 0);
    }
    for (const [c, ms] of Object.entries(day.categories)) {
      agg.categories[c as Category] = (agg.categories[c as Category] ?? 0) + (ms ?? 0);
    }
  }
  return agg;
}

/** Plain-language weekly feedback. Observational, never judgmental. */
function buildFeedback(week: WeekAgg, prev: WeekAgg): string[] {
  const lines: string[] = [];
  if (week.total === 0) return ['Nothing logged this week yet. Open a platform and it starts counting.'];

  const platforms = Object.entries(week.platforms).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  if (platforms.length) {
    const [pid, ms] = platforms[0];
    const share = Math.round(((ms ?? 0) / week.total) * 100);
    lines.push(
      `${PLATFORMS[pid as PlatformId]?.name ?? pid} took the most of your time — ` +
      `${formatDuration(ms ?? 0)} (${share}% of the week).`
    );
  }

  const cats = Object.entries(week.categories).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  if (cats.length) {
    const [cat, ms] = cats[0];
    lines.push(`Most of that went to ${CATEGORY_LABELS[cat as Category].toLowerCase()} (${formatDuration(ms ?? 0)}).`);
    const msgs = week.categories.messages ?? 0;
    if (msgs > 0 && cat !== 'messages') {
      const ratio = Math.round(((ms ?? 0) / Math.max(msgs, 1)) * 10) / 10;
      if (ratio >= 2) {
        lines.push(`You spent ${ratio}x more time browsing than talking to people.`);
      }
    }
  }

  if (prev.total > 0) {
    const delta = week.total - prev.total;
    const pct = Math.round((Math.abs(delta) / prev.total) * 100);
    if (pct >= 5) {
      lines.push(
        delta < 0
          ? `Down ${pct}% from the week before. The app is doing its job.`
          : `Up ${pct}% from the week before. Worth a look at where it went.`
      );
    } else {
      lines.push('About the same as the week before.');
    }
  }

  const daily = week.total / Math.max(week.daysWithData, 1);
  lines.push(`That averages ${formatDuration(daily)} per active day.`);
  return lines;
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function WeekChart({ perDay }: { perDay: number[] }) {
  const max = Math.max(...perDay, 1);
  return (
    <View style={styles.chart}>
      {perDay.map((ms, i) => (
        <View key={i} style={styles.chartCol}>
          <View style={styles.chartBarWell}>
            <View
              style={[
                styles.chartBar,
                { height: `${Math.max((ms / max) * 100, ms > 0 ? 4 : 0)}%` },
              ]}
            />
          </View>
          <Text style={styles.chartDay}>{DAY_LETTERS[i]}</Text>
        </View>
      ))}
    </View>
  );
}

function BreakdownRows({ entries, total }: {
  entries: [string, number][];
  total: number;
}) {
  return (
    <View style={styles.card}>
      {entries.map(([label, ms], i) => (
        <View key={label} style={[styles.breakRow, i > 0 && styles.breakRowBorder]}>
          <Text style={[Typography.body, styles.breakLabel]}>{label}</Text>
          <View style={styles.breakBarWell}>
            <View style={[styles.breakBar, { width: `${Math.max((ms / Math.max(total, 1)) * 100, 2)}%` }]} />
          </View>
          <Text style={[Typography.callout, styles.breakValue]}>{formatDuration(ms)}</Text>
        </View>
      ))}
    </View>
  );
}

export default function Insights() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const days = useStatsStore((s) => s.days);

  const thisMon = weekKey();
  const prevMonDate = new Date();
  prevMonDate.setDate(prevMonDate.getDate() - 7);
  const prevMon = weekKey(prevMonDate);

  const week = aggregateWeek(days, thisMon);
  const prev = aggregateWeek(days, prevMon);
  const feedback = buildFeedback(week, prev);

  const platformEntries = (Object.entries(week.platforms) as [PlatformId, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([pid, ms]) => [PLATFORMS[pid]?.name ?? pid, ms] as [string, number]);
  const categoryEntries = (Object.entries(week.categories) as [Category, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([cat, ms]) => [CATEGORY_LABELS[cat], ms] as [string, number]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={26} color={Colors.textPrimary} />
        </Pressable>
        <View>
          <Text style={Typography.title}>Insights</Text>
          <Text style={[Typography.callout, styles.subtitle]}>
            Counted on your phone. Never uploaded.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>THIS WEEK</Text>
        <View style={styles.card}>
          <Text style={[Typography.largeTitle, styles.total]}>
            {formatDuration(week.total)}
          </Text>
          <WeekChart perDay={week.perDay} />
        </View>

        {platformEntries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>BY PLATFORM</Text>
            <BreakdownRows entries={platformEntries} total={week.total} />
          </>
        )}

        {categoryEntries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>BY ACTIVITY</Text>
            <BreakdownRows entries={categoryEntries} total={week.total} />
          </>
        )}

        <Text style={styles.sectionTitle}>WEEKLY NOTES</Text>
        <View style={styles.card}>
          {feedback.map((line, i) => (
            <Text
              key={i}
              style={[Typography.body, styles.feedbackLine, i > 0 && { marginTop: 10 }]}
            >
              {line}
            </Text>
          ))}
        </View>

        {prev.total > 0 && (
          <>
            <Text style={styles.sectionTitle}>LAST WEEK</Text>
            <View style={styles.card}>
              <Text style={[Typography.title, styles.total]}>{formatDuration(prev.total)}</Text>
              <WeekChart perDay={prev.perDay} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  back: {
    marginRight: 8,
    marginLeft: -6,
  },
  subtitle: {
    marginTop: 1,
  },
  sectionTitle: {
    ...Typography.caption,
    marginBottom: 8,
    marginLeft: 16,
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  total: {
    textAlign: 'center',
    marginBottom: 12,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 96,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  chartBarWell: {
    flex: 1,
    width: 14,
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 14,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  chartDay: {
    ...Typography.caption,
    marginTop: 6,
  },
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  breakRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  breakLabel: {
    width: 110,
  },
  breakBarWell: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primarySubtle,
    marginRight: 12,
    overflow: 'hidden',
  },
  breakBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  breakValue: {
    minWidth: 56,
    textAlign: 'right',
    color: Colors.textSecondary,
  },
  feedbackLine: {
    lineHeight: 21,
  },
});
