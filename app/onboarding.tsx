import { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Clock,
  Film,
  Heart,
  Hourglass,
  Lock,
  Settings,
  Shield,
  Smartphone,
  ScrollText,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radii, Size, Spacing } from '@/constants/spacing';
import { Strings } from '@/constants/strings';
import { PRESETS, presetForGoals } from '@/constants/presets';
import { useSettingsStore } from '@/store/settingsStore';

const COPY = Strings.onboarding;

const GOALS = [
  { id: 'scrolling', label: COPY.goals.scrolling, Icon: ScrollText },
  { id: 'reels', label: COPY.goals.reels, Icon: Film },
  { id: 'counts', label: COPY.goals.counts, Icon: Heart },
  { id: 'time', label: COPY.goals.time, Icon: Clock },
  { id: 'habit', label: COPY.goals.habit, Icon: Smartphone },
] as const;

const REASSURANCES = [
  { Icon: Shield, text: COPY.done.dmsWork },
  { Icon: Lock, text: COPY.done.staysOnDevice },
  { Icon: Settings, text: COPY.done.reversible },
  { Icon: Hourglass, text: COPY.done.feedEnds },
] as const;

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const slideX = useRef(new Animated.Value(0)).current;

  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const setGoals = useSettingsStore((s) => s.setGoals);
  const applyPreset = useSettingsStore((s) => s.applyPreset);

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

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 0) {
      setGoals(selectedGoals);
      const recommended = presetForGoals(selectedGoals);
      setSelectedPreset(recommended);
      animateTo(1);
    } else if (step === 1) {
      animateTo(2);
    }
  };

  const handleFinish = () => {
    if (selectedPreset) applyPreset(selectedPreset);
    setOnboarded(true);
    router.replace('/');
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.xxxl,
          paddingBottom: insets.bottom + Spacing.xxl,
        },
      ]}
    >
      <Animated.View style={[styles.stepWrap, { transform: [{ translateX: slideX }] }]}>
        {step === 0 && (
          <View style={styles.step}>
            <Text style={[Typography.largeTitle, styles.title]}>{COPY.goals.title}</Text>
            <Text style={[Typography.body, styles.subtitle]}>{COPY.goals.subtitle}</Text>
            <View style={styles.chipGrid}>
              {GOALS.map(({ id, label, Icon }) => {
                const on = selectedGoals.includes(id);
                return (
                  <Pressable
                    key={id}
                    style={[styles.chip, on && styles.chipSelected]}
                    onPress={() => toggleGoal(id)}
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
          </View>
        )}

        {step === 1 && (
          <View style={styles.step}>
            <Text style={[Typography.largeTitle, styles.title]}>{COPY.presets.title}</Text>
            <Text style={[Typography.body, styles.subtitle]}>{COPY.presets.subtitle}</Text>
            <View style={styles.presetList}>
              {PRESETS.map((preset) => {
                const on = selectedPreset === preset.id;
                const recommended = presetForGoals(selectedGoals) === preset.id;
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
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <Text style={[Typography.largeTitle, styles.title]}>{COPY.done.title}</Text>
            <Text style={[Typography.body, styles.subtitle]}>{COPY.done.subtitle}</Text>
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
          </View>
        )}
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive]}
            />
          ))}
        </View>

        {step < 2 ? (
          <Pressable
            style={[styles.nextBtn, step === 0 && selectedGoals.length === 0 && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={step === 0 && selectedGoals.length === 0}
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
  stepWrap: {
    flex: 1,
  },
  step: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: Spacing.xs,
  },
  presetDesc: {
    color: Colors.textSecondary,
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
