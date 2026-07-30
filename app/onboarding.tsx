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
  MessageCircle,
  Settings,
  Shield,
  Smartphone,
  ScrollText,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PRESETS, presetForGoals } from '@/constants/presets';
import { useSettingsStore } from '@/store/settingsStore';

const GOALS = [
  { id: 'scrolling', label: 'Endless scrolling', Icon: ScrollText },
  { id: 'reels', label: 'Reels & Shorts', Icon: Film },
  { id: 'counts', label: 'Like & follower counts', Icon: Heart },
  { id: 'time', label: 'Losing track of time', Icon: Clock },
  { id: 'habit', label: 'Opening apps out of habit', Icon: Smartphone },
] as const;

const REASSURANCES = [
  { Icon: Shield, text: 'Your DMs still work' },
  { Icon: Lock, text: 'Nothing leaves your phone' },
  { Icon: Settings, text: 'Change any setting, anytime' },
  { Icon: Hourglass, text: 'Your feed now has an ending' },
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
    <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
      <Animated.View style={[styles.stepWrap, { transform: [{ translateX: slideX }] }]}>
        {step === 0 && (
          <View style={styles.step}>
            <Text style={[Typography.largeTitle, styles.title]}>
              What&apos;s pulling you in?
            </Text>
            <Text style={[Typography.body, styles.subtitle]}>
              Pick what you&apos;d like to change.{'\n'}We&apos;ll set things up for you.
            </Text>
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
            <Text style={[Typography.largeTitle, styles.title]}>
              Pick your mode
            </Text>
            <Text style={[Typography.body, styles.subtitle]}>
              Start here. Change anytime in Settings.
            </Text>
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
                          <Text style={styles.recommendedText}>Recommended</Text>
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
            <Text style={[Typography.largeTitle, styles.title]}>
              You&apos;re all set
            </Text>
            <Text style={[Typography.body, styles.subtitle]}>
              Here&apos;s what Quiet does for you.
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
            <Text style={styles.nextText}>Next</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.nextBtn} onPress={handleFinish}>
            <Text style={styles.nextText}>Get started</Text>
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
    paddingHorizontal: 24,
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
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 36,
  },
  chipGrid: {
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
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
    gap: 12,
  },
  presetCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
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
    marginBottom: 4,
  },
  presetDesc: {
    color: Colors.textSecondary,
  },
  recommendedBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  recommendedText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#FFFFFF',
  },
  reassuranceList: {
    gap: 20,
    paddingHorizontal: 8,
  },
  reassuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  reassuranceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
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
    borderRadius: 12,
    paddingVertical: 16,
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
