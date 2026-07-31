import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PLATFORMS, PlatformId } from '@/constants/platforms';
import { PlatformLogo } from '@/components/PlatformLogo';
import { CategoryBars, HourChart, SplitBar, WeekChart } from '@/components/charts';
import { useStatsStore, DayStats } from '@/store/statsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { AMOUNT_BANDS, AMOUNT_PHRASE, AmountAnswer, GoalAnswer, statedWindows } from '@/constants/survey';
import { Strings } from '@/constants/strings';
import { computeReclaimed, formatSpan } from '@/utils/reclaimed';
import {
  categoriesOfKind,
  Category,
  CATEGORY_LABELS,
  describeRhythm,
  findRhythmWindow,
  formatDuration,
  formatHour,
  HourHistogram,
  hourHistogram,
  KIND_LABELS,
  lastNDayKeys,
  RHYTHM_WINDOW_DAYS,
  splitByKind,
  weekDays,
  weekKey,
} from '@/utils/stats';

/** Gold for what the ranking model chose, green for what the user chose. */
const ALGORITHMIC_COLOR = Colors.accentGold;
const INTENTIONAL_COLOR = Colors.primary;

/** Category bars carry the same colour language as the headline split. */
const CATEGORY_COLORS: Record<Category, string> = {
  feed: ALGORITHMIC_COLOR,
  reels: ALGORITHMIC_COLOR,
  messages: INTENTIONAL_COLOR,
  video: INTENTIONAL_COLOR,
  other: Colors.textTertiary,
};

type WeekAgg = {
  total: number;
  perDay: number[]; // Mon..Sun, ms
  platforms: Partial<Record<PlatformId, number>>;
  categories: Partial<Record<Category, number>>;
  /** Activity split per platform — drives the per-app sections. */
  byPlatform: Partial<Record<PlatformId, Partial<Record<Category, number>>>>;
  daysWithData: number;
};

function aggregateWeek(days: Record<string, DayStats>, monKey: string): WeekAgg {
  const keys = weekDays(monKey);
  const agg: WeekAgg = {
    total: 0, perDay: [], platforms: {}, categories: {}, byPlatform: {}, daysWithData: 0,
  };
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
    for (const [p, cats] of Object.entries(day.byPlatform ?? {})) {
      const pid = p as PlatformId;
      const into = agg.byPlatform[pid] ?? (agg.byPlatform[pid] = {});
      for (const [c, ms] of Object.entries(cats ?? {})) {
        into[c as Category] = (into[c as Category] ?? 0) + (ms ?? 0);
      }
    }
  }
  return agg;
}

