import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import {
  ALGORITHMIC_COLOR,
  categoryColor,
  categoryTextColor,
  INTENTIONAL_COLOR,
  orderedCategories,
} from '@/constants/activityColors';
import { SectionLabel } from '@/components/ui';
import { Typography } from '@/constants/typography';
import { PLATFORMS, PlatformId } from '@/constants/platforms';
import { PlatformLogo } from '@/components/PlatformLogo';
import { CategoryBars, HourChart, SplitBar, WeekChart } from '@/components/charts';
import { useStatsStore, DayStats } from '@/store/statsStore';
import { PENDING_QUIET_HOURS, useSettingsStore } from '@/store/settingsStore';
import { formatRemaining, pendingFor, remainingMs } from '@/utils/commitment';
import { AMOUNT_BANDS, AMOUNT_PHRASE, AmountAnswer, GoalAnswer, statedWindows } from '@/constants/survey';
import { Strings } from '@/constants/strings';
import {
  computeReclaimed,
  EstimateProjection,
  formatLongSpan,
  formatSpan,
  HORIZON_YEARS,
  MIN_FULL_WEEKS,
  msPerWeekToDaysPerYear,
  projectFromEstimate,
} from '@/utils/reclaimed';
import { suggestWindow } from '@/utils/schedule';
import {
  categoriesOfKind,
  Category,
  categoryLabel,
  CATEGORY_KIND,
  CATEGORY_LABELS,
  describeRhythm,
  findRhythmWindow,
  formatDuration,
  formatHour,
  formatHourRange,
  HourHistogram,
  hourHistogram,
  KIND_LABELS,
  lastNDayKeys,
  RHYTHM_MIN_DAYS,
  RHYTHM_WINDOW_DAYS,
  splitByKind,
  weekDays,
  weekKey,
} from '@/utils/stats';

const COPY = Strings.insights;
const QUIET = Strings.quietHours;

/**
 * One threshold's state, for the learning card and the still-counting strip.
 *
 * `progress` is 0..1 and is what turns "2 more days" from a promise into
 * something the user can see moving. It is only set where the distance to the
 * threshold is actually known — the trend reader knows it has 1 of 2 full
 * weeks, but "no pattern yet" has no denominator, and drawing a half-full bar
 * there would be inventing progress toward something that may never arrive.
 */
type UnlockState = {
  label: string;
  ready: boolean;
  status: string;
  progress?: number;
};

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


type WeekAgg = {
  total: number;
  perDay: number[]; // Mon..Sun, ms
  /**
   * Mon..Sun, split by kind. The weekly chart stacks these rather than drawing
   * one flat total — a heavy feed day and a heavy messaging day are the thing
   * this screen exists to tell apart, so the chart has to show it.
   */
  perDayKind: { algorithmic: number; intentional: number }[];
  platforms: Partial<Record<PlatformId, number>>;
  categories: Partial<Record<Category, number>>;
  /** Activity split per platform — drives the per-app sections. */
  byPlatform: Partial<Record<PlatformId, Partial<Record<Category, number>>>>;
  daysWithData: number;
};

