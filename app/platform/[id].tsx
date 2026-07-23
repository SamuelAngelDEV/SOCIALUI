import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { RotateCw, X } from 'lucide-react-native';
import { PLATFORMS, PlatformId } from '@/constants/platforms';
import { buildInjection } from '@/injection';
import { useSettingsStore } from '@/store/settingsStore';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

const LOAD_TIMEOUT_MS = 10000;

export default function PlatformView() {
  const { id } = useLocalSearchParams<{ id: PlatformId }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const config = PLATFORMS[id];

  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const enabled = useSettingsStore((s) => s.platformEnabled[id]);
  const settings = useSettingsStore((s) => s.platformSettings[id]);
  const feedLimit = useSettingsStore((s) => s.feedLimits[id]);

  const webRef = useRef<WebView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  // Bumping this key remounts the WebView — the reliable way to fully retry.
  const [reloadKey, setReloadKey] = useState(0);

  const clearLoadTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // If the page hasn't finished within the timeout, stop the spinner and offer retry.
  const armTimeout = () => {
    clearLoadTimeout();
    timeoutRef.current = setTimeout(() => {
      setLoading((stillLoading) => {
        if (stillLoading) setErrored(true);
        return false;
      });
    }, LOAD_TIMEOUT_MS);
  };

  useEffect(() => clearLoadTimeout, []);

  const retry = () => {
    setErrored(false);
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  if (!config) {
    return (
      <View style={styles.fallback}>
        <Text style={Typography.body}>Unknown platform</Text>
      </View>
    );
  }

  const injectedJS =
    hydrated && enabled ? buildInjection(id, settings ?? {}, feedLimit ?? 10) : 'true;';
  const wantsPiP = id === 'youtube' && !!settings?.pictureInPicture;

  return (
    <View style={styles.container}>
      <View style={{ height: insets.top, backgroundColor: Colors.surface }} />

      <View style={styles.webWrap}>
        {hydrated && (
          <WebView
            key={reloadKey}
            ref={webRef}
            source={{ uri: config.url }}
            injectedJavaScriptBeforeContentLoaded={injectedJS}
            injectedJavaScript={injectedJS}
            userAgent={config.userAgent}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            allowsPictureInPictureMediaPlayback={wantsPiP}
            mediaPlaybackRequiresUserAction={false}
            onLoadStart={() => {
              setErrored(false);
              setLoading(true);
              armTimeout();
            }}
            onLoadEnd={() => {
              clearLoadTimeout();
              setLoading(false);
            }}
            onError={() => {
              clearLoadTimeout();
              setLoading(false);
              setErrored(true);
            }}
            onHttpError={({ nativeEvent }) => {
              // Only the main document failing should surface an error.
              if (nativeEvent.url === config.url && nativeEvent.statusCode >= 500) {
                clearLoadTimeout();
                setLoading(false);
                setErrored(true);
              }
            }}
            // On iOS the web content process can be killed under memory pressure,
            // leaving a blank/stuck view — reload when that happens.
            onContentProcessDidTerminate={retry}
            onRenderProcessGone={retry}
            style={styles.webview}
          />
        )}

        {loading && !errored && (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        {errored && (
          <View style={styles.overlay}>
            <Text style={[Typography.headline, styles.errTitle]}>
              This is taking longer than usual
            </Text>
            <Text style={[Typography.callout, styles.errBody]}>
              {config.name} didn&apos;t finish loading. Check your connection, or if you
              were asked to log in again, that can cause this.
            </Text>
            <Pressable style={styles.retryBtn} onPress={retry}>
              <RotateCw size={16} color={Colors.surface} />
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <Pressable onPress={() => router.back()} hitSlop={16} style={styles.closeButton}>
          <X size={22} color={Colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webWrap: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  errBody: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    ...Typography.headline,
    color: Colors.surface,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  closeButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
