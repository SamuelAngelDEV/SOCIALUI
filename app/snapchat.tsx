import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PlatformLogo } from '@/components/PlatformLogo';

/**
 * Presented as a modal (see app/_layout.tsx). Snapchat can't be surgically
 * modified on iOS, so this is an honest explanation rather than a WebView.
 */
export default function SnapchatSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.grabber} />

      <View style={styles.logo}>
        <PlatformLogo platform="snapchat" size={64} />
      </View>

      <Text style={[Typography.title, styles.title]}>Snapchat works differently</Text>

      <Text style={[Typography.body, styles.body]}>
        iOS won&apos;t let us change Snapchat&apos;s screen the way we change Instagram or
        YouTube, so we can&apos;t hide just Spotlight, Snap Score, or Quick Add.
      </Text>
      <Text style={[Typography.body, styles.body]}>
        What we can do — once app blocking is ready — is help you step away from Snapchat
        entirely on a schedule you set. The surgical version is coming to Android first.
      </Text>

      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonText}>Block Snapchat — coming soon</Text>
      </View>

      <Pressable style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.separator,
    marginTop: 8,
    marginBottom: 24,
  },
  logo: {
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 22,
  },
  comingSoon: {
    marginTop: 12,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
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
