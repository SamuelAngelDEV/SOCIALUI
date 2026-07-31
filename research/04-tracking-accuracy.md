# Time-tracking accuracy audit

> **Scope.** Everything that decides what a minute in `store/statsStore.ts` means: the timer in
> `app/platform/[id].tsx`, the category mapping in `utils/stats.ts`, and the `quiet-nav` signal
> from `injection/engine.ts`. Insights had never been verified, and it is being considered as a
> paid feature, so the standard applied here is "would this number survive a user checking it
> against their own phone's Screen Time".
>
> **Method and its limits.** The logic gaps below were found by reading the code and are
> reproduced as executable checks in `scripts/verify-tracking.js` (66 checks, `node
> scripts/verify-tracking.js`). URL shapes were corroborated against the hrefs and route-guard
> prefixes this repo's own injection rules already key on — those were written against the live
> sites, so they are real evidence, not guesses.
>
> **What I could not do.** I could not log into Instagram or YouTube to capture URLs from a live
> session (entering credentials is off-limits, and the browser available here renders neither
> site logged-out). I could not run the app on an iOS or Android device, so every claim about
> `AppState` timing is reasoned from the RN lifecycle, not observed. Shapes I could not
> corroborate from in-repo evidence are marked `[unverified]` in the test file and listed in
> "Still uncertain" at the end. Nothing here was measured against real user data — there is
> none, by design, and the fixes add no way to collect any.
>
> Run date: 2026-07-30.

---

## The one-paragraph version

Four of the five suspected gaps are real, and the founder's instinct about which one matters was
right: **idle time was the dominant error, and it was unbounded.** Before this change, a phone
left face-up on a feed accrued time forever, and it accrued it into `feed` and `reels` —
precisely the two categories the product's headline "chosen for you" claim is computed from. So
the error was not just large, it was *biased in the direction that flatters the product's
thesis*, which is the worst possible failure mode for a number we intend to charge for. That is
now capped at 60 seconds per idle episode. Two smaller real bugs were also fixed: every session's
page-load spinner was booked as algorithmic feed time, and every Reddit comment thread — the
single heaviest surface on that platform — was booked as feed time. The suspected sub-500ms loss
is real but negligible (under ~2s/day); it was fixed anyway because the fix is free. Screen lock
appears to have been handled correctly all along, but it now has a second independent signal
because I could not verify it on hardware.

---

## 1. Idle time counted as active — REAL, was the largest error, now bounded

**Confirmed.** `commitSegment()` computed `now - catStartRef` with no reference to whether a human
was present. The only things that stopped accrual were an `AppState` change, an SPA navigation, or
unmount. None of those happen when someone stops touching a phone that is still unlocked and
foregrounded. Twenty minutes of a phone sitting on a table recorded twenty minutes of "use".

**Magnitude.** Unbounded per episode, which is why it deserves the top billing rather than a
percentage. I want to be precise about what I can and cannot say:

- I can state the **bound**: before, phantom time per idle episode was limited only by the screen
  auto-lock timeout (commonly 30s–5min, but "Never" is a setting people use, and video playback or
  an active `WakeLock` defeats it entirely). After, it is **60 seconds, hard**.
- I **cannot** state the average daily inflation, because that requires usage data this app
  deliberately does not collect. Any number I gave would be invented.
- What makes it the priority is not just the size but the **direction**: idle episodes happen
  disproportionately while parked on a feed rather than while typing a message, so the error
  pushed `algorithmicShare` — the headline — systematically upward.

**Fix.** A lightweight activity ping, on-device only.

- `injection/engine.ts` now listens capture-phase and passive for `touchstart`, `pointerdown`,
  `keydown`, `wheel` and scroll, and posts `{type:'quiet-activity'}` — throttled to one per 5s.
  The message carries **no** coordinates, no target, no URL, nothing but its own existence.
- `app/platform/[id].tsx` records the last ping and clamps every commit to
  `lastActivity + IDLE_GRACE_MS`. The clamp lives in `effectiveSegmentEnd()` in `utils/stats.ts`
  as a pure function so it is directly testable, and it can never return a value past `now` or
  before `start` — a clamp must not be able to invent time.
- When a ping arrives after a silence longer than the grace window, the segment is committed
  (clamped) *before* the clock restarts, so the dead span is stepped over rather than credited.

**Two judgement calls worth flagging.**

