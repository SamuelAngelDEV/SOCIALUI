import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PLATFORM_LIST } from '@/constants/platforms';
import { MasterSettings, useSettingsStore } from '@/store/settingsStore';
import { PlatformSection } from '@/components/settings/PlatformSection';
import { SettingsGroup } from '@/components/settings/SettingsGroup';
import { SettingsRow } from '@/components/settings/SettingsRow';

const MASTER_ROWS: { key: keyof MasterSettings; label: string; note?: string }[] = [
  { key: 'killAllMetrics', label: 'Kill All Metrics', note: 'Hides every like, view, and follower count on every platform.' },
  { key: 'killAllBadges', label: 'Kill All Badges', note: 'Removes red dots and notification counts everywhere.' },
  { key: 'messagesOnly', label: 'Messages Only Mode', note: 'Every platform opens straight to its inbox.' },
  { key: 'grayscaleEverything', label: 'Grayscale Everything', note: 'Desaturates every platform.' },
];

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const master = useSettingsStore((s) => s.masterSettings);
  const setMasterToggle = useSettingsStore((s) => s.setMasterToggle);

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
          <SettingsGroup
            title="Everywhere"
            footer="These override individual platform settings while they're on."
          >
            {MASTER_ROWS.map((row) => (
              <SettingsRow
                key={row.key}
                label={row.label}
                note={row.note}
                accessory="switch"
                value={master[row.key]}
                onValueChange={(v) => setMasterToggle(row.key, v)}
              />
            ))}
          </SettingsGroup>

          {PLATFORM_LIST.filter((p) => p.kind === 'webview').map((p) => (
            <PlatformSection key={p.id} platform={p} />
          ))}

          <SettingsGroup footer="Checks whether each blocker still finds its target on the live site.">
            <SettingsRow
              label="Selector Health"
              accessory="chevron"
              onPress={() => router.push('/doctor')}
            />
          </SettingsGroup>
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
