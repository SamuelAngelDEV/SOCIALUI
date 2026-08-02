import { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Check,
  ChevronLeft,
  Clock,
  CloudRain,
  Hourglass,
  Lock,
  Moon,
  Settings,
  Shield,
  Target,
  Users,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radii, Size, Spacing } from '@/constants/spacing';
import { Strings } from '@/constants/strings';
import { PRESETS, recommendMode } from '@/constants/presets';
import {
  AMOUNT_OPTIONS,
  AmountAnswer,
  COST_OPTIONS,
  CostAnswer,
  GOAL_OPTIONS,
  GoalAnswer,
  KEEP_OPTIONS,
  KeepAnswer,
  WHEN_OPTIONS,
  WhenAnswer,
} from '@/constants/survey';
import { useSettingsStore } from '@/store/settingsStore';

const COPY = Strings.onboarding;

const COST_ICONS: Record<CostAnswer, typeof Moon> = {
  sleep: Moon,
  focus: Target,
  presence: Users,
  mood: CloudRain,
  time: Clock,
};

const REASSURANCES = [
  { Icon: Shield, text: COPY.done.dmsWork },
  { Icon: Lock, text: COPY.done.staysOnDevice },
  { Icon: Settings, text: COPY.done.reversible },
  { Icon: Hourglass, text: COPY.done.feedEnds },
] as const;

/** Question steps, in order. Presets and done follow after. */
const QUESTION_COUNT = 5;
const PRESETS_STEP = QUESTION_COUNT; // 5
const DONE_STEP = QUESTION_COUNT + 1; // 6
const STEP_COUNT = QUESTION_COUNT + 2; // 7

/** Toggle `id` in a multi-select list, clearing it if `exclusiveId` (an "I don't
 *  know" / "opt out entirely" answer) is involved on either side of the tap. */
function toggleExclusive<T extends string>(current: T[], id: T, exclusiveId: T): T[] {
  if (id === exclusiveId) {
    return current.includes(id) ? [] : [exclusiveId];
  }
  const withoutExclusive = current.filter((c) => c !== exclusiveId);
  return withoutExclusive.includes(id)
    ? withoutExclusive.filter((c) => c !== id)
    : [...withoutExclusive, id];
}

