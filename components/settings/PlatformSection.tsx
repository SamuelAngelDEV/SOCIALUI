import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PlatformConfig } from '@/constants/platforms';
import { FEATURES, COMING_SOON } from '@/constants/features';
import { useSettingsStore } from '@/store/settingsStore';
import { useStatsStore } from '@/store/statsStore';
import { getSavingsLine } from '@/utils/savings';
import { PlatformLogo } from '@/components/PlatformLogo';
import { SettingsRow } from './SettingsRow';
import { FeedLimitSlider } from './FeedLimitSlider';

type Props = {
  platform: PlatformConfig;
};

/** Collapsed: logo + name + master switch. Expanded: this platform's feature rows. */
export function PlatformSection({ platform }: Props) {
  const [expanded, setExpanded] = useState(false);
  const enabled = useSettingsStore((s) => s.platformEnabled[platform.id]);
  const settings = useSettingsStore((s) => s.platformSettings[platform.id]);
  const setToggle = useSettingsStore((s) => s.setToggle);
  const setPlatformEnabled = useSettingsStore((s) => s.setPlatformEnabled);
  const resetPlatform = useSettingsStore((s) => s.resetPlatform);
  const enabledAt = useSettingsStore((s) => s.toggleEnabledAt[platform.id]);
  const days = useStatsStore((s) => s.days);

  const features = FEATURES[platform.id] ?? [];
  const comingSoon = COMING_SOON.includes(platform.id);

  return (
    <View style={styles.card}>
      <Pressable style={styles.header} onPress={() => setExpanded((v) => !v)}>
        <PlatformLogo platform={platform.id} size={30} />
        <Text style={[Typography.headline, styles.name]}>{platform.name}</Text>

        {!comingSoon && (
          <Switch
            value={enabled}
            onValueChange={(v) => setPlatformEnabled(platform.id, v)}
            trackColor={{ true: Colors.switchOn, false: '#E4E4E1' }}
            ios_backgroundColor="#E4E4E1"
            style={styles.masterSwitch}
          />
        )}
        {expanded ? (
          <ChevronDown size={18} color={Colors.textTertiary} />
        ) : (
          <ChevronRight size={18} color={Colors.textTertiary} />
        )}
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          {comingSoon ? (
            <View style={styles.separator} />
          ) : null}
          {comingSoon ? (
            <SettingsRow label="Coming soon" accessory="none" disabled />
          ) : (
            features
              .filter((f) => !f.parent)
              .map((f) => {
                const children = features.filter(
                  (c) => c.parent === f.key && enabled && !!settings?.[f.key]
                );
                return (
                  <View key={f.key}>
                    <View style={styles.separator} />
                    <SettingsRow
                      label={f.label}
                      note={f.note}
                      insight={
                        enabled
                          ? getSavingsLine(
                              platform.id,
                              f.key,
                              f.alwaysOn ? true : !!settings?.[f.key],
                              days,
                              enabledAt?.[f.key]
                            ) ?? undefined
                          : undefined
                      }
                      accessory={f.alwaysOn ? 'alwaysOn' : 'switch'}
                      value={f.alwaysOn ? true : !!settings?.[f.key]}
                      onValueChange={
                        f.alwaysOn ? undefined : (v) => setToggle(platform.id, f.key, v)
                      }
                      disabled={!enabled && !f.alwaysOn}
                    />
                    {f.key === 'limitFeed' && enabled && settings?.limitFeed && (
                      <FeedLimitSlider platform={platform.id} />
                    )}
                    {children.map((c) => (
                      <View key={c.key} style={styles.childRow}>
                        <SettingsRow
                          label={c.label}
                          note={c.note}
                          accessory="switch"
                          value={!!settings?.[c.key]}
                          onValueChange={(v) => setToggle(platform.id, c.key, v)}
                        />
                      </View>
                    ))}
                  </View>
                );
              })
          )}
          {!comingSoon && (
            <>
              <View style={styles.separator} />
              <SettingsRow
                label="Reset to Defaults"
                accessory="none"
                onPress={() => resetPlatform(platform.id)}
              />
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 12,
    gap: 12,
  },
  name: {
    flex: 1,
  },
  masterSwitch: {
    marginRight: 4,
  },
  body: {
    paddingBottom: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginLeft: 16,
  },
  childRow: {
    paddingLeft: 16,
    backgroundColor: Colors.groupedBackground,
  },
});