- **60 seconds** is a deliberate compromise. Reading a long comment thread or a DM produces no
  touch events at all for tens of seconds, and cutting that off would under-count real, attentive
  use — under-counting is also a lie. 60s sits above realistic read gaps and below the point where
  phantom time matters. It is one constant, `IDLE_GRACE_MS`, if that judgement turns out wrong.
- **Muted video does not count as activity.** A playing `<video>` sends a heartbeat every 15s so
  that watching a ten-minute YouTube video without touching the screen is correctly credited — but
  only if it is *unmuted*. Instagram and TikTok autoplay muted previews in the feed, and treating
  those as liveness would reintroduce exactly the passive accrual this mechanism exists to remove.
  The cost: someone watching YouTube muted with captions on gets clamped to 60s. I judged
  over-crediting every muted feed autoplay to be the worse error, but this is the assumption in
  this change I am least sure about.

---

## 2. Screen lock — PROBABLY NOT REAL, but now double-signalled

**Not reproduced, and I could not test it on hardware.** Reading the lifecycle: on iOS a screen
lock while foregrounded drives the app to `inactive` and then `background`; on Android it triggers
`onHostPause`, which RN reports as `background`. The existing code treats *anything* that is not
`'active'` as a pause, so both paths were already handled. I found no defect.

I am unwilling to leave a "probably" on a paid feature's foundation, so there are now two further
independent protections, neither of which relies on that reasoning being correct:

- The WebView reports `visibilitychange` directly (`quiet-hidden` / `quiet-visible`), which the app
  treats as a pause/resume. This is observed in the page, not inferred from the native lifecycle.
- **The idle clamp from §1 is the real backstop.** Even if both signals missed entirely on some OS
  version, a locked screen produces no touches, so accrual stops after 60 seconds regardless. This
  is the part that makes me comfortable shipping without a device test.

---

## 3. Category attribution — one real bug, plus two design decisions worth restating

Checked every platform's mapping against the URL shapes in `injection/*.ts`. `scripts/verify-tracking.js`
now pins all of them.

### Real bug: Reddit comment permalinks were booked as feed — FIXED

`/r/{sub}/comments/{id}/{slug}` starts with `/r/`, so `mapPathToCategory` returned `'feed'` —
`algorithmic`. But a comment thread is something the user deliberately opened; the ranked listing
is `/r/{sub}`. Reading threads is where Reddit time actually goes, so this pushed nearly all Reddit
usage onto the algorithmic side of the headline split. Comment pages now return `'other'`
(unclassified), matching how the codebase already treats "we cannot tell from a URL".

### Real, smaller: robustness of the exact-match branches — FIXED

Several branches used `p === '/home'`-style equality, which a trailing slash defeats — and
Instagram and LinkedIn both serve trailing-slash canonical URLs. Added `normalizePath()`: strips
the query and fragment, lowercases, tolerates a full href being passed, and strips trailing
slashes except on the root. This closes a class of silent misfiling rather than one instance.

### Also fixed: TikTok search

Everything non-`/messages` on TikTok returned `'reels'`, including `/search`. Search is the one
TikTok surface the user drives; it is now `'other'`.

### Verified correct (no change)

| Platform | Shape | → | Evidence |
|---|---|---|---|
| Instagram | `/`, `/p/{code}` | feed | `limitPath: '/'` in `injection/instagram.ts` |
| Instagram | `/reels/`, `/reel/{id}` | reels | route guards + `dmReelGuard`'s `isSingleReel` |
| Instagram | `/direct/inbox/`, `/direct/t/{id}` | messages | `dmBadgeSelector`, `isChat` |
| YouTube | `/`, `/watch`, `/shorts/{id}` | feed / video / reels | `limitPath`, shorts guard |
| Facebook | `/home.php` and `/` | feed | legacy m.facebook alias, both covered |

### Two things that look like bugs and are not

Both concern `'other'`, and both are worth restating because they will come up again:

- **Instagram Explore and Stories land in `'other'`,** despite Explore being unambiguously
  algorithmic. This is the existing documented design (`CATEGORY_KIND`), and it is correct:
  `'other'` is **excluded from the ratio**, not folded into either side. So Explore time shrinks
  the denominator rather than corrupting the split. It makes the headline *conservative*, which is
  the right direction to err for a claim we are charging for.
- **YouTube `/feed/subscriptions` lands in `'other'`** for the same reason. Subscriptions is a
  chronological list of channels the user chose, so calling it algorithmic would be wrong, and
  calling it fully intentional is more than a URL can support.

I did not change either. Reclassifying them would move the headline percentage by an amount the
data cannot defend — which is exactly the reasoning already written into `CATEGORY_KIND`.

---

