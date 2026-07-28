# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Non-negotiables

- No analytics, telemetry, or any network calls that send user data anywhere. Everything stays on-device (AsyncStorage only).
- Do not scrape, cache, or store any platform data. CSS/JS injection only — we never touch platform content, only hide elements.
- No ads. No data collection. No engagement optimization.

## Commands

```bash
# Start dev server (opens Expo Go QR code)
npx expo start

# Platform-specific
npx expo start --ios
npx expo start --android

# Lint
npx expo lint

# TypeScript check
npx tsc --noEmit
```

There is no test runner configured in the repo. Test suites (jsdom-based, 176 assertions across 8 files) live in the session scratchpad and must be run manually with `node <file>` after building the injection modules.

**Important:** Read `AGENTS.md` before writing any Expo API code — it points to the exact versioned docs (`https://docs.expo.dev/versions/v54.0.0/`). Expo SDK 54 APIs differ from what the model's training data contains.

## Architecture

### How injection works

Every platform is a `react-native-webview` that loads the real site. On load, `buildInjection(platform, settings, feedLimit, masterSettings)` in `injection/index.ts` calls the platform's `build*Script()` function, which calls `buildScript()` in `injection/engine.ts` with a list of rules and a config object.

`buildScript()` produces a self-contained IIFE string that is injected into the WebView. It runs entirely in the WebView's JS context — no bridge calls needed for hiding elements. The config object is `Record<string, boolean | MetricVisibility>` — metric features store a 3-state string, everything else is boolean. The only bridge calls go the other direction: the injected script calls `window.ReactNativeWebView.postMessage()` to report SPA navigation (`quiet-nav`), feed cap hits (`quiet-limit-reached`), and selector health (`quiet-health`).

### Platform adapters

Each platform exports a `PlatformAdapter` object (`injection/adapter.ts`) containing its rules, guards, and engine config. The generic `buildFromAdapter()` function turns any adapter into an injection script. Platforms with custom preambles (Instagram's DM reel guard, TikTok's FYP root redirect) pass them via the `preamble` field.

### Adding a feature

1. Add a `Feature` entry to `constants/features.ts` under the correct platform. The `key` must exactly match a `Rule` key in the platform's injection file. Set `metric: true` if it's a count/engagement metric.
2. Add a `Rule` (with `css`, `controlCss`, and/or `textHide`) to `injection/<platform>.ts`.
3. That's it — Settings UI and injection both derive from `constants/features.ts`.

For nested sub-options (e.g. "Hide DM Badges" under "Hide Notification Badges"), set `parent: 'parentKey'` on the feature. `PlatformSection` renders it indented and only when the parent is on.

### Rule types in the engine

- `css`: array of selectors hidden via `display: none !important`. For metric features, these target only the **number/count** (e.g. "169 likes" text, the liked_by link). Built at call-time, serialized into the IIFE — no runtime selector evaluation.
- `controlCss`: array of selectors targeting **interactive controls** (buttons, links) related to a metric. Only applied when the metric is set to `'hidden-both'`. This separation prevents hiding a like button when the user only wanted to hide the count.
- `textHide`: JS text pass for cases where `:contains()` would be needed. Scans `probe` elements, hides `el.closest(closest)` on a text match. Use `exact: true` for labels (e.g. "Sponsored" as a standalone label) and `regex: true` for patterns (e.g. like counts). Probes longer than 140 chars are skipped to avoid false-positives on post captions. Each rule is wrapped in its own try/catch so one bad probe selector can't skip subsequent rules.

### Metric visibility (3-state model)

Metric-hiding features (like counts, follower counts, view counts, engagement counts, reaction counts) use a 3-state `MetricVisibility` type instead of boolean:

- `'visible'` — show everything (number + control)
- `'hidden-number'` — hide the count text, keep buttons/controls clickable
- `'hidden-both'` — hide both the count and the control (e.g. hide the like button entirely)

Features with `metric: true` in `constants/features.ts` use this model. The settings UI renders a 3-segment control ("Show / Count / All") instead of a switch. The store's `merge()` function auto-migrates old boolean values on hydration (`true` → `'hidden-both'`, `false` → `'visible'`).

`killAllMetrics` master toggle forces all metric keys to `'hidden-both'`.

### Health beacon

On the first pass after `ready`, the injected script runs a one-time health check: it tries `querySelectorAll` on every active CSS selector and reports broken (throws) or zero-match selectors via a `quiet-health` postMessage. In dev mode, `app/platform/[id].tsx` logs these to the console. No data leaves the device.

### Feed cap

The cap marks kept posts with `data-quiet-keep` (persistent — never removed even if the site virtualizes the post). Once `limitCount` eligible posts are marked, a `quiet-cap-style` hides everything unmarked. Wall is signaled when the last kept post's bottom enters the viewport. `window.__quietSetLimit(n)` raises the cap (called from the native "Show more" button).

### State

- `store/settingsStore.ts` — per-platform feature toggles, master toggles (`killAllMetrics`, `killAllBadges`, `messagesOnly`, `grayscaleEverything`), `toggleEnabledAt` timestamps. Persisted via Zustand + AsyncStorage.
- `store/statsStore.ts` — time tracking: `DayStats` keyed by `'YYYY-MM-DD'`. Each day has `total`, `platforms` (ms per platform), `categories` (global rollup), and `byPlatform` (per-platform category split — required to avoid cross-contamination in savings estimates). Pruned to 60 days. Storage key: `'quiet-stats-v1'`.

### Time tracking flow

`app/platform/[id].tsx` owns the timer. It tracks `catRef` (current category), `catStartRef` (segment start), and `pausedRef` (backgrounded). On WebView `onMessage`, a `quiet-nav` message commits the elapsed segment via `addTime(platform, category, ms)` and starts a new one. `AppState` pauses/resumes. On close, the final segment is committed and `SessionSummaryOverlay` is shown if the session was >5s.

`mapPathToCategory(platform, path)` in `utils/stats.ts` converts a URL pathname to a `Category` ('feed' | 'reels' | 'messages' | 'video' | 'other').

### Instagram DM reel guard

`dmReelGuard(config)` in `injection/instagram.ts` is a separate IIFE (not part of `buildScript`) appended when `blockReels` is on. It uses `sessionStorage('quiet-dm-reel-origin')` to remember which chat thread opened a reel, locks scroll on the reel page (so swiping to the next reel is blocked), and redirects back to the originating chat when the reel ends. Reels not reached from a chat are redirected to `/`.

### Selector Health (doctor.tsx)

Loads each platform in a hidden 2×2 WebView, injects `buildDiagnosticScript(platform)` from `injection/diagnostics.ts`, and receives a `quiet-diagnostic` postMessage with live selector hit counts. Use this to confirm CSS selectors still work after platform UI updates.

### Savings estimates

`utils/savings.ts` → `getSavingsLine(platform, featureKey, isOn, days, enabledAt?)`. Returns a human-readable estimate of time saved (or time at risk if the feature is off). Uses `byPlatform` from `DayStats` to avoid cross-contamination — days without `byPlatform` fall back to the global `categories` field.
