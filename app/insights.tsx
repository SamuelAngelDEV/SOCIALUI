import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ChevronLeft, ChevronUp } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PLATFORMS, PlatformId } from '@/constants/platforms';
import { PlatformLogo } from '@/components/PlatformLogo';
import { CategoryBars, HourChart, SplitBar, WeekChart } from '@/components/charts';
import { useStatsStore, DayStats } from '@/store/statsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { AMOUNT_BANDS, AMOUNT_PHRASE, AmountAnswer, GoalAnswer, statedWindows } from '@/constants/survey';
import { Strings } from '@/constants/strings';
import { computeReclaimed, formatSpan, MIN_FULL_WEEKS } from '@/utils/reclaimed';
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
  RHYTHM_MIN_DAYS,
  RHYTHM_MIN_MS,
  RHYTHM_WINDOW_DAYS,
  splitByKind,
  weekDays,
  weekKey,
} from '@/utils/stats';

const COPY = Strings.insights;

/** One threshold's state, for the learning card and the still-counting strip. */
type UnlockState = { label: string; ready: boolean; status: string };

/** "Tuesday" for a day inside the last week, otherwise a short date. */
function formatDayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return key;
  const date = new Date(y, m - 1, d);
  const ageDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  return ageDays < 7
    ? date.toLocaleDateString(undefined, { weekday: 'long' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

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

  // The per-app breakdown used to be restated here in prose. It isn't any more:
  // the app cards directly above show the same numbers with a bar each, and
  // saying it twice was a large part of why this screen read as padded.

  if (prev.total > 0) {
    const delta = week.total - prev.total;
    const pct = Math.round((Math.abs(delta) / prev.total) * 100);
    if (pct >= 5) {
      // No credit taken for the fall, per the rule in utils/reclaimed.ts — the
      // old copy here said "the app is doing its job", which is exactly the
      // counterfactual that file exists to refuse.
      lines.push(
        delta < 0
          ? `Down ${pct}% from the week before.`
          : `Up ${pct}% from the week before.`
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
 *
 * Only rendered once there IS a split to show. The "nothing yet" case belongs to
 * `LearningCard`, which states it once for the whole screen rather than leaving a
 * one-sentence stub here.
 */
function SplitCard({ categories }: { categories: Partial<Record<Category, number>> }) {
  const split = splitByKind(categories);
  if (split.algorithmicShare === null) return null;

  const algoPct = Math.round(split.algorithmicShare * 100);

  return (
    <View style={styles.card}>
      <Text style={[Typography.largeTitle, styles.splitHeadline]}>
        {algoPct}% {COPY.splitHeadline}
      </Text>
      <Text style={[Typography.callout, styles.splitSub]}>{COPY.splitBody}</Text>

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
          {COPY.splitUnclassified(formatDuration(split.unclassified))}
        </Text>
      )}
    </View>
  );
}

/**
 * When the algorithm gets the most of the day. Informational — no target, no nudge.
 *
 * The finding is the product; the band underneath is evidence for it. That order
 * is deliberate (`research/02` §6): the hourly chart is a commodity — a competitor
 * already ships one and gets nothing for it — while the named window is the thing
 * nobody else says out loud. Rendered only when there is a finding, or when
 * onboarding gave us a claim of the user's own to repeat back.
 */
function RhythmCard({
  histogram,
  statedWindow,
}: {
  histogram: HourHistogram;
  /** Human-readable window from onboarding's "when" answer, if any was given. */
  statedWindow: string | null;
}) {
  const finding = findRhythmWindow(histogram);
  if (!finding && !statedWindow) return null;

  return (
    <View style={styles.card}>
      {finding ? (
        <>
          <Text style={[Typography.title, styles.rhythmHeadline]}>{describeRhythm(finding)}</Text>
          <Text style={[Typography.callout, styles.splitSub]}>
            {COPY.rhythmEvidence(histogram.daysWithData)}
          </Text>
        </>
      ) : (
        <Text style={[Typography.body, styles.muted, styles.splitSub]}>
          {COPY.rhythmStated(statedWindow!)}
        </Text>
      )}

      <HourChart
        values={histogram.hours}
        highlightStart={finding?.startHour}
        highlightLength={finding?.lengthHours}
        color={ALGORITHMIC_COLOR}
        height={48}
        showAxis={false}
      />
    </View>
  );
}

/** One "name — status" line, shared by the learning card and the still-counting strip. */
function UnlockRow({ label, status, ready }: {
  label: string;
  status: string;
  ready: boolean;
}) {
  return (
    <View style={styles.unlockRow}>
      <Text style={[Typography.body, !ready && styles.muted]}>{label}</Text>
      <Text style={[Typography.callout, ready ? styles.unlockReady : styles.unlockPending]}>
        {status}
      </Text>
    </View>
  );
}

/**
 * THE FRESH-INSTALL SCREEN.
 *
 * Replaces what used to be four separate near-empty cards, each printing its own
 * "not enough data yet" sentence under its own heading. Rendering the mature
 * layout with the slots empty is what made this screen look broken on day one.
 *
 * Saying it once, and naming what each reader is still waiting for, is both
 * fuller and more honest — it answers "how does it decide things" before it has
 * decided anything, which is the only time that answer is free of spin.
 */
function LearningCard({ since, rows }: { since: string | null; rows: UnlockState[] }) {
  return (
    <View style={styles.card}>
      <Text style={[Typography.title, styles.rhythmHeadline]}>
        {since ? COPY.learningTitle(since) : COPY.learningFirstDay}
      </Text>
      {since && (
        <Text style={[Typography.callout, styles.splitSub]}>{COPY.learningBody}</Text>
      )}
      <View style={styles.unlockList}>
        {rows.map((r) => (
          <UnlockRow key={r.label} label={r.label} status={r.status} ready={r.ready} />
        ))}
      </View>
      <Text style={[Typography.callout, styles.splitFootnote]}>{COPY.learningFooter}</Text>
    </View>
  );
}

/** The collapsed methodology note. One place that states every threshold. */
function MethodCard() {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.card}>
      <Pressable
        style={styles.methodHeader}
        onPress={() => setOpen((v) => !v)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={Typography.headline}>{COPY.methodTitle}</Text>
        {open ? (
          <ChevronUp size={18} color={Colors.textSecondary} />
        ) : (
          <ChevronDown size={18} color={Colors.textSecondary} />
        )}
      </Pressable>
      {open && (
        <View style={styles.methodBody}>
          {[
            COPY.methodTiming,
            COPY.methodSplit,
            COPY.methodRhythm(RHYTHM_MIN_DAYS, Math.round(RHYTHM_MIN_MS / 60_000)),
            COPY.methodTrend(MIN_FULL_WEEKS),
            COPY.methodNoCredit,
          ].map((line) => (
            <Text key={line} style={[Typography.callout, styles.methodLine]}>
              {line}
            </Text>
          ))}
        </View>
      )}
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

  // The 'learning' branch is not rendered here. It is reported once, alongside
  // the other two thresholds, by LearningCard / the still-counting strip.
  if (r.kind === 'learning') return null;

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

  // ── What each reader is allowed to say yet ──────────────────────────────
  // One place, three thresholds. Previously each card decided this for itself
  // and printed its own variant of "not yet", which is how the screen ended up
  // with four different ways of saying the same thing.
  const hasSplit = splitByKind(week.categories).algorithmicShare !== null;
  const hasRhythm = findRhythmWindow(rhythm) !== null;
  const reclaimed = computeReclaimed(days);
  const hasTrend = reclaimed.kind !== 'learning';

  const rhythmDaysLeft = Math.max(0, RHYTHM_MIN_DAYS - rhythm.daysWithData);
  const trendWeeksLeft =
    reclaimed.kind === 'learning' ? Math.max(1, MIN_FULL_WEEKS - reclaimed.fullWeeks) : 0;

  const unlocks: UnlockState[] = [
    {
      label: COPY.unlockSplit,
      ready: hasSplit,
      status: hasSplit ? COPY.unlockReady : COPY.unlockDays(1),
    },
    {
      label: COPY.unlockRhythm,
      ready: hasRhythm,
      status: hasRhythm
        ? COPY.unlockReady
        : rhythmDaysLeft > 0
          ? COPY.unlockDays(rhythmDaysLeft)
          : COPY.unlockWatching,
    },
    {
      label: COPY.unlockTrend,
      ready: hasTrend,
      status: hasTrend ? COPY.unlockReady : COPY.unlockWeeks(trendWeeksLeft),
    },
  ];
  const pending = unlocks.filter((u) => !u.ready);

  const firstDayKey = Object.keys(days).sort()[0];
  const countingSince = firstDayKey ? formatDayLabel(firstDayKey) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={26} color={Colors.textPrimary} />
        </Pressable>
        <View>
          <Text style={Typography.title}>{COPY.title}</Text>
          <Text style={[Typography.callout, styles.subtitle]}>{COPY.subtitle}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {!hasSplit ? (
          /* Nothing measured yet — one complete card instead of four stubs. */
          <LearningCard since={countingSince} rows={unlocks} />
        ) : (
          <>
            {/* 1 — the headline, and the evidence directly under it. */}
            <SplitCard categories={week.categories} />

            {/* 2 — the week itself, then the same week split by app. */}
            <View style={styles.card}>
              <View style={styles.weekHeader}>
                <Text style={Typography.figureLG}>{formatDuration(week.total)}</Text>
                <View style={styles.weekMeta}>
                  <Text style={[Typography.callout, styles.muted]}>{COPY.weekTotal}</Text>
                  {prev.total > 0 ? (
                    <Text style={[Typography.callout, styles.muted]}>
                      {COPY.weekDelta(
                        formatDuration(Math.abs(week.total - prev.total)),
                        week.total <= prev.total ? 'down' : 'up'
                      )}
                    </Text>
                  ) : (
                    <Text style={[Typography.callout, styles.muted]}>{COPY.weekNoPrev}</Text>
                  )}
                </View>
              </View>
              <WeekChart values={week.perDay} />
            </View>

            {activePlatforms.map(([pid, ms]) => (
              <PlatformCard
                key={pid}
                platform={pid}
                totalMs={ms}
                cats={week.byPlatform[pid] ?? {}}
                weekTotal={week.total}
              />
            ))}

            {/* 3 — when, if there is anything honest to say about when. */}
            <RhythmCard histogram={rhythm} statedWindow={statedWindowText} />

            {/* 4 — over time. Renders nothing at all until two full weeks. */}
            <ReclaimedCard days={days} />

            {feedback.length > 0 && (
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
            )}

            {/* Anything not ready yet, as one compact strip rather than as
                several empty cards competing with the ones that do have data. */}
            {pending.length > 0 && (
              <View style={styles.card}>
                <Text style={[Typography.caption, styles.stillComing]}>{COPY.stillComing}</Text>
                <View style={styles.unlockList}>
                  {pending.map((u) => (
                    <UnlockRow key={u.label} label={u.label} status={u.status} ready={false} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* 5 — how any of this was worked out. Collapsed; always available. */}
        <MethodCard />
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
  unlockList: {
    gap: 12,
    marginTop: 4,
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  unlockReady: {
    color: Colors.primary,
  },
  unlockPending: {
    color: Colors.textTertiary,
  },
  stillComing: {
    marginBottom: 12,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  methodBody: {
    marginTop: 14,
    gap: 12,
  },
  methodLine: {
    lineHeight: 19,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  weekMeta: {
    alignItems: 'flex-end',
    gap: 2,
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