function aggregateWeek(days: Record<string, DayStats>, monKey: string): WeekAgg {
  const keys = weekDays(monKey);
  const agg: WeekAgg = {
    total: 0, perDay: [], perDayKind: [], platforms: {}, categories: {}, byPlatform: {}, daysWithData: 0,
  };
  for (const key of keys) {
    const day = days[key];
    agg.perDay.push(day?.total ?? 0);
    // Split each day as it is read. `splitByKind` already excludes `other`
    // from the ratio, and it is excluded from the column too — an unclassified
    // segment would be a third colour carrying no part of the argument.
    const dayKind = day ? splitByKind(day.categories) : null;
    agg.perDayKind.push({
      algorithmic: dayKind?.algorithmic ?? 0,
      intentional: dayKind?.intentional ?? 0,
    });
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

/**
 * Category rollup across an arbitrary set of day keys.
 *
 * `aggregateWeek` is keyed to a calendar week, which is short mid-week. Anything
 * projected out to a year needs a settled window instead, so the horizon line
 * reads the rolling seven days through this.
 */
function rollupCategories(
  days: Record<string, DayStats>,
  keys: string[]
): Partial<Record<Category, number>> {
  const out: Partial<Record<Category, number>> = {};
  for (const key of keys) {
    const day = days[key];
    if (!day) continue;
    for (const [c, ms] of Object.entries(day.categories)) {
      out[c as Category] = (out[c as Category] ?? 0) + (ms ?? 0);
    }
  }
  return out;
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
function SplitCard({
  categories,
  algorithmicMsPerWeek,
}: {
  categories: Partial<Record<Category, number>>;
  /** Rolling-7-day algorithmic time, for the year projection. 0 hides that line. */
  algorithmicMsPerWeek: number;
}) {
  const split = splitByKind(categories);
  if (split.algorithmicShare === null) return null;

  const algoPct = Math.round(split.algorithmicShare * 100);
  // Ordered algorithmic → intentional, so the bar reads as two families.
  const rows = orderedCategories(categories).filter(
    (r) => CATEGORY_KIND[r.cat] !== 'unclassified'
  );

  return (
    <View style={styles.card}>
      <SectionLabel>{COPY.splitEyebrow}</SectionLabel>

      {/* The unit is set small and inline rather than at figure size. "62" is
          the number being reported; "% algorithmic" is what it is a number OF,
          and setting them at the same weight makes the reader parse a label as
          though it were data. */}
      <View style={styles.splitFigureRow}>
        <Text style={Typography.figureXL}>{algoPct}</Text>
        <Text style={[Typography.title, styles.splitUnit]}>{COPY.splitUnit}</Text>
      </View>
      <Text style={[Typography.body, styles.splitBody]}>{COPY.splitBody}</Text>

      {/* Segmented by category, grouped by kind. The two-tone version said
          "62% / 38%" twice — once as the number above and once as the bar —
          and nothing else. This says which surfaces made up each side. */}
      <SplitBar
        showLegend={false}
        segments={rows.map((r) => ({
          key: r.cat,
          label: CATEGORY_LABELS[r.cat],
          value: r.ms,
          valueLabel: formatDuration(r.ms),
          color: categoryColor(r.cat),
        }))}
      />

      <View style={styles.splitLegend}>
        {rows.map((r) => (
          <View key={r.cat} style={styles.splitLegendRow}>
            <View style={[styles.splitDot, { backgroundColor: categoryColor(r.cat) }]} />
            <Text style={[Typography.body, { color: categoryTextColor(r.cat) }]}>
              {CATEGORY_LABELS[r.cat]}
            </Text>
            {/* The kind, in words. Colour groups the families; this states the
                grouping, so the split survives greyscale and CVD. */}
            <Text style={[Typography.callout, styles.splitKind]}>
              {KIND_LABELS[CATEGORY_KIND[r.cat]].toLowerCase()}
            </Text>
            <Text style={[Typography.body, styles.splitLegendValue]}>
              {formatDuration(r.ms)}
            </Text>
          </View>
        ))}
      </View>

      {/* Measured, so it earns the full-weight treatment — unlike the estimate
          projection on the first-open card. */}
      {algorithmicMsPerWeek > 0 && (
        <Text style={[Typography.body, styles.splitHorizon]}>
          {COPY.splitHorizon(formatSpan(msPerWeekToDaysPerYear(algorithmicMsPerWeek)))}
        </Text>
      )}

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
  const quietHours = useSettingsStore((s) => s.quietHours);
  const setQuietHours = useSettingsStore((s) => s.setQuietHours);
  const timeOfDay = useSettingsStore((s) => s.timeOfDay);
  const pendingChanges = useSettingsStore((s) => s.pendingChanges);
  const cancelPending = useSettingsStore((s) => s.cancelPending);
  const quietPending = pendingFor(pendingChanges, PENDING_QUIET_HOURS);

  if (!finding && !statedWindow) return null;

  // Offer the window Rhythm actually measured. `suggestWindow` prefers the
  // finding over the onboarding claim; with neither it returns null and no
  // action is offered, because there would be nothing to recommend.
  const suggested = suggestWindow(
    finding ? { startHour: finding.startHour, lengthHours: finding.lengthHours } : null,
    statedWindows(timeOfDay)
  );
  const activeWindow = formatHourRange(quietHours.startHour, quietHours.endHour);

  return (
    <View style={styles.card}>
      <SectionLabel>{COPY.rhythmEyebrow}</SectionLabel>
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

      {/*
        The action, and the reason this card stops being purely observational.
        Note what the copy does NOT do: it never says the window will save
        anything. It offers to close a window the user's own data named, and
        says plainly that the way through is still open.
      */}
      {quietHours.enabled ? (
        <View style={styles.quietActive}>
          <Text style={[Typography.body, styles.quietActiveText]}>
            {/* Once a disable is scheduled, saying "quiet hours are on" and
                offering "turn off" again would be describing a state the user
                has already left. Report the wait instead, and make the way back
                the action — the same pair Settings shows. */}
            {quietPending
              ? Strings.commitment.pending(
                  formatRemaining(remainingMs(quietPending, Date.now()))
                )
              : QUIET.ctaActive(activeWindow)}
          </Text>
          <Pressable
            onPress={() =>
              quietPending
                ? cancelPending(PENDING_QUIET_HOURS)
                : setQuietHours({ enabled: false })
            }
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={[Typography.callout, styles.quietTurnOff]}>
              {quietPending ? Strings.commitment.keepOn : QUIET.ctaTurnOff}
            </Text>
          </Pressable>
        </View>
      ) : (
        suggested && (
          <View style={styles.quietCta}>
            <Text style={[Typography.headline, styles.quietCtaTitle]}>{QUIET.ctaTitle}</Text>
            <Text style={[Typography.callout, styles.quietCtaBody]}>
              {QUIET.ctaBody(formatHourRange(suggested.startHour, suggested.endHour))}
            </Text>
            <Pressable
              style={styles.quietCtaButton}
              onPress={() =>
                setQuietHours({
                  enabled: true,
                  startHour: suggested.startHour,
                  endHour: suggested.endHour,
                  source: finding ? 'rhythm' : 'manual',
                })
              }
              accessibilityRole="button"
            >
              <Text style={styles.quietCtaButtonText}>
                {QUIET.ctaButton(formatHourRange(suggested.startHour, suggested.endHour))}
              </Text>
            </Pressable>
          </View>
        )
      )}
    </View>
  );
}

/** One "name — status" line, shared by the learning card and the still-counting strip. */
function UnlockRow({ label, status, ready, progress }: UnlockState) {
  return (
    <View style={styles.unlockBlock}>
      <View style={styles.unlockRow}>
        <Text style={[Typography.body, !ready && styles.muted]}>{label}</Text>
        <Text style={[Typography.callout, ready ? styles.unlockReady : styles.unlockPending]}>
          {status}
        </Text>
      </View>
      {!ready && progress !== undefined && (
        <View style={styles.unlockTrack}>
          <View
            style={[
              styles.unlockFill,
              { width: `${Math.max(3, Math.min(1, progress) * 100)}%` },
            ]}
          />
        </View>
      )}
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
function LearningCard({
  since,
  rows,
  estimate,
}: {
  since: string | null;
  rows: UnlockState[];
  /** Onboarding Q2 projected out. `null` when they answered "unsure". */
  estimate: { projection: EstimateProjection; phrase: string } | null;
}) {
  return (
    <View style={styles.card}>
      {/*
        THE GUESS, AND WHY IT LOOKS LIKE THIS.

        On day one there is nothing measured, so the only honest number available
        is the one the user gave us in onboarding. It is rendered deliberately
        quieter than ReclaimedCard's figureXL — muted colour, smaller figure, its
        own rule above and an eyebrow naming it as theirs BEFORE the number is
        read. That contrast is the honesty guard, not styling: a guess set in the
        same type as a measurement is a guess laundered into a fact.
      */}
      {estimate && (
        <View style={styles.estimateBlock}>
          <Text style={[Typography.caption, styles.estimateEyebrow]}>{COPY.estimateEyebrow}</Text>
          <Text style={[Typography.figureLG, styles.estimateFigure]}>
            {COPY.estimateFigure(
              formatSpan(estimate.projection.daysPerYear),
              estimate.projection.atLeast
            )}
          </Text>
          <Text style={[Typography.callout, styles.estimateSub]}>{COPY.estimateSub}</Text>
          <Text style={[Typography.body, styles.estimateLine]}>
            {COPY.estimateSaid(estimate.phrase)}{' '}
            {COPY.estimateHorizon(
              HORIZON_YEARS,
              formatLongSpan(estimate.projection.daysPerHorizon)
            )}
          </Text>
          <Text style={[Typography.callout, styles.splitFootnote]}>
            {COPY.estimateDisclaimer}
          </Text>
        </View>
      )}

      <Text style={[Typography.title, styles.rhythmHeadline]}>
        {since ? COPY.learningTitle(since) : COPY.learningFirstDay}
      </Text>
      {since && (
        <Text style={[Typography.callout, styles.splitSub]}>{COPY.learningBody}</Text>
      )}

      {/* The idea itself, so the real percentage lands in a frame they already
          hold by the time it arrives. */}
      <Text style={[Typography.body, styles.estimateLine]}>{COPY.splitExample}</Text>

      <View style={styles.unlockList}>
        {rows.map((r) => (
          <UnlockRow key={r.label} {...r} />
        ))}
      </View>
      <Text style={[Typography.callout, styles.splitFootnote]}>{COPY.learningFooter}</Text>
    </View>
  );
}

/*
 * The "How this is worked out" card lived here and has been deleted.
 *
 * It was a text-only card on a screen that should be numbers and charts, and it
 * read as a glossary nobody asked for. The thresholds it listed are better
 * placed next to the thing they gate, where they have context: the unlock rows
 * already say "2 more days", which is the same fact at the moment it matters.
 */

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
          // The platform's own word for the surface — "Shorts" on YouTube,
          // "For You" on TikTok. Same stored category either way.
          label: categoryLabel(platform, cat),
          value: ms,
          valueLabel: formatDuration(ms),
          color: categoryColor(cat),
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
      // Days collected is a real fraction. "No pattern yet" is not — the days
      // are there and the data simply hasn't formed one, so no bar is drawn.
      progress:
        rhythmDaysLeft > 0 ? rhythm.daysWithData / RHYTHM_MIN_DAYS : undefined,
    },
    {
      label: COPY.unlockTrend,
      ready: hasTrend,
      status: hasTrend ? COPY.unlockReady : COPY.unlockWeeks(trendWeeksLeft),
      progress:
        reclaimed.kind === 'learning'
          ? reclaimed.fullWeeks / MIN_FULL_WEEKS
          : undefined,
    },
  ];
  const pending = unlocks.filter((u) => !u.ready);

  const firstDayKey = Object.keys(days).sort()[0];
  const countingSince = firstDayKey ? formatDayLabel(firstDayKey) : null;

  // Their own Q2 answer, projected — the day-one figure. `projectFromEstimate`
  // takes the band rather than the answer id so utils/reclaimed.ts stays free of
  // app imports and its verification script can require the compiled module.
  const estimateProjection = timeEstimate ? projectFromEstimate(AMOUNT_BANDS[timeEstimate]) : null;
  const estimate =
    estimateProjection && timeEstimate
      ? { projection: estimateProjection, phrase: AMOUNT_PHRASE[timeEstimate] }
      : null;

  // Algorithmic time over a settled seven-day window, for the year projection.
  const rollingAlgorithmicMs = splitByKind(
    rollupCategories(days, lastNDayKeys(7))
  ).algorithmic;

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
          <LearningCard since={countingSince} rows={unlocks} estimate={estimate} />
        ) : (
          <>
            {/* 1 — the headline, and the evidence directly under it. */}
            <SplitCard
              categories={week.categories}
              algorithmicMsPerWeek={rollingAlgorithmicMs}
            />

            {/* 2 — the week itself, then the same week split by app. */}
            <View style={styles.card}>
              <SectionLabel>{COPY.weekEyebrow}</SectionLabel>
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
              <WeekChart
                columns={week.perDayKind.map((d) => ({
                  // Algorithmic first, so the warm block sits at the base of
                  // every column and the eye can compare across the week.
                  segments: [
                    { key: 'algorithmic', value: d.algorithmic, color: ALGORITHMIC_COLOR },
                    { key: 'intentional', value: d.intentional, color: INTENTIONAL_COLOR },
                  ],
                }))}
              />
              <View style={styles.weekLegend}>
                {[
                  { label: KIND_LABELS.algorithmic, color: ALGORITHMIC_COLOR },
                  { label: KIND_LABELS.intentional, color: INTENTIONAL_COLOR },
                ].map((l) => (
                  <View key={l.label} style={styles.weekLegendItem}>
                    <View style={[styles.splitDot, { backgroundColor: l.color }]} />
                    <Text style={[Typography.callout, styles.muted]}>{l.label}</Text>
                  </View>
                ))}
              </View>
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
                    <UnlockRow key={u.label} {...u} />
                  ))}
                </View>
              </View>
            )}
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
    backgroundColor: 'transparent',
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
    gap: 14,
    marginTop: 4,
  },
  unlockBlock: {
    gap: 8,
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  unlockTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.groupedBackground,
    overflow: 'hidden',
  },
  unlockFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primaryLine,
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
  splitFigureRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  splitUnit: {
    color: Colors.textSecondary,
  },
  splitBody: {
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 18,
    color: Colors.textSecondary,
  },
  splitLegend: {
    marginTop: 16,
    gap: 2,
  },
  splitLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },
  splitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekLegend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
  },
  weekLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  splitKind: {
    flex: 1,
    color: Colors.textTertiary,
  },
  splitLegendValue: {
    fontVariant: ['tabular-nums'],
  },
  splitHeadline: {
    lineHeight: 30,
    marginBottom: 6,
  },
  splitHorizon: {
    marginTop: 16,
    lineHeight: 21,
  },
  /*
   * The estimate block is styled DOWN on purpose — see the note in LearningCard.
   * A rule above it and a muted figure keep a stated guess visually separate
   * from the measured figures elsewhere on this screen.
   */
  estimateBlock: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    paddingBottom: 18,
    marginBottom: 18,
  },
  estimateEyebrow: {
    marginBottom: 8,
  },
  estimateFigure: {
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  estimateSub: {
    lineHeight: 18,
    marginBottom: 12,
  },
  estimateLine: {
    lineHeight: 21,
    marginBottom: 14,
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
  quietCta: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  quietCtaTitle: {
    marginBottom: 4,
  },
  quietCtaBody: {
    lineHeight: 18,
    marginBottom: 14,
  },
  quietCtaButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  quietCtaButtonText: {
    ...Typography.headline,
    color: Colors.surface,
  },
  quietActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  quietActiveText: {
    flex: 1,
    lineHeight: 21,
  },
  quietTurnOff: {
    color: Colors.primary,
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
