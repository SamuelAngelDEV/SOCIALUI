import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Hourglass } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

type Props = {
  platformName: string;
  limit: number;
  onDone: () => void;
  onExtend: () => void;
};

/**
 * Full-screen native wall shown when the user hits their post limit and keeps
 * scrolling — Screen-Time style. Rendered OVER the WebView, so the page behind
 * it cannot receive any touches. Continuing is a deliberate tap, not a flick.
 */
export function LimitReachedOverlay({ platformName, limit, onDone, onExtend }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [opacity, translate]);

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

        <Pressable style={styles.primaryBtn} onPress={onDone}>
          <Text style={styles.primaryText}>I&apos;m done</Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={onExtend}>
          <Text style={styles.secondaryText}>Show 10 more posts</Text>
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
  secondaryText: {
    ...Typography.headline,
    color: Colors.textPrimary,
  },
});