/** A single-select or multi-select row with a large tap target. */
function OptionRow({
  label,
  selected,
  multi,
  onPress,
}: {
  label: string;
  selected: boolean;
  multi: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.optionRow, selected && styles.optionRowSelected]}
      onPress={onPress}
    >
      <View
        style={[
          styles.optionIndicator,
          multi ? styles.optionIndicatorSquare : styles.optionIndicatorCircle,
          selected && styles.optionIndicatorSelected,
        ]}
      >
        {selected && (multi ? <Check size={13} color={Colors.surface} /> : <View style={styles.optionDot} />)}
      </View>
      <Text
        style={[Typography.body, styles.optionLabel, selected && styles.optionLabelSelected]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [costs, setCosts] = useState<CostAnswer[]>([]);
  const [amount, setAmount] = useState<AmountAnswer | null>(null);
  const [when, setWhen] = useState<WhenAnswer[]>([]);
  const [keeps, setKeeps] = useState<KeepAnswer[]>([]);
  const [goal, setGoal] = useState<GoalAnswer | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const slideX = useRef(new Animated.Value(0)).current;

  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const setCostsStore = useSettingsStore((s) => s.setCosts);
  const setTimeEstimate = useSettingsStore((s) => s.setTimeEstimate);
  const setTimeOfDay = useSettingsStore((s) => s.setTimeOfDay);
  const setKeepsStore = useSettingsStore((s) => s.setKeeps);
  const setMonthGoal = useSettingsStore((s) => s.setMonthGoal);
  const applyPreset = useSettingsStore((s) => s.applyPreset);

  /**
   * Q4 picks the shape, Q1 adjusts it. Recomputed from live answers so stepping
   * back and changing something is reflected immediately; `selectedPreset` only
   * diverges once the user deliberately taps a different card.
   */
  const recommendation = recommendMode(costs, keeps);

  const animateTo = (nextStep: number) => {
    const direction = nextStep > step ? 1 : -1;
    Animated.timing(slideX, {
      toValue: -direction * width,
      duration: 0,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      slideX.setValue(direction * width);
      Animated.timing(slideX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const canAdvance = (() => {
    switch (step) {
      case 0:
        return costs.length > 0;
      case 1:
        return amount !== null;
      case 2:
        return when.length > 0;
      case 3:
        return keeps.length > 0;
      case 4:
        return goal !== null;
      default:
        return true;
    }
  })();

  const handleNext = () => {
    if (!canAdvance) return;
    if (step === 0) {
      setCostsStore(costs);
      animateTo(1);
    } else if (step === 1) {
      if (amount) setTimeEstimate(amount);
      animateTo(2);
    } else if (step === 2) {
      setTimeOfDay(when);
      animateTo(3);
    } else if (step === 3) {
      setKeepsStore(keeps);
      animateTo(4);
    } else if (step === 4) {
      if (goal) setMonthGoal(goal);
      setSelectedPreset(recommendation.presetId);
      animateTo(PRESETS_STEP);
    } else if (step === PRESETS_STEP) {
      animateTo(DONE_STEP);
    }
  };

  const handleBack = () => {
    if (step > 0) animateTo(step - 1);
  };

  const handleFinish = () => {
    // The cap and the count-hiding only apply when the user kept the
    // recommendation — they were derived from Q1 for that specific mode, and
    // carrying them onto a mode the user chose instead would be putting words
    // in their mouth.
    const presetId = selectedPreset ?? recommendation.presetId;
    const tookRecommendation = presetId === recommendation.presetId;
    applyPreset(
      presetId,
      tookRecommendation
        ? { feedLimit: recommendation.feedLimit, hideCounts: recommendation.hideCounts }
        : undefined
    );
    setOnboarded(true);
    router.replace('/');
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxl,
        },
      ]}
    >
      <View style={styles.navHeader}>
        {step > 0 && (
          <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={12}>
            <ChevronLeft size={20} color={Colors.textSecondary} />
            <Text style={[Typography.body, styles.backText]}>{COPY.back}</Text>
          </Pressable>
        )}
      </View>

      <Animated.View style={[styles.stepWrap, { transform: [{ translateX: slideX }] }]}>
        {step === 0 && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.stepContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[Typography.largeTitle, styles.title]}>{COPY.cost.title}</Text>
            <Text style={[Typography.body, styles.subtitle]}>{COPY.cost.subtitle}</Text>
            <View style={styles.chipGrid}>
              {COST_OPTIONS.map(({ id, label }) => {
                const Icon = COST_ICONS[id];
                const on = costs.includes(id);
                return (
                  <Pressable
                    key={id}
                    style={[styles.chip, on && styles.chipSelected]}
                    onPress={() => setCosts((prev) => toggleExclusive(prev, id, 'time'))}
                  >
                    <Icon size={18} color={on ? Colors.primary : Colors.textSecondary} />
                    <Text
                      style={[
                        Typography.body,
                        styles.chipText,
                        on && styles.chipTextSelected,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {costs.includes('time') && (
              <Text style={[Typography.callout, styles.unsureNote]}>{COPY.cost.timeNote}</Text>
            )}
          </ScrollView>
        )}

        {step === 1 && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.stepContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[Typography.largeTitle, styles.title]}>{COPY.amount.title}</Text>
            <Text style={[Typography.body, styles.subtitle]}>{COPY.amount.subtitle}</Text>
            <View style={styles.optionList}>
              {AMOUNT_OPTIONS.map(({ id, label }) => (
                <OptionRow
                  key={id}
                  label={label}
                  multi={false}
                  selected={amount === id}
                  onPress={() => setAmount(id)}
                />
              ))}
            </View>
            {amount === 'unsure' && (
              <Text style={[Typography.callout, styles.unsureNote]}>
                {COPY.amount.unsureNote}
              </Text>
            )}
          </ScrollView>
        )}

        {step === 2 && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.stepContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[Typography.largeTitle, styles.title]}>{COPY.when.title}</Text>
            <Text style={[Typography.body, styles.subtitle]}>{COPY.when.subtitle}</Text>
            <View style={styles.optionList}>
              {WHEN_OPTIONS.map(({ id, label }) => (
                <OptionRow
                  key={id}
                  label={label}
                  multi
                  selected={when.includes(id)}
                  onPress={() => setWhen((prev) => toggleExclusive(prev, id, 'unsure'))}
                />
              ))}
            </View>
            {when.includes('unsure') && (
              <Text style={[Typography.callout, styles.unsureNote]}>{COPY.when.unsureNote}</Text>
            )}
          </ScrollView>
        )}

        {step === 3 && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.stepContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[Typography.largeTitle, styles.title]}>{COPY.keep.title}</Text>
            <Text style={[Typography.body, styles.subtitle]}>{COPY.keep.subtitle}</Text>
            <View style={styles.optionList}>
              {KEEP_OPTIONS.map(({ id, label }) => (
                <OptionRow
                  key={id}
                  label={label}
                  multi
                  selected={keeps.includes(id)}
                  onPress={() => setKeeps((prev) => toggleExclusive(prev, id, 'nothing'))}
                />
              ))}
            </View>
          </ScrollView>
        )}

        {step === 4 && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.stepContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[Typography.largeTitle, styles.title]}>{COPY.goal.title}</Text>
            <Text style={[Typography.body, styles.subtitle]}>{COPY.goal.subtitle}</Text>
            <View style={styles.optionList}>
              {GOAL_OPTIONS.map(({ id, label }) => (
                <OptionRow
                  key={id}
                  label={label}
                  multi={false}
                  selected={goal === id}
                  onPress={() => setGoal(id)}
                />
              ))}
            </View>
          </ScrollView>
        )}

        {step === PRESETS_STEP && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.stepContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[Typography.largeTitle, styles.title]}>{COPY.presets.title}</Text>
            <Text style={[Typography.body, styles.subtitle]}>{COPY.presets.subtitle}</Text>
            <View style={styles.presetList}>
              {PRESETS.map((preset) => {
                const on = selectedPreset === preset.id;
                const recommended = recommendation.presetId === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    style={[styles.presetCard, on && styles.presetCardSelected]}
                    onPress={() => setSelectedPreset(preset.id)}
                  >
                    <View style={styles.presetHeader}>
                      <Text
                        style={[
                          Typography.headline,
                          styles.presetName,
                          on && { color: Colors.primary },
                        ]}
                      >
                        {preset.name}
                      </Text>
                      {recommended && (
                        <View style={styles.recommendedBadge}>
                          <Text style={Typography.tag}>{COPY.presets.recommended}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[Typography.callout, styles.presetDesc]}>
                      {preset.description}
                    </Text>
                    {/* Why this one, on the recommended card only — a
                        recommendation you can't audit is just an assertion. */}
                    {recommended && (
                      <Text style={[Typography.callout, styles.presetReason]}>
                        {COPY.presets.because(recommendation.reason)}
                        {recommendation.note ? ` ${recommendation.note}` : ''}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}

        {step === DONE_STEP && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.stepContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[Typography.largeTitle, styles.title]}>{COPY.done.title}</Text>
            <Text style={[Typography.body, styles.subtitle]}>
              {COPY.done.subtitle(Strings.app.name)}
            </Text>
            <View style={styles.reassuranceList}>
              {REASSURANCES.map(({ Icon, text }) => (
                <View key={text} style={styles.reassuranceRow}>
                  <View style={styles.reassuranceIcon}>
                    <Icon size={20} color={Colors.primary} />
                  </View>
                  <Text style={Typography.body}>{text}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        {step < DONE_STEP ? (
          <Pressable
            style={[styles.nextBtn, !canAdvance && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canAdvance}
          >
            <Text style={styles.nextText}>{COPY.next}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.nextBtn} onPress={handleFinish}>
            <Text style={styles.nextText}>{COPY.getStarted}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xxl,
  },
  navHeader: {
    height: 32,
    justifyContent: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
  },
  backText: {
    color: Colors.textSecondary,
  },
  stepWrap: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  stepContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 36,
  },
  chipGrid: {
    gap: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySubtle,
  },
  chipText: {
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.primary,
  },
  optionList: {
    gap: Spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySubtle,
  },
  optionIndicator: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: Colors.borderControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIndicatorCircle: {
    borderRadius: Radii.pill,
  },
  optionIndicatorSquare: {
    borderRadius: 5,
  },
  optionIndicatorSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surface,
  },
  optionLabel: {
    flex: 1,
    color: Colors.textSecondary,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  unsureNote: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  presetList: {
    gap: Spacing.md,
  },
  presetCard: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  presetCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySubtle,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  presetName: {
    flexShrink: 1,
  },
  presetDesc: {
    color: Colors.textSecondary,
  },
  presetReason: {
    marginTop: Spacing.sm,
    color: Colors.textTertiary,
  },
  recommendedBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  reassuranceList: {
    gap: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  reassuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  reassuranceIcon: {
    width: Size.iconCircleSm,
    height: Size.iconCircleSm,
    borderRadius: Radii.circleSm,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  nextBtn: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextText: {
    ...Typography.headline,
    color: Colors.surface,
  },
});
