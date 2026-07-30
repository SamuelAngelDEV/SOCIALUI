# Feature Justifier — Raw Agent Output (UNVERIFIED)

> **STATUS: NOT VERIFIED.** This is the verbatim, uncompressed output of Agent 3
> (FEATURE_JUSTIFIER) from the multi-agent research run. It has NOT been through the
> Verifier stage. Claims here — especially competitor facts, rating counts, and
> "no competitor has this" assertions — must be ground-truthed before being acted on
> or repeated publicly.
>
> Run date: 2026-07-23. Agents 1, 2, 4, 5, 6 were terminated by a session limit before
> returning; this is the only completed report of the six.

---

## Competitive reality check (this changes the whole picture)

Before scoring: **the brief understates the competition badly.** Two apps ship most of Quiet's Layer 1 today.

**SocialLite** ([sociallite.app](https://sociallite.app/), [App Store](https://apps.apple.com/us/app/sociallite-block-reels-shorts/id6757661674)) — iOS + Android, **4.7★ with 3,300+ ratings, #49 in Productivity**. Blocks Reels, Shorts, Explore, Live, Shopping, ads, suggested posts; keeps DMs. Also ships **native app shielding with custom shield screens**, Screen Time/Dynamic Island integration, and a **Family plan at $4.99/mo**. Pro is $3.99/mo. Reviews confirm it "uses the social media's website" — the same webview technique. It also already claims the privacy line: "doesn't track your browsing, collect your data, or sell anything to advertisers."

**ScrollGuard** ([scrollguard.app](https://scrollguard.app/), [App Store](https://apps.apple.com/us/app/scrollguard-block-reels/id6754183872)) — confirmed: Allow Reels in DMs, doomscroll detection (Anti-Scroll Mode), password-locked Strict Mode with accountability partner. Plus **grayscale mode**, Mindful Open pause, time-saved insights, scheduled breaks, YouTube comment blocking, home screen widgets. IAPs $3.99–$59.99. Note: its iOS listing shows only 55 ratings, so the 200,000+ figure is Android-weighted — treat the iOS install base as small (**UNVERIFIED**).

**The metric-hiding thesis is also not new.** Ben Grosser's **Demetricator** ([Instagram](https://bengrosser.com/projects/instagram-demetricator/), [Twitter](https://bengrosser.com/projects/twitter-demetricator/), [Facebook](https://bengrosser.com/projects/facebook-demetricator/)) has hidden like, follower, view and notification counts since 2012 — free and open source. Instagram natively hides [like and view counts](https://www.macrumors.com/how-to/hide-like-view-counts-instagram-posts/). What *is* true: **no mobile app I found ships comprehensive metric hiding.** That gap is real, and it is Quiet's single best asset.

Pricing anchors: one sec is **$2.99/mo, $19/yr, $50 lifetime** — nearly identical to Quiet's plan. Freedom ($39.99/yr) sells cross-device sync as its core. ScreenZen is free and cross-platform.

## Scoring note — the brief has an inverted flag

The axis says Technical Replicability 5 = "sustained infrastructure" (hard to copy = **defensible**), but the flag rule says "flag every feature scoring 5 — not defensible." Those contradict. I scored to the axis definition and flagged the **1s** as the undefensible ones, since that's clearly the intent. Both sets are called out below.

## Full matrix

TR = replicability (5 = hard to copy) · UV = visibility · ER = emotional resonance · ML = marketing legibility · PP = pricing power

### Layer 1 — feed blocks

| Feature | TR | UV | ER | ML | PP | Tot | Already shipped by | Rec | One-line |
|---|--:|--:|--:|--:|--:|--:|---|---|---|
| Reels (IG) | 1 | 5 | 5 | 5 | 2 | 18 | [SocialLite](https://sociallite.app/), [ScrollGuard](https://scrollguard.app/), [Shortstop](https://shortstop.app/), [ScrollFree](https://getscrollfree.app/) | **Free** | The category's front door — four apps give it away; charging is impossible |
| Shorts (YT) | 1 | 5 | 5 | 5 | 2 | 18 | Same four | **Free** | Identical economics to Reels |
| FYP (TikTok) | 2 | 5 | 5 | 4 | 2 | 18 | [ScrollGuard](https://scrollguard.app/) (Android), SocialLite | **Free** | Slightly harder in webview — TikTok web is hostile; may not ship reliably |
| Main feeds | 1 | 5 | 4 | 5 | 2 | 17 | [News Feed Eradicator](https://github.com/jordwest/news-feed-eradicator) (free OSS), SocialLite | **Free** | Free and open-source since 2014 |
| For You timeline (X) | 1 | 4 | 4 | 4 | 2 | 15 | ScrollGuard; X's own Following tab | **Free** | X already ships the free alternative |
| Explore (IG) | 1 | 4 | 4 | 4 | 2 | 15 | ScrollGuard, [IGPlus](https://chromewebstore.google.com/detail/igplus-hide-instagram-ree/dbbopjndlaginbghfoibbndhlbpdpapd) | **Free** | Table stakes bundled with Reels |
| Popular tab (Reddit) | 1 | 3 | 3 | 2 | 1 | 10 | ScrollGuard (Reddit supported) | **Free** | Small audience, no standalone pull |
| Live | 1 | 2 | 2 | 2 | 1 | 8 | SocialLite | **Free** | Nobody articulates Live as their problem |
| Shopping | 1 | 2 | 2 | 2 | 1 | 8 | SocialLite | **Free** | Fold into a master toggle, don't market |
| Watch (FB) | 1 | 2 | 2 | 2 | 1 | 8 | SocialLite, ScrollGuard | **Free** | Declining surface, near-zero demand |
| Marketplace (FB) | 1 | 2 | 2 | 1 | 1 | 7 | — | **Free / cut** | Marketplace is utility, not addiction — blocking it is user-hostile |

### Layer 2 — metric hiding

| Feature | TR | UV | ER | ML | PP | Tot | Already shipped by | Rec | One-line |
|---|--:|--:|--:|--:|--:|--:|---|---|---|
| Follower/following counts | 1 | 4 | 4 | 5 | 3 | 17 | [Demetricator](https://bengrosser.com/projects/instagram-demetricator/) (free, desktop only) | **Pro** (bundled) | Strongest single metric — social comparison is the felt wound |
| Like counts | 1 | 4 | 4 | 5 | 2 | 16 | Demetricator; [Instagram native](https://www.macrumors.com/how-to/hide-like-view-counts-instagram-posts/) | **Pro** (bundled) | Instagram gives this free — cannot be sold alone |
| Story view counts | 2 | 3 | 4 | 3 | 2 | 14 | None found (**weak evidence**) | **Pro** (bundled) | Story-viewer anxiety is genuinely articulable and unclaimed |
| View counts | 1 | 3 | 3 | 3 | 2 | 12 | Demetricator, IG native | **Pro** (bundled) | Weak alone |
| Karma scores (Reddit) | 1 | 2 | 2 | 2 | 1 | 8 | — | **Bundle only** | Tiny audience |
| Comment counts | 1 | 2 | 2 | 2 | 1 | 8 | Demetricator | **Bundle only** | Nobody asks for this |
| Share counts | 1 | 2 | 1 | 1 | 1 | 6 | Demetricator | **Cut** | Lowest-scoring feature in the roadmap |

### Master toggles — where the actual product is

| Feature | TR | UV | ER | ML | PP | Tot | Already shipped by | Rec | One-line |
|---|--:|--:|--:|--:|--:|--:|---|---|---|
| **Kill All Metrics** | 2 | 5 | 5 | 5 | 4 | **21** | Demetricator (free, **desktop browser only**) — no mobile app found | **Pro — flagship** | The one genuine mobile gap; one screenshot sells it |
| **Messages Only Mode** | 2 | 5 | 5 | 5 | 4 | **21** | Competitors preserve DMs by default but ship no one-tap mode | **Free** | It *is* the thesis — give it away as the acquisition hook |
| Chronological Everywhere | 4 | 4 | 4 | 5 | 4 | **21** | None (IG/TikTok expose no chrono feed) | **Rescope** | Marketing gold, engineering trap — CSS can't reorder an algorithmic feed |
| Kill All Badges | 2 | 4 | 5 | 4 | 3 | 18 | Partially: iOS notification settings (free) | **Pro** | Badge anxiety is real; OS partially solves it free |
| Grayscale Everything | 1 | 5 | 3 | 5 | 1 | 15 | [ScrollGuard](https://apps.apple.com/us/app/scrollguard-block-reels/id6754183872); iOS Accessibility Color Filters | **Free** | iOS gives this away system-wide — paywalling reads as petty |

### Focus

| Feature | TR | UV | ER | ML | PP | Tot | Already shipped by | Rec | One-line |
|---|--:|--:|--:|--:|--:|--:|---|---|---|
| Unlimited custom sessions | 2 | 4 | 3 | 3 | 3 | 15 | [Opal, one sec, Clearspace, Freedom, Roots](https://unhookd.app/blog/opal-alternatives) | **Pro** | Fully commoditized, but it's the industry-standard paywall lever |
| Focus 30 preset | 1 | 3 | 3 | 3 | 1 | 11 | one sec (free for 1 app), ScreenZen (free) | **Free** | The free-tier taste |
| Focus Filter integration | 3 | 3 | 2 | 2 | 2 | 12 | Apple ships Focus Filters free | **Defer** | Polish with near-zero acquisition pull |

### Other

| Feature | TR | UV | ER | ML | PP | Tot | Already shipped by | Rec | One-line |
|---|--:|--:|--:|--:|--:|--:|---|---|---|
| Family Controls / native shielding | 5 | 5 | 4 | 4 | 5 | **23** | **[SocialLite ships this now](https://apps.apple.com/us/app/sociallite-block-reels-shorts/id6757661674)** (shield screens + $4.99/mo Family) | **Pro — but blocked** | Highest value, highest barrier: needs [Apple's Family Controls entitlement](https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement), a paid account, and a Mac you don't have |
| Priority selector updates (24h) | 5 | 2 | 4 | 3 | 5 | 19 | None | **Pro — with caution** | The only true moat, and the one promise a solo student most likely breaks |
| Weekly Attention Audit | 3 | 4 | 4 | 4 | 3 | 18 | Opal (analytics), ScrollGuard time-saved, Roots dopamine tracker | **Pro** | Everyone ships it; see Values Conflicts before building |
| Cross-Device Sync (extension) | 4 | 3 | 3 | 2 | 4 | 16 | [Freedom](https://unhookd.app/blog/opal-alternatives) sells this as its core; ScreenZen free | **Defer** | Real infra + accounts; a second product, not a feature |
| Manifesto page | 1 | 3 | 5 | 5 | 1 | 15 | None have a stance | **Free** | Not a feature — it's your entire differentiation vs. SocialLite |
| Save-Instead-of-Send | 3 | 4 | 3 | 3 | 2 | 15 | None found (**weak evidence** — absence of results only) | **Cut / validate** | Unvalidated problem; see Values Conflicts |
| Notification muting (basic) | 2 | 4 | 4 | 3 | 1 | 14 | iOS native, free | **Free** | OS already does it |
| Chronological feed toggles | 3 | 3 | 3 | 3 | 2 | 14 | IG "Following", X "Following", YT Subscriptions — all free | **Free** | Shortcut to existing free native tabs |
| Keyword blocking | 2 | 3 | 3 | 3 | 2 | 13 | AppBlock, BlockSite; IG & X native muted words | **Pro** | Cheap Pro filler, not a reason to buy |
| Actually-good onboarding | 2 | 5 | 3 | 2 | 1 | 13 | — | **Free** | Conversion infrastructure, never a SKU |
| Basic time tracking | 2 | 4 | 3 | 3 | 1 | 13 | ScrollGuard, SocialLite, everyone — free | **Free** | Commodity |
| Custom CSS filter rules | 2 | 2 | 2 | 1 | 3 | 10 | uBlock/Stylus free on desktop | **Cut** | Support burden vastly exceeds revenue from ~1% of users |
| Grayscale: 1 free vs all Pro | 1 | 3 | 2 | 2 | 1 | 9 | — | **Kill the split** | Artificial scarcity on a free OS feature |

## Flags

**Emotional Resonance < 3 (cannot justify Pro):** Share counts (1), Live (2), Shopping (2), Watch FB (2), Marketplace (2), Karma (2), Comment counts (2), Focus Filter integration (2), Custom CSS (2), grayscale free/Pro split (2).

**Pricing Power < 3 (cannot justify Pro):** every Layer 1 block, like counts, view counts, story view counts, karma, comment counts, share counts, Grayscale Everything, Focus 30, Focus Filter integration, keyword blocking, Save-Instead-of-Send, manifesto, onboarding, time tracking, notification muting, chronological toggles.

That is roughly **70% of the roadmap**. Only five features clear both bars: Kill All Metrics, Messages Only Mode, Chronological Everywhere, Family Controls, priority selector updates.

**TR = 5 (per the brief's rule):** Family Controls, priority selector updates. Per the axis *definition* these are your two most defensible items — I read the brief's flag as inverted and am scoring them as strengths. The real caution is different: both are expensive, and one is currently impossible for you (no Mac, no entitlement).

**TR = 1 — genuinely not defensible (a weekend of work to clone):** all eleven Layer 1 blocks, six of seven Layer 2 metrics, Grayscale Everything, Focus 30, manifesto. These are CSS selectors. Ship them, but never price them.

## Values conflicts

1. **B2B tier ($99/user/yr) — hard conflict.** Selling employers a tool to shield employees' phones is surveillance of people who did not choose it. "Only people you know" and "the app succeeds when the user closes it" don't survive contact with a compliance buyer. Drop this tier.
2. **Weekly Attention Audit — direct conflict with "no dark-pattern gamification."** A weekly score is a metric, a streak, and a reason to open Quiet. If it makes users feel watched or competitive, you've rebuilt the thing you're against. Ship it as plain prose with no trend line, no streak, no comparison, or don't ship it.
3. **Priority selector updates as a Pro feature — soft conflict.** This sells *reliability*, not capability: free users knowingly get a product that stays broken longer. That's closer to hostage-taking than a feature tier. Fix selectors for everyone; sell something else.
4. **Save-Instead-of-Send — conflicts with "directed sharing only."** Directed sharing is a principle you *endorse*; this feature adds friction to it. You'd be discouraging the one social behavior your manifesto defends.
5. **Cross-Device Sync — tension with the privacy stance.** Sync needs accounts and a server holding user config. Solvable (E2E, anonymous device pairing), but it is the first thing that makes Quiet hold data.
6. **Grayscale 1-platform-free / all-Pro — soft conflict.** Deliberately degrading a free OS capability to force upgrades is a dark pattern in miniature.
7. **Marketplace blocking** — blocking a utility surface under an anti-addiction banner is paternalism, not attention protection.

## Cut list

- **Share counts, comment counts, karma** — build into Kill All Metrics, never as separate toggles or marketing beats
- **Live, Shopping, Watch, Marketplace as individual toggles** — fold into one "hide extras" switch; four settings rows for ~7-point features is settings bloat
- **Custom CSS filter rules** — support cost >> revenue; power users write their own anyway
- **Focus Filter integration** — defer to v2
- **Save-Instead-of-Send** — values conflict plus an unvalidated problem
- **B2B tier** — values conflict plus zero enterprise sales capacity for a solo student
- **Cross-Device Sync / browser extension** — a second product; don't start it before iOS is proven
- **Chronological Everywhere as scoped** — you cannot reorder Instagram's feed with CSS, and there is no chronological data to reorder *to*. Rescope to "one tap to Following/Subscriptions tabs" and keep the marketing line honest
- **Lifetime $49.99** — reconsider. Your only moat (selector maintenance) is a *perpetual cost*; lifetime buyers fund one month of it and then bill you forever. one sec charges $50 lifetime with a team behind it

## Free tier must-haves

Grounded in what competitors actually give away — ScrollGuard is "largely free," SocialLite has a free tier, ScreenZen is entirely free, News Feed Eradicator and the Demetricators are free and open source:

- **All Layer 1 blocks, all platforms.** Four apps give these away. A paywall here kills you at install.
- **Grayscale.** ScrollGuard ships it; iOS gives it free.
- **Basic time tracking** and **notification muting.** Universally free.
- **Chronological/Following shortcuts.** The platforms provide these free.
- **Focus 30 preset.** one sec gives one free app; ScreenZen gives everything.
- **Messages Only Mode.** Counter-intuitive but correct: this is your thesis in one screenshot, it's your best tweet, and giving it away is how you get installs against a 3,300-review incumbent. Sell what people configure *after* they're convinced.
- **Manifesto + onboarding.** Your only real differentiator against SocialLite is a stated position. They have none. It costs nothing and it's your highest emotional-resonance asset.

**Pro should be exactly:** Kill All Metrics (flagship), Kill All Badges, unlimited focus sessions, keyword blocking, all-platform grayscale as convenience not gate, Attention Audit (redesigned per the values note), family plan. Native shielding and sync join later if the entitlement and the Mac arrive.

## Two structural risks worth more than any feature score

**App Store Guideline 4.2.** A React Native app whose main screen is a webview pointed at instagram.com is the textbook 4.2 "minimum functionality" rejection. Your native settings layer, toggles, and focus sessions are what get you through review — that's an argument to build native surface *early*, not late. ScrollGuard's iOS product is structured as a **Safari content-blocker extension plus an in-app browser**, which is likely a deliberate response to this exact pressure. Worth studying before committing to the wrapper architecture.

**Your pricing isn't undercutting anyone.** $2.99/mo vs. one sec at $2.99/mo and SocialLite Pro at $3.99/mo. There is no price wedge here — only a product wedge, and it's Kill All Metrics.

## Sources

[ScrollGuard](https://scrollguard.app/) · [ScrollGuard App Store](https://apps.apple.com/us/app/scrollguard-block-reels/id6754183872) · [SocialLite](https://sociallite.app/) · [SocialLite App Store](https://apps.apple.com/us/app/sociallite-block-reels-shorts/id6757661674) · [Instagram Demetricator](https://bengrosser.com/projects/instagram-demetricator/) · [Twitter Demetricator](https://bengrosser.com/projects/twitter-demetricator/) · [Facebook Demetricator](https://bengrosser.com/projects/facebook-demetricator/) · [News Feed Eradicator](https://github.com/jordwest/news-feed-eradicator) · [IGPlus](https://chromewebstore.google.com/detail/igplus-hide-instagram-ree/dbbopjndlaginbghfoibbndhlbpdpapd) · [Shortstop](https://shortstop.app/) · [ScrollFree](https://getscrollfree.app/) · [Screen-time app pricing comparison](https://unhookd.app/blog/opal-alternatives) · [Apple Family Controls entitlement](https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement) · [Instagram native like/view hiding](https://www.macrumors.com/how-to/hide-like-view-counts-instagram-posts/) · [App Store webview guideline risk](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper)
