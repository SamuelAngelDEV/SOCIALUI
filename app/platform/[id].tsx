import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { RotateCw, X } from 'lucide-react-native';
import { PLATFORMS, PlatformId } from '@/constants/platforms';
import { buildInjection } from '@/injection';
import { useSettingsStore } from '@/store/settingsStore';
import { useStatsStore } from '@/store/statsStore';
import {
  Category,
  dayKey,
  effectiveSegmentEnd,
  IDLE_GRACE_MS,
  mapPathToCategory,
} from '@/utils/stats';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { LimitReachedOverlay } from '@/components/LimitReachedOverlay';
import { SessionSummaryOverlay } from '@/components/SessionSummaryOverlay';

// Sessions shorter than this close without a summary — not worth interrupting for.
const SUMMARY_MIN_MS = 5000;

/** Segments below this are too short to record; the remainder is carried, not dropped. */
const MIN_SEGMENT_MS = 500;

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
  const master = useSettingsStore((s) => s.masterSettings);
  const todayStats = useStatsStore((s) => s.days[dayKey()]);

  const webRef = useRef<WebView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  // Bumping this key remounts the WebView — the reliable way to fully retry.
  const [reloadKey, setReloadKey] = useState(0);
  // The Screen-Time-style wall. sessionLimit is this visit's cap; extensions are
  // deliberately not persisted — next visit starts back at the saved slider value.
  const [wallVisible, setWallVisible] = useState(false);
  const sessionLimitRef = useRef<number | null>(null);
  const [extendCount, setExtendCount] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // ---- Local time tracking (never leaves the device) ----
  const addTime = useStatsStore((s) => s.addTime);
  const catRef = useRef<Category>('feed');
  const catStartRef = useRef<number>(Date.now());
  const sessionAggRef = useRef<Partial<Record<Category, number>>>({});
  const pausedRef = useRef(false);
  // The clock does not start at mount. Page load is 1–5s of spinner that used to
  // be booked as 'feed' — i.e. as algorithmic time — on every single visit.
  const startedRef = useRef(false);
  // Last interaction reported by the injected activity ping.
  const lastActivityRef = useRef<number>(Date.now());
  // Whether pings are arriving at all. A platform toggled off gets no injection
  // and therefore no pings; clamping on that silence would record zero for it.
  const activityCapableRef = useRef(false);
  const [summary, setSummary] = useState<{
    total: number;
    perCategory: Partial<Record<Category, number>>;
  } | null>(null);

  // Close out the running category segment into both the session aggregate and
  // the persistent per-day stats. The clamped end is passed through so the store
  // splits across the hour (or midnight) boundaries the segment really crossed —
  // handing it `now` after an idle clamp would file the time in the wrong hour.
  const commitSegment = () => {
    const now = Date.now();
    if (pausedRef.current || !startedRef.current || !id) {
      catStartRef.current = now;
      return;
    }
    const start = catStartRef.current;
    const end = activityCapableRef.current
      ? effectiveSegmentEnd(start, now, lastActivityRef.current, IDLE_GRACE_MS)
      : now;
    const ms = end - start;

    if (ms < MIN_SEGMENT_MS) {
      // Too short to record. Leave catStart where it is so the remainder rolls
      // into the next segment rather than being deleted — rapid navigation
      // should shift time between categories, never destroy it. The exception is
      // an idle clamp, where the span really is dead and must be stepped over.
      if (end < now) catStartRef.current = now;
      return;
    }

    catStartRef.current = now;
    const cat = catRef.current;
    sessionAggRef.current[cat] = (sessionAggRef.current[cat] ?? 0) + ms;
    addTime(id, cat, ms, end);
  };

  // Returning to the app is itself an interaction, so the grace window restarts.
  const resumeTracking = () => {
    const now = Date.now();
    pausedRef.current = false;
    lastActivityRef.current = now;
    catStartRef.current = now;
  };

  const pauseTracking = () => {
    commitSegment();
    pausedRef.current = true;
  };

  // Begin accruing. Called from the first `quiet-nav` (the moment the page is
  // real) or, for platforms running without injection, from onLoadEnd. Idempotent
  // — later loads and SPA navigations must not restart the session clock.
  const startTracking = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    const now = Date.now();
    catStartRef.current = now;
    lastActivityRef.current = now;
  };

  // Don't count time while the app is backgrounded. On iOS a screen lock reports
  // 'inactive' before 'background' and on Android it reports 'background'; both
  // are non-'active' and so both pause here. The WebView's own visibilitychange
  // (handled in onWebMessage) is a second, independent signal for the same event,
  // and the idle clamp caps the damage to one grace window if both were to miss.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') resumeTracking();
      else pauseTracking();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // If the screen unmounts by any route other than the close button, still log.
  useEffect(() => {
    return () => commitSegment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
    setWallVisible(false);
    sessionLimitRef.current = null;
    setExtendCount(0);
    setReloadKey((k) => k + 1);
  };

  const onWebMessage = (event: { nativeEvent: { data: string } }) => {
    // The page itself can also call postMessage — only act on our own payloads.
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (!msg) return;
      if (msg.type === 'quiet-limit-reached') {
        commitSegment();
        const agg = sessionAggRef.current;
        const total = Object.values(agg).reduce((a, b) => a + (b ?? 0), 0);
        setSessionSeconds(Math.floor(total / 1000));
        setWallVisible(true);
      } else if (msg.type === 'quiet-health') {
        if (__DEV__) {
          if (msg.broken?.length) console.warn('[Quiet] broken selectors:', msg.broken);
          if (msg.zero?.length) console.log('[Quiet] zero-match selectors:', msg.zero);
        }
      } else if (msg.type === 'quiet-activity') {
        activityCapableRef.current = true;
        const now = Date.now();
        // Coming back after a silence means we were idle. Close the segment
        // first — commitSegment still sees the OLD lastActivity, so it clamps
        // the dead span off — and only then restart the clock.
        if (now - lastActivityRef.current > IDLE_GRACE_MS) {
          commitSegment();
          catStartRef.current = now;
        }
        lastActivityRef.current = now;
      } else if (msg.type === 'quiet-hidden') {
        pauseTracking();
      } else if (msg.type === 'quiet-visible') {
        resumeTracking();
      } else if (msg.type === 'quiet-nav' && typeof msg.path === 'string' && id) {
        const nextCat = mapPathToCategory(id, msg.path);
        if (!startedRef.current) {
          // First real navigation: this is where the session actually begins.
          catRef.current = nextCat;
          startTracking();
          return;
        }
        if (nextCat !== catRef.current) {
          commitSegment();
          catRef.current = nextCat;
        }
      }
    } catch {
      // Not our message; ignore.
    }
  };

  const closePlatform = () => {
    commitSegment();
    const agg = sessionAggRef.current;
    const total = Object.values(agg).reduce((a, b) => a + (b ?? 0), 0);
    if (total < SUMMARY_MIN_MS) {
      router.back();
      return;
    }
    setSummary({ total, perCategory: { ...agg } });
  };

  const extendLimit = () => {
    setExtendCount((c) => c + 1);
    webRef.current?.injectJavaScript(
      'window.__quietDisableLimit && window.__quietDisableLimit(); true;'
    );
    setWallVisible(false);
  };

  if (!config) {
    return (
      <View style={styles.fallback}>
        <Text style={Typography.body}>Unknown platform</Text>
      </View>
    );
  }

  const injectedJS =
    hydrated && enabled ? buildInjection(id, settings ?? {}, feedLimit ?? 10, master) : 'true;';
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
              // Fallback start for the injection-disabled case, where no
              // 'quiet-nav' will ever arrive. No-op once already started.
              startTracking();
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
            onMessage={onWebMessage}
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

        {wallVisible && !summary && (
          <LimitReachedOverlay
            platformName={config.name}
            limit={sessionLimitRef.current ?? feedLimit ?? 10}
            extendCount={extendCount}
            sessionSeconds={sessionSeconds}
            onDone={closePlatform}
            onExtend={extendLimit}
          />
        )}

        {summary && (
          <SessionSummaryOverlay
            platformName={config.name}
            sessionMs={summary.total}
            perCategory={summary.perCategory}
            todayTotalMs={todayStats?.total ?? summary.total}
            onDone={() => router.back()}
          />
        )}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <Pressable onPress={closePlatform} hitSlop={16} style={styles.closeButton}>
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
