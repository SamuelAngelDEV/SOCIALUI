import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radii, Spacing } from '@/constants/spacing';
import { Strings } from '@/constants/strings';
import { PLATFORM_LIST, PLATFORMS, PlatformId } from '@/constants/platforms';
import { buildDiagnosticScript, DiagnosticResult } from '@/injection/diagnostics';

const COPY = Strings.doctor;

/**
 * Selector Health: loads a platform (logged-in session, cookies shared with the
 * normal view) and counts how many elements each blocking selector matches on
 * the LIVE page. Zero on a page where the element visibly exists = the selector
 * drifted and needs updating. Screenshot the list and send it to be fixed.
 */
export default function Doctor() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [platform, setPlatform] = useState<PlatformId | null>(null);
  const [results, setResults] = useState<DiagnosticResult[] | null>(null);
  const [path, setPath] = useState<string>('');
  const [runId, setRunId] = useState(0);

  const start = (id: PlatformId) => {
    setPlatform(id);
    setResults(null);
    setPath('');
    setRunId((k) => k + 1);
  };

  const onMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg && msg.type === 'quiet-diagnostic') {
        setResults(msg.results);
        setPath(msg.path);
      }
    } catch {
      // not ours
    }
  };

  const config = platform ? PLATFORMS[platform] : null;
  const misses = results?.filter((r) => r.count <= 0).length ?? 0;

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

      <View style={styles.pills}>
        {PLATFORM_LIST.filter((p) => p.kind === 'webview').map((p) => (
          <Pressable
            key={p.id}
            style={[styles.pill, platform === p.id && styles.pillActive]}
            onPress={() => start(p.id)}
          >
            <Text style={[styles.pillText, platform === p.id && styles.pillTextActive]}>
              {p.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {config && (
        // Kept tiny but attached so it actually loads; diagnostic-only, hides nothing.
        <View style={styles.hiddenWeb} pointerEvents="none">
          <WebView
            key={runId}
            source={{ uri: config.url }}
            injectedJavaScript={buildDiagnosticScript(config.id)}
            userAgent={config.userAgent}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            onMessage={onMessage}
          />
        </View>
      )}

      {platform && !results && (
        <Text style={[Typography.callout, styles.waiting]}>
          {COPY.waiting(PLATFORMS[platform].name)}
        </Text>
      )}

      {results && (
        <>
          <Text style={[Typography.callout, styles.summaryLine]}>
            {path ? COPY.measuredOn(path) : ''}
            {misses === 0 ? COPY.allFound : COPY.misses(misses)}
          </Text>
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {results.map((r, i) => (
                <View key={i} style={[styles.row, i > 0 && styles.rowBorder]}>
                  <View style={styles.rowText}>
                    <Text style={Typography.body}>{r.key}</Text>
                    <Text style={styles.selector} numberOfLines={1}>
                      {r.kind === 'text' ? COPY.textKindPrefix : ''}{r.selector}
                    </Text>
                  </View>
                  <Text style={[styles.count, r.count > 0 ? styles.hit : styles.miss]}>
                    {r.count < 0
                      ? COPY.invalidCount
                      : r.count === 0
                        ? COPY.zeroCount
                        : `${r.count}`}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  back: {
    marginRight: Spacing.sm,
    // Optical: pulls the chevron's glyph bearing back into the gutter.
    marginLeft: -6,
  },
  subtitle: {
    marginTop: 1,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    ...Typography.callout,
    color: Colors.textPrimary,
  },
  pillTextActive: {
    color: Colors.surface,
  },
  hiddenWeb: {
    position: 'absolute',
    width: 2,
    height: 2,
    opacity: 0,
  },
  waiting: {
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  summaryLine: {
    color: Colors.textSecondary,
    marginBottom: 10,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  rowText: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  selector: {
    ...Typography.caption,
    textTransform: 'none',
    letterSpacing: 0,
    marginTop: 2,
  },
  count: {
    ...Typography.headline,
    minWidth: 52,
    textAlign: 'right',
  },
  hit: {
    color: Colors.success,
  },
  miss: {
    color: Colors.destructive,
  },
});