## 4. Sub-500ms segments — REAL but negligible; fixed anyway

**Confirmed, and it was double-gated:** `commitSegment` dropped `ms < 500` *and* `addTime` dropped
`ms < 500` again. Worse, `commitSegment` dropped the segment while still advancing `catStartRef`,
so the time was destroyed rather than carried.

**Quantified — this is much smaller than it looks.** A commit only happens on a *category* change,
not on every navigation. Swiping through twenty Reels produces twenty `quiet-nav` messages that all
map to `'reels'`, so it produces **zero** commits. Losing one minute a day would require ~120
genuine category transitions each under half a second, which is not reachable by a human. Realistic
loss: **under ~2 seconds per day**, i.e. below 0.1%.

**Fixed regardless**, because the fix costs nothing: a sub-floor segment now leaves `catStartRef`
untouched, so the remainder rolls into the next segment instead of being deleted. Rapid navigation
can now shift a few hundred milliseconds between adjacent categories but can no longer destroy
time. The `rapid nav loses no time` check in the test file pins this: ten switches in 3s, total
preserved exactly. `addTime`'s own floor is now unreachable from the only caller and is left in
place as a defensive guard.

---

## 5. `quiet-nav` reliability — REAL, one concrete bug found and fixed

The suspicion was that an SPA could change view without a pathname change. I could not construct a
case: `reportNav()` fires from `runPasses()`, which is driven by a `MutationObserver` on the whole
document, and a view change that mutates nothing is not a view change. If it happens, it is silent
and I have no way to detect it from here — it stays on the uncertain list below.

**What I did find is a different and much more concrete bug in the same area.** `catStartRef` was
initialised at **mount**, but `catRef` defaulted to `'feed'` and the first `quiet-nav` cannot arrive
until the page exists. So every visit booked its entire page-load spinner — 1–5 seconds, up to the
10s `LOAD_TIMEOUT_MS` — as **feed time, i.e. algorithmic time**, on a platform the user might have
opened only to check a DM.

This is small per session and not small in aggregate: at ~3s of load and 20 opens a day it is
roughly a minute a day of pure loading credited to the algorithmic side, every day, for every user.
It also biases the same direction as the idle bug.

**Fix.** The clock now starts on the first `quiet-nav` — the moment the page is real and its
category is known — via an idempotent `startTracking()`. `onLoadEnd` calls it as a fallback so that
platforms running with injection disabled (which never emit `quiet-nav`) still track, and a load
that errors out starts nothing, so time staring at the retry screen is not recorded.

---

## Guardrails observed

- **No analytics, telemetry, or network calls.** The activity ping is a `postMessage` from the
  WebView to the host app on the same device. Nothing was added that opens a socket or a request.
- **No new stored data, and the `hours` schema is untouched.** No field was added, removed, or
  renamed in `DayStats`; `hours` stays optional and pre-upgrade days hydrate exactly as before. The
  fixes change *how much* time is written and *which category* it lands in, never the shape.
- **No engagement mechanics.** No streaks, no goals, no notifications, nothing gamified.
- One intentional consequence worth stating plainly: **recorded time will drop** after this ships,
  and day-over-day comparisons spanning the upgrade are not like-for-like. Older days remain
  readable but were recorded by a more generous clock. If Insights ever draws a trend line across
  this boundary, that needs saying in the UI.

---

## Still uncertain

Ranked by how much I would want them closed before charging for this.

1. **No on-device validation.** The largest gap in this audit. Every fix is verified by logic and
   by `scripts/verify-tracking.js`; none has been observed on a real phone against a real session.
   The highest-value next step is a manual run: open Instagram, use it for a known five minutes,
   set the phone down for five, and compare Insights against a stopwatch.
2. **The 60s grace and the muted-video rule are calibration, not measurement.** Both are defensible
   and both are single constants, but neither is derived from observed behaviour.
3. **URL shapes marked `[unverified]`** in the test file — YouTube `/feed/*`, `/results`, `/@handle`,
   `/playlist`, and X `/{user}/status/{id}`. All currently fall to `'other'`, so if a shape is wrong
   it degrades to unclassified rather than corrupting the split. That is the safe failure direction,
   but it is not confirmation.
4. **The original §5 hypothesis is unproven either way** — I could not build an SPA-view-change-
   without-URL-change case on these sites, and I also cannot rule one out.
5. **Multi-WebView / re-entry paths were not stress-tested.** The `retry()` remount and rapid
   close-reopen cycles are handled by `startedRef` in principle but were not exercised on device.
