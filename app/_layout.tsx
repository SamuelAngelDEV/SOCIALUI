import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeBackground } from '@/components/ThemeBackground';
import { useSettingsStore } from '@/store/settingsStore';

/*
 * No font loading, and no splash gating on it.
 *
 * `constants/typography.ts` uses the system font — SF Pro on iOS — so there is
 * nothing to download and nothing to wait for. This deletes a real failure
 * mode: the previous version returned `null` until `useFonts` resolved, so a
 * font that failed to load left a permanently blank app with no error.
 */

/**
 * Applies scheduled weakenings once they come due.
 *
 * A cooldown can elapse while the app is closed, so the first tick has to
 * happen at launch, and again whenever the app comes back to the foreground.
 * Both are edges, not polls.
 *
 * The timer covers the remaining case — the app sitting open across the moment
 * a change falls due. It is one `setTimeout` armed at the nearest deadline,
 * never an interval, for the same reason `utils/schedule.ts` arms one timer
 * from `nextBoundary`: the answer is exact, so waking up repeatedly to
 * re-ask it is waste. `MAX_DELAY_HOURS` (a week) is well inside setTimeout's
 * 32-bit range, so no chunking is needed.
 */
function useCommitmentTicker() {
  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const pending = useSettingsStore((s) => s.pendingChanges);
  const tick = useSettingsStore((s) => s.tickCommitments);

  useEffect(() => {
    if (!hydrated) return;
    tick();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') tick();
    });
    return () => sub.remove();
  }, [hydrated, tick]);

  useEffect(() => {
    if (!hydrated || pending.length === 0) return;
    const soonest = Math.min(...pending.map((c) => c.effectiveAt));
    const id = setTimeout(tick, Math.max(0, soonest - Date.now()));
    return () => clearTimeout(id);
  }, [hydrated, pending, tick]);
}

export default function RootLayout() {
  useCommitmentTicker();

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {/* One ground behind the whole stack. Screens render transparent over it,
          so a theme is set once rather than threaded through every screen. */}
      <ThemeBackground />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ animation: 'none' }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="insights" />
        <Stack.Screen name="platform/[id]" />
        <Stack.Screen name="snapchat" options={{ presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
