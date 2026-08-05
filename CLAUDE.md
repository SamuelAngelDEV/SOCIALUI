# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Non-negotiables

- No analytics, telemetry, or any network calls that send user data anywhere. Everything stays on-device (AsyncStorage only).
- Do not scrape, cache, or store any platform data. CSS/JS injection only — we never touch platform content, only hide elements.
- No ads. No data collection. No engagement optimization.
- Never claim credit for a behaviour change. Copy says "a comparable intervention achieved this", never "Quiet saved you this" — the first is arithmetic on measured data, the second is an unknowable counterfactual. `utils/reclaimed.ts` exists to enforce this; read its header before writing any outcome copy.

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

**Node 24 gotcha:** `expo start` crashes in its dependency validator with `TypeError: Body is unusable`. Use Node 22 LTS, or skip the check with `EXPO_OFFLINE=1 npx expo start`. (The machine's default `node` is currently v24.)

### Verification scripts

There is no test runner. `scripts/` holds standalone zero-dependency `node` scripts instead; each exits non-zero on failure.

```bash
node scripts/verify-tracking.js     # 91 checks — mapPathToCategory, CATEGORY_KIND, idle clamp, commit loop
node scripts/verify-schedule.js    # 48 checks — Quiet Hours window maths
node scripts/verify-commitment.js  # 70 checks — delayed-disable cooldown
node scripts/verify-themes.js      # 41 checks — background-theme contrast compositing
```

`verify-themes.js` does not lift functions; it re-implements the WCAG composite arithmetic against values parsed out of `constants/themes.ts` and `constants/colors.ts`. That is the right shape here because the thing under test is a *claim about colour*, not a function.

`verify-schedule.js` and `verify-commitment.js` use the same lift-and-eval approach as `verify-tracking.js`, against `utils/schedule.ts` and `utils/commitment.ts`. Three gotchas that have each already cost a debugging round:

- Lifted bodies do **not** close over the module — anything a lifted function references, whether a constant (`MAX_WINDOW_HOURS`, `MS_PER_HOUR`) or another function (`hasSegment`), has to be declared into the sandbox by the loader, still read from source rather than hardcoded.
- `extractFunction` finds a body by taking the first `{` after the parameter list, so a function whose **return type is an inline object literal** silently extracts the annotation instead of the body. Name the type (see `Resolution` in `utils/commitment.ts`). The annotation guard catches this, but the error message points at the wrong cause.
- Bodies must carry no type annotations. `resolve` is written as two `filter` passes rather than a pair of annotated accumulators for exactly this reason.

`verify-tracking.js` does not re-implement what it tests: it reads `utils/stats.ts`, lifts the real function bodies out, strips type annotations and evals them. Keep that property — a copied-out implementation drifts and silently stops testing anything.

`scripts/verify-reclaimed.js` (60 checks) requires a compiled build first, and its `require` path is absolute:

```bash
npx tsc utils/reclaimed.ts --outDir .tmp-reclaimed --rootDir . \
  --module commonjs --target es2020 --moduleResolution node --skipLibCheck
node scripts/verify-reclaimed.js
```

The `tsc` step reports `TS2307: Cannot find module '@/constants/platforms'` — that is a type-only import, tsc emits anyway, and the checks pass. `.tmp-reclaimed/` is a throwaway; delete it after.

**Important:** Read `AGENTS.md` before writing any Expo API code — it points to the exact versioned docs (`https://docs.expo.dev/versions/v54.0.0/`). Expo SDK 54 APIs differ from what the model's training data contains.

## Architecture

### Repository layout

- `app/` — expo-router screens (file-based routing). `_layout.tsx` defines the root `Stack`: `index` (home bento grid), `onboarding` (5 questions → app picker → mode → done, `STEP_COUNT = 8`), `settings`, `insights` (weekly report), `platform/[id]` (the WebView screen, one per platform), `snapchat` (modal, block-only platform), `doctor` (selector health dashboard).
- `components/` — shared UI (`PlatformTile`, `PlatformLogo`, overlays, `charts/`, `settings/`) plus `ui/` — the shared surface primitives (`Card`, `IconChip`, `Pill`, `SectionLabel`, `StatTile`, `NoticeRow`). Reach for these before writing another bespoke card: the density problem they fix is systemic, and every screen inventing its own padding is how it came back last time. `Pill`'s `tone` is a **closed set of pre-validated colour pairs**, not an open colour prop — `warning` on `groupedBackground` is 4.30:1 and fails, which is exactly the mistake an open prop invites.
- `constants/` — `platforms.ts` (platform registry), `features.ts` (per-platform feature list driving both Settings UI and injection), `presets.ts` (modes), `survey.ts` (onboarding questions as data), `colors.ts`/`typography.ts`/`spacing.ts` (design tokens), `activityColors.ts` (the one definition of the intentional/algorithmic colour language, derived from `CATEGORY_KIND`), `strings.ts` (all user-facing copy).
- `injection/` — one file per platform (`instagram.ts`, `tiktok.ts`, etc.) plus `engine.ts` (rule → IIFE compiler), `adapter.ts` (`PlatformAdapter` shape + `buildFromAdapter()`), `index.ts` (entry point `buildInjection()`), `diagnostics.ts` (selector health script).
- `store/` — Zustand + AsyncStorage state (`settingsStore.ts`, `statsStore.ts`).
- `utils/` — `stats.ts` (category mapping, idle clamp, day/week keys, intentional-vs-algorithmic split, Rhythm), `savings.ts` (per-feature time-saved estimates), `reclaimed.ts` (week-over-week trend, extrapolation), `schedule.ts` (Quiet Hours window maths), `commitment.ts` (delayed-disable cooldown).
- `scripts/` — verification scripts (above) plus `reset-project.js` (the create-expo-app scaffold remover — do not run).
- `research/` — design/product docs (competitor UI analysis, visual direction, tracking-accuracy notes). Read before UI or feature-scope changes.

Copy belongs in `constants/strings.ts`, not inline in components — except copy that already lives in a structured table (`features.ts` `label`/`note`, `presets.ts` `name`/`description`), which stays there.

### How injection works

Every platform is a `react-native-webview` that loads the real site. On load, `buildInjection(platform, settings, feedLimit, masterSettings)` in `injection/index.ts` calls the platform's `build*Script()` function, which calls `buildScript()` in `injection/engine.ts` with a list of rules and a config object.

`buildScript()` produces a self-contained IIFE string that is injected into the WebView. It runs entirely in the WebView's JS context — no bridge calls needed for hiding elements. The config object is `Record<string, boolean | MetricVisibility>` — metric features store a 3-state string, everything else is boolean.

The only bridge calls go the other direction, via `window.ReactNativeWebView.postMessage()`:

| Message | Meaning |
| --- | --- |
| `quiet-nav` | SPA navigation — carries `path`; drives category commits |
| `quiet-activity` | A real user interaction happened; resets the idle clamp |
| `quiet-hidden` / `quiet-visible` | `document.hidden` flipped; pauses/resumes the timer |
| `quiet-limit-reached` | Feed cap wall hit |
| `quiet-health` | One-time selector health report |

`app/platform/[id].tsx` ignores any payload that isn't one of these — the page itself can call `postMessage` too.

Snapchat has no builder in `BUILDERS`; it is block-only and renders as a modal. `buildInjection` returns `'true;'` for any unregistered platform.

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

Features with `metric: true` in `constants/features.ts` use this model. The settings UI renders a 3-segment control ("Show / Count / All") instead of a switch.

### Master toggles and presets

`applyMasterOverrides()` in `injection/index.ts` lays the cross-platform master toggles over per-platform config just before building: `killAllMetrics` forces every key in `METRIC_KEYS` to `'hidden-both'`, `killAllBadges` forces `BADGE_KEYS` on, `messagesOnly` → `dmsOnly`, `grayscaleEverything` → `grayscale`. Keys a platform doesn't implement are harmless no-ops. **When you add a new metric or badge feature key, add it to those arrays** or the master toggle will silently skip it.

`constants/presets.ts` defines modes — named bundles of settings applied to every enabled platform by `applyPreset()`. Modes are named for the **job** ("Look it up"), not the intensity ("Strict"), because an intensity name doesn't tell the user which to pick. A preset only writes keys that already exist in a platform's settings.

### Health beacon

On the first pass after `ready`, the injected script runs a one-time health check: it tries `querySelectorAll` on every active CSS selector and reports broken (throws) or zero-match selectors via a `quiet-health` postMessage. In dev mode, `app/platform/[id].tsx` logs these to the console. No data leaves the device.

### Feed cap

The cap marks kept posts with `data-quiet-keep` (persistent — never removed even if the site virtualizes the post). Once `limitCount` eligible posts are marked, a `quiet-cap-style` hides everything unmarked. Wall is signaled when the last kept post's bottom enters the viewport. `window.__quietSetLimit(n)` raises the cap (called from the native "Show more" button).

### State

- `store/settingsStore.ts` — per-platform feature toggles, feed limits, master toggles (`killAllMetrics`, `killAllBadges`, `messagesOnly`, `grayscaleEverything`), `quietHours`, `disableDelayHours`/`pendingChanges`/`pendingDelayHours` (see Delayed disable), `toggleEnabledAt` timestamps, `onboarded` + the five survey answers. Persisted via Zustand + AsyncStorage.

  **Two per-platform axes, deliberately.** `platformInUse` is "this app is mine" (drives the home grid and which Settings sections exist); `platformEnabled` is "filters apply to it" (gates injection). Onboarding's app picker sets both. Collapsing them would make *"just track this one"* impossible to express — and tracking without restricting is the honest starting point for someone who doesn't yet know what they want blocked. `setPlatformInUse(id, false)` also forces `platformEnabled` false, so a dropped app can't come back silently pre-restricted.

  **A persisted field must appear in BOTH `partialize` and `merge`.** `quietHours` shipped in `merge` only, so the window was rebuilt from defaults on every launch and the feature silently switched itself off overnight — and the read side made it look wired. Adding a field to one list is worse than adding it to neither.
- `store/statsStore.ts` — time tracking, storage key `'quiet-stats-v1'`. `DayStats` keyed `'YYYY-MM-DD'`, pruned to 60 days.

`DayStats` fields, all in milliseconds:

- `total`, `platforms` — headline numbers.
- `categories` — global activity rollup (kept for totals and pre-upgrade data).
- `byPlatform?` — per-platform category split. **Required to avoid cross-contamination** in savings estimates; days predating it fall back to `categories`.
- `hours?` — per category, 24 local-hour buckets. Powers Rhythm. Stored per category rather than flattened so the intentional/algorithmic classification stays a read-time function (`CATEGORY_KIND`) — reclassifying a category later must not invalidate history.

Both optional fields are additive: no store version bump was needed, and every read path treats missing/short data as zero. Follow that pattern for new fields.

`settingsStore`'s custom `merge()` runs on hydration and does more than shape-filling: it migrates old boolean metric values (`true` → `'hidden-both'`, `false` → `'visible'`), folds the retired `hideLikeButton` key into `hideLikeCounts`, and re-validates stored survey answers through the type guards in `constants/survey.ts` rather than trusting whatever an older build wrote.

### Time tracking flow

`app/platform/[id].tsx` owns the timer. It tracks `catRef` (current category), `catStartRef` (segment start), `pausedRef` (backgrounded), and last-activity time. On `quiet-nav`, the elapsed segment is committed via `addTime(platform, category, ms, endedAt?)` and a new one starts. `AppState` and `quiet-hidden`/`quiet-visible` pause and resume. On close, the final segment is committed and `SessionSummaryOverlay` is shown if the session was >5s.

`addTime` slices the segment `[endedAt - ms, endedAt)` across local hour boundaries into `hours`.

**Idle clamp.** A WebView left open on a feed would otherwise accrue time forever — a phone put down mid-scroll is the largest single source of over-counting, and it inflates exactly the algorithmic categories the headline claim is about. `effectiveSegmentEnd(start, now, lastActivityAt, graceMs)` cuts a segment off at `lastActivityAt + IDLE_GRACE_MS` (60s) and discards the dead span. It never returns a value before `start` — a segment can shrink to zero but a clamp must not be able to invent time.

`mapPathToCategory(platform, path)` in `utils/stats.ts` converts a URL pathname to a `Category` (`'feed' | 'reels' | 'messages' | 'video' | 'other'`). It normalizes first (full hrefs, query strings, fragments, trailing slashes all tolerated) because it is the only thing standing between a URL and a permanently-recorded category. Any change here needs a matching case in `scripts/verify-tracking.js`.

### Intentional vs algorithmic split

The product's headline measurement is not "which app" but who chose the content. `CATEGORY_KIND` in `utils/stats.ts`:

- `messages`, `video`, `search` → `intentional` ("Chosen by you") — a specific person, a specific video, a specific query.
- `feed`, `reels`, `explore` → `algorithmic` ("Chosen for you").
- `other` → `unclassified`, deliberately its own kind. It's the fallback branch of `mapPathToCategory` (profiles, notifications, settings) and mixes both. `splitByKind()` excludes it from the ratio and reports it on its own line; `classified = intentional + algorithmic` is the only honest denominator.

Do not fold `other` into either side to make a number look better. **Do** move a surface out of `other` when it has its own identifiable route — `explore` and `search` were added exactly that way. The bar is evidence, not convenience: a route the platform gives its own URL is a surface we can classify, and declining to read it was discarding real time from the denominator. Note the direction is not self-serving — `search` lands on the intentional side and pushes the headline percentage *down*.

`categoryLabel(platform, category)` renders a category the way its platform names it (Reels / Shorts / For You). Storage stays one category per *kind of surface*; the naming is read-time only, so reclassifying never invalidates history.

**When you add a category:** `mapPathToCategory` case, `CATEGORY_LABELS`, `CATEGORY_KIND`, and checks in `verify-tracking.js`. TypeScript catches a missing `CATEGORY_KIND` row; nothing but the script catches it being on the wrong side. Substring path matching is banned — use `hasSegment`, or `/r/searchengines` books as search time forever.

### Rhythm

`hourHistogram()` + `findRhythmWindow()` find the contiguous stretch of the day (wrapping past midnight) holding the most algorithmic time relative to its length, scored to reward concentration rather than raw size. Gated on four conditions (≥3 days with data, ≥30 min total, ≥30% share, ≥1.6× an even spread) and returns `null` when the data is too thin — **saying nothing is the correct output**. `describeRhythm()` is observational: it states the pattern and asks for nothing.

### Quiet Hours

A daily local-hour window (`store/settingsStore.ts` → `quietHours`) in which opening a platform shows `QuietHoursOverlay` instead of the WebView. `utils/schedule.ts` holds the maths and is a pure module for the same reason `reclaimed.ts` is.

- The window is `[startHour, endHour)` and **wrapping past midnight is the normal case**, not the edge case — the default is 22:00–02:00.
- `startHour === endHour` means **never active**, not "all day". The two are indistinguishable under wrapping half-open bounds, and a degenerate slider state must not be able to lock someone out permanently.
- All arithmetic goes through `Date`/`setHours`, never raw ms offsets, so a window is a wall-clock idea that survives a DST change. `verify-schedule.js` asserts the state *flips* at the boundary rather than that it lands on a literal hour — on a spring-forward day the target hour genuinely doesn't exist.
- Callers arm **one** `setTimeout` from `nextBoundary`, never a polling interval.
- `app/platform/[id].tsx` must commit the running segment (via `pauseTracking`) *before* the overlay mounts, or the wall silently swallows tracked time.
- Enforcement lives only on the platform screen. `app/index.tsx` surfaces the state but still navigates, so there is one wall and one "open anyway" path to keep in sync.
- The overlay always offers a way through after a short cooldown. Friction is the mechanism; a lock is a different product.

### Delayed disable

`utils/commitment.ts` — the cooldown between asking to weaken a protection and it applying. Pure module, same discipline as `schedule.ts`; `scripts/verify-commitment.js` lifts it.

**The asymmetry is the whole design.** Turning a protection *on* is instant and additionally **cancels any scheduled weakening of the same thing**. Turning one *off* is scheduled for `disableDelayHours` (default 24) and shown until it fires. Without the cancel-on-strengthen half, a user who changes their mind still has a timer running that silently undoes their choice hours later — the worst thing this feature could do.

Three paths are covered because each is otherwise a one-tap bypass of the other two:

- **Quiet Hours** — gated on `isProtecting()`, which asks what the window *does*, not which field changed. A zero-length window is as "off" as `enabled: false`, so dragging the start hour onto the end hour would otherwise be an instant, undelayed disable. Hour *tuning* stays instant; the picker has to remain usable.
- **Master toggles** — via `masterPendingKey(key)`.
- **The delay itself** — lowering `disableDelayHours` waits out the delay currently in force, with the new value parked in `pendingDelayHours`. Otherwise "set cooldown to 0" is a one-tap route to disabling everything instantly.

`tickCommitments()` applies what's due. `useCommitmentTicker()` in `app/_layout.tsx` calls it at launch and on `AppState` → active (a cooldown can elapse while the app is closed), plus **one** `setTimeout` armed at the nearest deadline — never an interval, same rule as `nextBoundary`.

**This is not a lock and does not govern access.** The per-session "open anyway" on `QuietHoursOverlay` and the feed wall are untouched: someone who needs into an app right now still gets in, in seconds, every time. `CLAUDE.md`'s "friction is the mechanism, a lock is a different product" rule is about the door; this is about whether the protection still exists tomorrow. Any surface that mentions the wait must also say opening an app is unaffected.

Two honest limits, stated rather than papered over: the device clock is the only clock (moving it forward skips the wait, and on an on-device-only product there is no way to detect that and no intention of trying), and deleting the app removes everything. It is a speed bump for an impulse, not a security control.

**Every UI that can weaken a protection must render its pending state.** A switch that appears to snap back on its own reads as a bug. `SettingsRow`'s `pending` prop does this; Insights' `RhythmCard` swaps "Turn off" for "Keep it on".

### Refusing to claim

Three modules share one discipline — refuse a claim the data doesn't support, rather than hedge it:

- `utils/savings.ts` — `getSavingsLine(platform, featureKey, isOn, days, enabledAt?)` returns `'Learning your patterns…'` or `null` below `MIN_DAYS_OF_DATA` (3). Uses `byPlatform` to avoid cross-contamination.
- `utils/reclaimed.ts` — needs `MIN_FULL_WEEKS` (2) and a delta above `MIN_DELTA_MS_PER_WEEK` (15 min) before naming a trend. Baseline is the user's own first full week, never a population average. A rise is reported as plainly as a fall. No streaks, no scores, no goal bars. `projectYears`/`formatLongSpan` extend the same gated figure to `HORIZON_YEARS` (10) — the long horizon must never render where the one-year figure is refused.

  **This file must not import app values.** `verify-reclaimed.js` requires the compiled output through node, where a `@/…` path alias won't resolve; a type-only import emits nothing and is fine, a value import breaks the harness. That is why `projectFromEstimate` takes an `EstimateBand` rather than importing `AMOUNT_BANDS`.

  `projectFromEstimate` is the one number on the screen that is **not** measured — it projects the user's own onboarding guess so day one isn't blank. `app/insights.tsx` renders it in a deliberately quieter register than measured figures. Keep that contrast: a guess set in the same type as a measurement is a guess laundered into a fact.
- Rhythm, above.

### Selector Health (doctor.tsx)

Loads each platform in a hidden 2×2 WebView, injects `buildDiagnosticScript(platform)` from `injection/diagnostics.ts`, and receives a `quiet-diagnostic` postMessage with live selector hit counts. Use this to confirm CSS selectors still work after platform UI updates.

### Instagram DM reel guard

`dmReelGuard(config)` in `injection/instagram.ts` is a separate IIFE (not part of `buildScript`) appended when `blockReels` is on. It uses `sessionStorage('quiet-dm-reel-origin')` to remember which chat thread opened a reel, locks scroll on the reel page (so swiping to the next reel is blocked), and redirects back to the originating chat when the reel ends. Reels not reached from a chat are redirected to `/`.

### Design tokens

`constants/colors.ts` pairs were computed against WCAG 2.x relative luminance, not estimated, with the ratio recorded in a comment per entry (body text 4.5:1, large text and non-text UI 3:1). Two values were removed for failing; don't reintroduce colors without computing the ratio. The palette carries several hues at restrained chroma deliberately — saturation drives perceived arousal more than hue. The standing rule is to copy competitor *layout*, never their visual style. See `research/03-visual-direction.md`.

**Compute, don't estimate — this has caught real failures.** A guessed ratio in a comment is worse than none, because it reads as authoritative. Run the pair through `node` before writing the number down.

`constants/activityColors.ts` is the single definition of the activity colour language, used by Insights, the session summary and Home. Two levels: `categoryColor`/`categoryTextColor` give each surface its own hue, `KIND_COLORS` collapses to two for views that are about the split rather than the breakdown. Warm hues carry algorithmic, cool carry intentional, so the two families read before any label does — and `orderedCategories()` sorts algorithmic-then-intentional so a stacked bar clusters them rather than interleaving. Colour is never the sole carrier: every legend row also names its kind in words, per `research/03` §1.1 on colour-vision deficiency and greyscale.

### Background themes

`constants/themes.ts` + `components/ThemeBackground.tsx`. A theme changes the **ground only** — cards, rows and text keep the token system, so every ratio in `colors.ts` still holds on top of any theme. Rendered once in `app/_layout.tsx` behind the whole stack; push screens set `backgroundColor: 'transparent'`.

Three layers: plain ground → scene → a scrim of `Colors.background` at `SCRIM_ALPHA` (0.85).

**Scene marks must be light — this is the non-obvious part.** `textTertiary` has only 5.03:1 on the plain ground, so it runs out of headroom first. Even at a 0.92 scrim, a mark as dark as `#5E2A6B` drags it to 4.40:1 and it fails. Marks stay at or above roughly `#BE9BC9` in lightness. `verify-themes.js` composites every declared colour and fails if any text token drops under 4.5:1, and it additionally asserts that a known-too-dark mark *still* fails — so raising `SCRIM_ALPHA` to sneak one through breaks the build.

**Every colour a scene draws must appear in that theme's `marks` array.** A colour used in the component but missing there is unverified, which is the one failure mode this design has.

The accessibility limit and the product thesis agree here: `research/03` §1.4 argues for low global saturation anyway, so a loud photographic ground was never on. That is usually a sign the constraint is the right one.

### Layout register

Structure borrowed from a reference shot: bento grids (mixed tile sizes), tinted icon chips, pill badges, generous 20px card padding. Values stay ours — radii cap at `Radii.lg` (16), not the reference's 24–32.

**The density rule.** No screen should ship more than roughly a quarter empty. Where there is genuinely nothing to say, use the progressive empty state — name what will appear and when (`LearningCard`'s threshold meters) — rather than blank space or filler copy. The home screen's old footer ("Change your relationship with your phone", directly under a tagline saying the same thing) is the pattern to avoid.

**Progress meters need a real denominator.** `LearningCard` draws a bar for "2 of 3 days" and draws none for "no pattern yet" — the days are already there and the data hasn't formed one, so a partial bar would imply progress toward something that may never arrive.
