import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Hourglass } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

type Props = {
  platformName: string;
  limit: number;
  extendCount: number;
  sessionSeconds: number;
  onDone: () => void;
  onExtend: () => void;
};

function formatTime(seconds: number): string {
  if (seconds < 60) return 'less than a minute';
  const m = Math.floor(seconds / 60);
  return m === 1 ? '1 minute' : `${m} minutes`;
}

export function LimitReachedOverlay({
  platformName,
  limit,
  extendCount,
  sessionSeconds,
  onDone,
  onExtend,
}: Props) {
  const cooldown = Math.min(5 + extendCount * 5, 30);
  const [secondsLeft, setSecondsLeft] = useState(cooldown);
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [opacity, translate]);

  useEffect(() => {
    setSecondsLeft(cooldown);
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
  }, [cooldown]);

  const locked = secondsLeft > 0;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.content, { transform: [{ translateY: translate }] }]}>
        <View style={styles.iconCircle}>
          <Hourglass size={30} color={Colors.primary} />
        </View>

        <Text style={[Typography.title, styles.title]}>You&apos;re all caught up</Text>
        <Text style={[Typography.body, styles.subtitle]}>
          You set a limit of {limit} posts on {platformName}. Anything past this is the
          algorithm&apos;s idea, not yours.
        </Text>

        {sessionSeconds >= 30 && (
          <Text style={styles.timeSpent}>
            You&apos;ve spent {formatTime(sessionSeconds)} here
          </Text>
        )}

        <Pressable style={styles.primaryBtn} onPress={onDone}>
          <Text style={styles.primaryText}>I&apos;m done</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryBtn, locked && styles.secondaryBtnLocked]}
          onPress={locked ? undefined : onExtend}
          disabled={locked}
        >
          <Text style={[styles.secondaryText, locked && styles.secondaryTextLocked]}>
            {locked ? `Wait ${secondsLeft}s...` : 'Keep scrolling'}
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
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 420,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 32,
  },
  timeSpent: {
    ...Typography.callout,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
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
    borderRadius: 12,
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
