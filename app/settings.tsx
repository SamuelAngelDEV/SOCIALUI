import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Strings } from '@/constants/strings';
import { PLATFORM_LIST } from '@/constants/platforms';
import { MasterSettings, useSettingsStore } from '@/store/settingsStore';
import { PlatformSection } from '@/components/settings/PlatformSection';
import { SettingsGroup } from '@/components/settings/SettingsGroup';
import { SettingsRow } from '@/components/settings/SettingsRow';

const COPY = Strings.settings;

const MASTER_ROWS: { key: keyof MasterSettings; label: string; note?: string }[] = [
  { key: 'killAllMetrics', ...COPY.master.killAllMetrics },
  { key: 'killAllBadges', ...COPY.master.killAllBadges },
  { key: 'messagesOnly', ...COPY.master.messagesOnly },
  { key: 'grayscaleEverything', ...COPY.master.grayscaleEverything },
];

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const master = useSettingsStore((s) => s.masterSettings);
  const setMasterToggle = useSettingsStore((s) => s.setMasterToggle);

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={26} color={Colors.textPrimary} />
        </Pressable>
        <View>
          <Text style={Typography.title}>{COPY.title}</Text>
          <Text style={[Typography.callout, styles.subtitle]}>{COPY.subtitle}</Text>
        </View>
      </View>

      {hydrated ? (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + Spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <SettingsGroup
            title={COPY.master.groupTitle}
            footer={COPY.master.groupFooter}
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

          <SettingsGroup footer={COPY.doctor.groupFooter}>
            <SettingsRow
              label={COPY.doctor.row}
              accessory="chevron"
              onPress={() => router.push('/doctor')}
            />
          </SettingsGroup>
        </ScrollView>
      ) : (
        <View style={styles.loading}>
          <Text style={[Typography.callout, { color: Colors.textTertiary }]}>
            {COPY.loading}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  back: {
    marginRight: Spacing.sm,
    // Optical: pulls the chevron's glyph bearing back into the gutter.
    marginLeft: -6,
  },
  subtitle: {
    marginTop: 1,
  },
  scroll: {
    paddingTop: Spacing.xs,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
