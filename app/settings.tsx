import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PLATFORM_LIST } from '@/constants/platforms';
import { useSettingsStore } from '@/store/settingsStore';
import { PlatformSection } from '@/components/settings/PlatformSection';

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hydrated = useSettingsStore((s) => s._hasHydrated);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={26} color={Colors.textPrimary} />
        </Pressable>
        <View>
          <Text style={Typography.title}>Settings</Text>
          <Text style={[Typography.callout, styles.subtitle]}>Choose what to hide.</Text>
        </View>
      </View>

      {hydrated ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {PLATFORM_LIST.filter((p) => p.kind === 'webview').map((p) => (
            <PlatformSection key={p.id} platform={p} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.loading}>
          <Text style={[Typography.callout, { color: Colors.textTertiary }]}>Loading…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  scroll: {
    paddingTop: 4,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