/** Plain-language weekly feedback. Observational, never judgmental. */
function buildFeedback(
  week: WeekAgg,
  prev: WeekAgg,
  guessedAmount?: AmountAnswer,
  monthGoal?: GoalAnswer,
  algorithmicHours?: number[]
): string[] {
  const lines: string[] = [];
  if (week.total === 0) return ['Nothing logged this week yet. Open a platform and it starts counting.'];

  if (guessedAmount && week.daysWithData > 0) {
    const daily = week.total / week.daysWithData;
    lines.push(
      guessedAmount === 'unsure'
        ? Strings.insights.guessUnsureMeasured(formatDuration(daily))
        : Strings.insights.guessVsMeasured(AMOUNT_PHRASE[guessedAmount], formatDuration(daily))
    );
  }

  const platforms = Object.entries(week.platforms).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  if (platforms.length) {
    const [pid, ms] = platforms[0];
    const share = Math.round(((ms ?? 0) / week.total) * 100);
    const name = PLATFORMS[pid as PlatformId]?.name ?? pid;
    lines.push(`${name} took the most of your time — ${formatDuration(ms ?? 0)} (${share}% of the week).`);

    // Now that activity is tracked per app, name the specific driver.
    const topCats = Object.entries(week.byPlatform[pid as PlatformId] ?? {})
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
    if (topCats.length) {
      const [cat, catMs] = topCats[0];
      lines.push(
        `On ${name}, most of it was ${CATEGORY_LABELS[cat as Category].toLowerCase()} ` +
        `(${formatDuration(catMs ?? 0)}).`
      );
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

  const goalLine = goalProgressLine(monthGoal, prev, guessedAmount, daily, week.daysWithData, algorithmicHours);
  if (goalLine) lines.push(goalLine);

  return lines;
}

/**
 * One line measuring the week against onboarding's Q5 answer — the stated goal
 * takes the place of a streak. Silent (returns null) whenever there isn't
 * enough data to say something honest, same rule the rest of this file follows.
 */
function goalProgressLine(
  goal: GoalAnswer | undefined,
  prev: WeekAgg,
  guessedAmount: AmountAnswer | undefined,
  dailyMs: number,
  daysWithData: number,
  algorithmicHours: number[] | undefined
): string | null {
  if (!goal) return null;

  switch (goal) {
    case 'half': {
      const band = guessedAmount ? AMOUNT_BANDS[guessedAmount] : null;
      const baselineDaily = band
        ? (band.minMs + (band.maxMs ?? band.minMs + 2 * 60 * 60_000)) / 2
        : prev.daysWithData > 0
          ? prev.total / prev.daysWithData
          : null;
      if (baselineDaily === null || baselineDaily <= 0) return null;
      const target = baselineDaily / 2;
      return dailyMs <= target
        ? `Your goal was to cut this roughly in half — you're averaging ${formatDuration(dailyMs)} a day, at or under that mark.`
        : `Your goal was to cut this roughly in half — you're averaging ${formatDuration(dailyMs)} a day, still above half of where you started.`;
    }
    case 'hour': {
      if (prev.daysWithData === 0) return null;
      const prevDaily = prev.total / prev.daysWithData;
      const savedMs = prevDaily - dailyMs;
      const HOUR_MS = 60 * 60_000;
      return savedMs >= HOUR_MS
        ? `Your goal was about an hour back a day — you're averaging ${formatDuration(savedMs)} less than last week.`
        : savedMs > 0
          ? `Your goal was about an hour back a day — you're averaging ${formatDuration(savedMs)} less than last week, not quite there yet.`
          : `Your goal was about an hour back a day — last week didn't move in that direction yet.`;
    }
    case 'night': {
      if (!algorithmicHours) return null;
      const nightMs =
        algorithmicHours.slice(22, 24).reduce((a, b) => a + b, 0) +
        algorithmicHours.slice(0, 2).reduce((a, b) => a + b, 0);
      return nightMs > 0
        ? `Your goal was to stop the late-night scrolling — ${formatDuration(nightMs)} of algorithmic time landed between 10pm and 2am over the last ${RHYTHM_WINDOW_DAYS} days.`
        : `Your goal was to stop the late-night scrolling — nothing landed between 10pm and 2am over the last ${RHYTHM_WINDOW_DAYS} days.`;
    }
    case 'stop': {
      return `Your goal was to stop opening it without meaning to — you were active ${daysWithData} of the last 7 days. See the split above for how much of that was chosen for you.`;
    }
    default:
      return null;
  }
}

/**
 * The headline. Screen Time reports which app; this reports which kind of screen.
 * Percentages are taken over classified time only — see CATEGORY_KIND in utils/stats
 * for why 'other' sits outside the ratio.
 */
function SplitCard({ categories }: { categories: Partial<Record<Category, number>> }) {
  const split = splitByKind(categories);

  if (split.algorithmicShare === null) {
    return (
      <View style={styles.card}>
        <Text style={[Typography.body, styles.muted]}>
          Nothing to split yet this week. Once you spend time in an app, it shows up here.
        </Text>
      </View>
    );
  }

  const algoPct = Math.round(split.algorithmicShare * 100);

  return (
    <View style={styles.card}>
      <Text style={[Typography.largeTitle, styles.splitHeadline]}>
        {algoPct}% of your time was chosen for you.
      </Text>
      <Text style={[Typography.callout, styles.splitSub]}>
        Feeds and reels are ranked by an algorithm. Messages and the videos you open are not.
      </Text>

      <SplitBar
        segments={[
          {
            key: 'algorithmic',
            label: KIND_LABELS.algorithmic,
            value: split.algorithmic,
            valueLabel: formatDuration(split.algorithmic),
            color: ALGORITHMIC_COLOR,
          },
          {
            key: 'intentional',
            label: KIND_LABELS.intentional,
            value: split.intentional,
            valueLabel: formatDuration(split.intentional),
            color: INTENTIONAL_COLOR,
          },
        ]}
      />

      {split.unclassified > 0 && (
        <Text style={[Typography.callout, styles.splitFootnote]}>
          {formatDuration(split.unclassified)} was profiles, search and settings — we can&apos;t
          tell which side that belongs on, so it stays out of the split.
        </Text>
      )}
    </View>
  );
}

/** When the algorithm gets the most of the day. Informational — no target, no nudge. */
function RhythmCard({
  histogram,
  statedWindow,
}: {
  histogram: HourHistogram;
  /** Human-readable window from onboarding's "when" answer, if any was given. */
  statedWindow: string | null;
}) {
  const finding = findRhythmWindow(histogram);

  return (
    <View style={styles.card}>
      {finding ? (
        <>
          <Text style={[Typography.title, styles.rhythmHeadline]}>{describeRhythm(finding)}</Text>
          <Text style={[Typography.callout, styles.splitSub]}>
            From your last {histogram.daysWithData} days with activity. Worth knowing, that&apos;s all.
          </Text>
        </>
      ) : statedWindow ? (
        <Text style={[Typography.body, styles.muted]}>
          {Strings.insights.rhythmStated(statedWindow)}
        </Text>
      ) : (
        <Text style={[Typography.body, styles.muted]}>
          Still learning your rhythm. A few more days of data and there&apos;ll be enough here
          to say something honest about when feeds take the most of your day.
        </Text>
      )}

      <HourChart
        values={histogram.hours}
        highlightStart={finding?.startHour}
        highlightLength={finding?.lengthHours}
        color={ALGORITHMIC_COLOR}
      />
    </View>
  );
}

/**
 * What the current pace, or the change in it, works out to over a year.
 *
 * The framing rule is enforced in utils/reclaimed.ts and repeated here because
 * this is where it would break: every sentence describes the user's own measured
 * numbers. Nothing claims the app caused the change. A rise is stated as plainly
 * as a fall — hiding it would make the falls untrustworthy too.
 */
function ReclaimedCard({ days }: { days: Record<string, DayStats> }) {
  const r = computeReclaimed(days);

  if (r.kind === 'learning') {
    return (
      <View style={styles.card}>
        <Text style={[Typography.body, styles.muted]}>
          Once there are two full weeks here, this will show what your usage works out
          to over a year — and whether it&apos;s moving.
        </Text>
      </View>
    );
  }

  if (r.kind === 'rate') {
    return (
      <View style={styles.card}>
        <Text style={[Typography.figureXL, styles.reclaimedFigure]}>
          {formatSpan(r.daysPerYear)}
        </Text>
        <Text style={[Typography.callout, styles.splitSub]}>
          a year, at your current pace of {formatDuration(r.msPerWeek)} a week.
        </Text>
        <Text style={[Typography.callout, styles.muted, styles.reclaimedFoot]}>
          For context, the global average is about 2h 21m a day — nearly 36 days a
          year. (DataReportal / GWI, Digital 2026.)
        </Text>
      </View>
    );
  }

  const down = r.direction === 'down';
  return (
    <View style={styles.card}>
      <Text style={[Typography.figureXL, styles.reclaimedFigure]}>
        {formatSpan(r.daysPerYear)}
      </Text>
      <Text style={[Typography.callout, styles.splitSub]}>
        {down ? 'a year, at this rate' : 'a year more, at this rate'}
      </Text>

      <Text style={[Typography.body, styles.reclaimedBody]}>
        You&apos;re {down ? 'down' : 'up'} {formatDuration(r.deltaMsPerWeek)} a week from
        your first full week ({formatDuration(r.baselineMsPerWeek)} then,{' '}
        {formatDuration(r.currentMsPerWeek)} now).
      </Text>

      <View style={styles.reclaimedBars}>
        <ComparisonBar
          label="First week"
          ms={r.baselineMsPerWeek}
          maxMs={Math.max(r.baselineMsPerWeek, r.currentMsPerWeek)}
          color={ALGORITHMIC_COLOR}
        />
        <ComparisonBar
          label="This week"
          ms={r.currentMsPerWeek}
          maxMs={Math.max(r.baselineMsPerWeek, r.currentMsPerWeek)}
          color={down ? INTENTIONAL_COLOR : ALGORITHMIC_COLOR}
        />
      </View>

      <Text style={[Typography.callout, styles.muted, styles.reclaimedFoot]}>
        Arithmetic on your own numbers, projected out. It describes what you recorded —
        not what caused it.
      </Text>
    </View>
  );
}

function ComparisonBar({ label, ms, maxMs, color }: {
  label: string;
  ms: number;
  maxMs: number;
  color: string;
}) {
  const pct = maxMs > 0 ? Math.max(0.02, ms / maxMs) : 0;
  return (
    <View style={styles.cmpRow}>
      <View style={styles.cmpLabelRow}>
        <Text style={[Typography.callout, styles.muted]}>{label}</Text>
        <Text style={[Typography.callout, styles.muted]}>{formatDuration(ms)}</Text>
      </View>
      <View style={styles.cmpTrack}>
        <View style={[styles.cmpFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

/** One app's card: its logo, its total, and its own activity split. */
function PlatformCard({ platform, totalMs, cats, weekTotal }: {
  platform: PlatformId;
  totalMs: number;
  cats: Partial<Record<Category, number>>;
  weekTotal: number;
}) {
  const rows = (Object.entries(cats) as [Category, number][])
    .filter(([, ms]) => ms > 0)
    .sort((a, b) => b[1] - a[1]);
  const share = Math.round((totalMs / Math.max(weekTotal, 1)) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.platHeader}>
        <PlatformLogo platform={platform} size={28} />
        <Text style={[Typography.headline, styles.platName]}>
          {PLATFORMS[platform]?.name ?? platform}
        </Text>
        <View style={styles.platTotals}>
          <Text style={Typography.headline}>{formatDuration(totalMs)}</Text>
          <Text style={styles.platShare}>{share}% of week</Text>
        </View>
      </View>

      <CategoryBars
        total={totalMs}
        emptyLabel="No activity detail recorded yet."
        rows={rows.map(([cat, ms]) => ({
          key: cat,
          label: CATEGORY_LABELS[cat],
          value: ms,
          valueLabel: formatDuration(ms),
          color: CATEGORY_COLORS[cat],
        }))}
      />
    </View>
  );
}

export default function Insights() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const days = useStatsStore((s) => s.days);
  const timeOfDay = useSettingsStore((s) => s.timeOfDay);
  const timeEstimate = useSettingsStore((s) => s.timeEstimate);
  const monthGoal = useSettingsStore((s) => s.monthGoal);

  const thisMon = weekKey();
  const prevMonDate = new Date();
  prevMonDate.setDate(prevMonDate.getDate() - 7);
  const prevMon = weekKey(prevMonDate);

  const week = aggregateWeek(days, thisMon);
  const prev = aggregateWeek(days, prevMon);

  // Rhythm reads a rolling window, not the calendar week — a pattern needs more
  // than the two days a fresh Monday would give it.
  const rhythm = hourHistogram(
    days,
    lastNDayKeys(RHYTHM_WINDOW_DAYS),
    categoriesOfKind('algorithmic')
  );
  const feedback = buildFeedback(week, prev, timeEstimate, monthGoal, rhythm.hours);
  const statedWindowText =
    statedWindows(timeOfDay)
      .map((w) => `${formatHour(w.startHour)}–${formatHour(w.endHour)}`)
      .join(', ') || null;

  // Apps that actually saw use, busiest first.
  const activePlatforms = (Object.entries(week.platforms) as [PlatformId, number][])
    .filter(([, ms]) => ms > 0)
    .sort((a, b) => b[1] - a[1]);

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
        <Text style={styles.sectionTitle}>WHO CHOSE IT — THIS WEEK</Text>
        <SplitCard categories={week.categories} />

        {rhythm.total > 0 && (
          <>
            <Text style={styles.sectionTitle}>YOUR RHYTHM</Text>
            <RhythmCard histogram={rhythm} statedWindow={statedWindowText} />
          </>
        )}

        <Text style={styles.sectionTitle}>OVER A YEAR</Text>
        <ReclaimedCard days={days} />

        <Text style={styles.sectionTitle}>TOTAL — ALL APPS</Text>
        <View style={styles.card}>
          <Text style={[Typography.largeTitle, styles.total]}>
            {formatDuration(week.total)}
          </Text>
          <WeekChart values={week.perDay} />
        </View>

        {activePlatforms.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>BY APP</Text>
            {activePlatforms.map(([pid, ms]) => (
              <PlatformCard
                key={pid}
                platform={pid}
                totalMs={ms}
                cats={week.byPlatform[pid] ?? {}}
                weekTotal={week.total}
              />
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>SUMMARY</Text>
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
              <WeekChart values={prev.perDay} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  reclaimedFigure: {
    marginBottom: 2,
  },
  reclaimedBody: {
    marginTop: 12,
    lineHeight: 21,
  },
  reclaimedBars: {
    marginTop: 16,
    gap: 10,
  },
  reclaimedFoot: {
    marginTop: 14,
  },
  cmpRow: {
    gap: 6,
  },
  cmpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cmpTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  cmpFill: {
    height: '100%',
    borderRadius: 4,
  },
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
  muted: {
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  splitHeadline: {
    lineHeight: 34,
    marginBottom: 6,
  },
  splitSub: {
    lineHeight: 18,
    marginBottom: 16,
  },
  splitFootnote: {
    color: Colors.textTertiary,
    lineHeight: 18,
    marginTop: 14,
  },
  rhythmHeadline: {
    lineHeight: 28,
    marginBottom: 6,
  },
  total: {
    textAlign: 'center',
    marginBottom: 12,
  },
  platHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    gap: 10,
  },
  platName: {
    flex: 1,
  },
  platTotals: {
    alignItems: 'flex-end',
  },
  platShare: {
    ...Typography.callout,
    color: Colors.textTertiary,
  },
  feedbackLine: {
    lineHeight: 21,
  },
});
