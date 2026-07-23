import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { PlatformId } from '@/constants/platforms';
import { FEED_LIMIT_MIN, FEED_LIMIT_MAX, FEED_LIMIT_STEP } from '@/constants/features';
import { useSettingsStore } from '@/store/settingsStore';

type Props = { platform: PlatformId };

/** Slider row shown beneath "Limit Feed" — picks how many posts before the feed stops. */
export function FeedLimitSlider({ platform }: Props) {
  const value = useSettingsStore((s) => s.feedLimits[platform]);
  const setFeedLimit = useSettingsStore((s) => s.setFeedLimit);

  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={Typography.body}>Posts before it stops</Text>
        <Text style={styles.count}>{value}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={FEED_LIMIT_MIN}
        maximumValue={FEED_LIMIT_MAX}
        step={FEED_LIMIT_STEP}
        value={value}
        onValueChange={(v) => setFeedLimit(platform, v)}
        minimumTrackTintColor={Colors.primary}
        maximumTrackTintColor={Colors.separator}
        thumbTintColor={Colors.primary}
      />
      <View style={styles.scale}>
        <Text style={styles.scaleText}>{FEED_LIMIT_MIN}</Text>
        <Text style={styles.scaleText}>{FEED_LIMIT_MAX}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Colors.surface,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    ...Typography.headline,
    color: Colors.primary,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  scaleText: {
    ...Typography.callout,
    color: Colors.textTertiary,
  },
});
