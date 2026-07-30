import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radii, Spacing } from '@/constants/spacing';
import { Strings } from '@/constants/strings';
import { PlatformLogo } from '@/components/PlatformLogo';

const COPY = Strings.snapchat;

/**
 * Presented as a modal (see app/_layout.tsx). Snapchat can't be surgically
 * modified on iOS, so this is an honest explanation rather than a WebView.
 */
export default function SnapchatSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + Spacing.xxl }]}>
      <View style={styles.grabber} />

      <View style={styles.logo}>
        <PlatformLogo platform="snapchat" size={64} />
      </View>

      <Text style={[Typography.title, styles.title]}>{COPY.title}</Text>

      <Text style={[Typography.body, styles.body]}>{COPY.whyNot}</Text>
      <Text style={[Typography.body, styles.body]}>{COPY.whatsNext}</Text>

      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonText}>{COPY.comingSoon}</Text>
      </View>

      <Pressable style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>{COPY.close}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.separator,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  logo: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  body: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  comingSoon: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
  },
  comingSoonText: {
    ...Typography.headline,
    color: Colors.primary,
  },
  close: {
    marginTop: 'auto',
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  closeText: {
    ...Typography.headline,
    color: Colors.textSecondary,
  },
});
