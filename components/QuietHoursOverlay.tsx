import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MoonStar } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radii, Size, Spacing } from '@/constants/spacing';
import { Strings } from '@/constants/strings';

const COPY = Strings.quietHours;

/**
 * The wall shown when a platform is opened inside the user's quiet window.
 *
 * Deliberately the same shape as LimitReachedOverlay, including its
 * cooldown-then-override: the way out is always present and always visible, it
 * just costs a few seconds of waiting. A window with no exit would be a lock,
 * and a lock is a different product — this one's argument is that friction in
 * the right place is enough, not that the user needs to be overruled.
 *
 * The cooldown does not escalate with repeats the way the feed wall's does. That
 * wall is answering "one more post"; this one is answering "I need this now",
 * which is a claim the app is in no position to second-guess.
 */
const COOLDOWN_SECONDS = 8;

type Props = {
  platformName: string;
  /** Already formatted, e.g. "10pm–2am". */
  window: string;
  /** True when the window came from a Rhythm finding rather than a manual pick. */
  fromRhythm: boolean;
  onDone: () => void;
  onOpenAnyway: () => void;
};

export function QuietHoursOverlay({
  platformName,
  window,
  fromRhythm,
  onDone,
  onOpenAnyway,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [opacity, translate]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const locked = secondsLeft > 0;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.content, { transform: [{ translateY: translate }] }]}>
        <View style={styles.iconCircle}>
          <MoonStar size={30} color={Colors.primary} />
        </View>

        <Text style={[Typography.title, styles.title]}>{COPY.title}</Text>
        <Text style={[Typography.body, styles.subtitle]}>
          {COPY.body(platformName, window)}
        </Text>

        {fromRhythm && <Text style={styles.note}>{COPY.fromRhythm}</Text>}

        <Pressable style={styles.primaryBtn} onPress={onDone}>
          <Text style={styles.primaryText}>{COPY.done}</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryBtn, locked && styles.secondaryBtnLocked]}
          onPress={locked ? undefined : onOpenAnyway}
          disabled={locked}
        >
          <Text style={[styles.secondaryText, locked && styles.secondaryTextLocked]}>
            {locked ? COPY.waitCooldown(secondsLeft) : COPY.openAnyway}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    width: '100%',
    maxWidth: 420,
  },
  iconCircle: {
    width: Size.iconCircleLg,
    height: Size.iconCircleLg,
    borderRadius: Radii.circleLg,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  note: {
    ...Typography.callout,
    textAlign: 'center',
    color: Colors.textTertiary,
    marginBottom: Spacing.xxl,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryText: {
    ...Typography.headline,
    color: Colors.surface,
  },
  secondaryBtn: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryBtnLocked: {
    backgroundColor: Colors.groupedBackground,
    borderColor: Colors.separator,
  },
  secondaryText: {
    ...Typography.headline,
    color: Colors.textPrimary,
  },
  secondaryTextLocked: {
    color: Colors.textTertiary,
  },
});
