# Competitor UI & Visual Analysis

> **Method.** Eight competitors' store screenshots were downloaded and viewed directly (not
> read from marketing copy). Seven from `apps.apple.com`, one — Unhook — from the Chrome
> Web Store. Hex values below are **measured**, not eyeballed: every screenshot was pixel-sampled
> and colour-quantized into 16-level buckets, then the dominant buckets were ranked per app.
> Quantization means a reported `#608060` is the centre of a bucket, so real values sit within
> about ±8 per channel. Where I estimate a specific UI token from a single element rather than
> from the frequency table, I say so.
>
> **What I could not observe.** App Store and Chrome Web Store screenshots do not include
> onboarding flows or paywall screens. Every claim in the Onboarding section is therefore
> secondary-sourced from reviews and pricing pages and is labelled as such. I did not install
> any of these apps.
>
> Run date: 2026-07-30. Screenshots live in the session scratchpad only and are deliberately
> not committed — this repo is public and these are third-party store assets.

---

## The one-paragraph version

The category has split into two visual tribes. **Behaviour-change apps** (Opal, Jomo, Freedom,
one sec) invest in identity — custom type, rendered artwork, mascots, scores — and are the ones
that look like products. **Feed filters** (ScrollGuard, Scrolless, SocialLite, Unhook) ship a
toggle list on black or white and look like preferences panes. Quiet is a behaviour-change app
and will be judged against the first tribe. Within that tribe, the single most important finding
is uncomfortable: **Freedom already owns cream-and-forest-green in this exact category**, with
4M+ users and an Editors' Choice badge, and Quiet's current palette is a darker, bluer restatement
of it. The genuinely unowned territory in Quiet's palette is not the green — it is the gold.

---

## one sec

**Store:** [apps.apple.com/us/app/one-sec-screen-time-focus/id1532875441](https://apps.apple.com/us/app/one-sec-screen-time-focus/id1532875441)

### Colour

Measured dominants: `#203040` (25%), `#202030` (16%), `#201020`, `#202020`, `#101020`, with
`#8080E0` appearing at 1.6% — small share, high salience.

| Role | Estimate | Notes |
|---|---|---|
| Background (marketing) | `#1E2836` → `#232838` | Dark navy-charcoal gradient, heavy film grain |
| In-app surface | `#2A303C` | Elevated cards on the dark ground |
| Primary accent | `#7E82E4` periwinkle | Buttons, rings, links, headline emphasis |
| Secondary accent | `#1BC0B0` teal | Wordmark, section headers |
| Alert / urgency | `#F5333F` red, and a `#FF1B6B` → `#FF8C42` magenta-orange gradient | The gradient is reserved for the "attempts" interrupt |

**Light/dark:** dark-committed in marketing, but genuinely both in-app — the "Block" schedule
screen is white with `#F2F2F7` grouped rows. The frames are dark because dark photographs better,
not because the app is.

The magenta-to-orange gradient is the most aggressive colour move in the whole field, and it is
used with intent: it appears only on the screen showing "17 — Attempts to open Instagram." That
is a shame number, and it is deliberately painted in alarm colours. The rest of the app is calm
periwinkle. That contrast is the design — one sec is calm until it wants to make you flinch.

### Information architecture

- **Home leads with a list**, not a number: a chronological schedule of blocks, time on the left,
  grouped Today / Tomorrow, with the currently-running block filled in solid periwinkle and
  carrying a progress ring. Large "Block" title, `+` circle top-right.
- **Stats** are the strongest in the category. Three distinct treatments: a months-long area
  chart of open attempts with a gradient stroke; a before/after comparison ("8× attempts/week
  now" vs "128× September 2020") drawn as two labelled bars; and per-app "time saved" cards
  tinted to each platform's own brand hue and stacked in a loose pile.
- **Interrupt state:** hourglass illustration, "Do you still need Instagram?", periwinkle "Close"
  primary and a "Breathing Exercise" text link. Interrogative rather than prohibitive.
- **Rhythm-like feature:** none. The charts are longitudinal (change over months), never
  time-of-day.

### Read

Premium, and the only app here leaning on peer-reviewed evidence as a visual asset — the
Max-Planck seal and a DOI appear on two of six frames. That is a trust play no one else attempts.

---

## Opal

**Store:** [apps.apple.com/us/app/opal-screen-time-control/id1497465230](https://apps.apple.com/us/app/opal-screen-time-control/id1497465230)

### Colour

Measured dominants: `#000000` (8.8%), `#90B0D0` (7%), `#101010`, `#90C0D0`, `#202020`, `#A0C0E0`,
`#B0E0F0`.

| Role | Estimate | Notes |
|---|---|---|
| Background (app) | `#000000` | True black, not near-black |
| Background (marketing) | `#B8D4E4` → `#E6EFF4` | Pale glacial blue gradient |
| Surface | `#0E1012` – `#1A1C1E` | Barely-there elevation |
| Primary accent | `#7FC8E8` ice blue | Score arc, icons, numerals |
| Positive delta | `#2ED598` mint | "▼24m" on Screen Time |
| Negative delta | `#FF3B5C` | "▲15m" on Distracting Apps |

**Light/dark:** hard dark-committed. The pale marketing wrapper is a frame, not the product.

Opal spends real money on rendering: a photographic rock-and-cave environment, an iridescent
opal gemstone that functions as a mascot and collectible, floating 3D shards, and a skeuomorphic
LCD focus timer with a glassy bezel. Only two hues carry the whole system. That restraint plus
that production budget is what "premium" looks like in this category.

### Information architecture

- **Home leads with a number** — a score (85) beneath the gemstone, with sub-scores as pill
  chips. Streak flame (77) and avatar top-right. Tab bar: Home / My Apps / Timer.
- **Stats** use a semicircular gauge for the composite score, then "TODAY'S HIGHLIGHTS" rows:
  a label, a value, a coloured delta, and a horizontal bar carrying an **`AVG` marker chip**
  positioned along the track. That AVG marker is the field's only attempt at "here is you
  versus your own baseline."
- **Blocked state — best copy in the field:** black screen, blurred app icon, "Instagram is
  Blocked by Opal", then *"You set this rule yesterday. Past you was right."* and a single white
  "Dismiss" pill. It resolves the block by invoking the user's own past authority rather than
  the app's. Nothing else here is that well written.
- **Rhythm-like feature:** partial. Notifications fire as "Doomscrolling Alert! 30min on TikTok,
  it's time to relax that thumb" — but these are *reactive* (you have already done it), not
  predictive, and not tied to time of day. The AVG marker is a personal baseline but aggregate.

### Read

The most feature-complete and the best-funded. Also the most complained-about: reviews consistently
cite a near-useless free tier and a $99.99/yr charge landing the day the trial ends
([Blok review](https://www.blok.so/resources/opal-app-review-is-it-worth-100-year-for-screen-time-management),
[Unstar comparison](https://unstar.app/blog/opal-forest-freedom-one-sec-jomo-screen-time-apps-ranked-2026)).
Visual polish does not immunise you against paywall resentment.

---

## Jomo

**Store:** [apps.apple.com/us/app/jomo-screen-time-blocker/id1609960918](https://apps.apple.com/us/app/jomo-screen-time-blocker/id1609960918)

### Colour

Measured dominants: `#FFFFFF` (12%), `#000000` (7%), `#2090FF` (6.2%), `#1080FF`, `#20A0FF`,
plus a long tail of pale blues (`#C0E0FF`, `#E0F0FF`, `#80B0FF`).

| Role | Estimate | Notes |
|---|---|---|
| Background (marketing) | `#2E86FF` → `#4A9EFF` | Photographic sky with lavender-pink clouds |
| Background (app) | `#F2F2F7` | iOS grouped-list grey |
| Surface | `#FFFFFF` | White cards, generous radius |
| Primary accent | `#0A7CFF` | Buttons, status pills, links |
| Streak / urgency | `#FF3B30` → `#FF4D2E` | Flame counts, always in red |
| Success | `#34C759` | Toggles, progress fills |
| Strict mode | `#FF6B2C` | Orange shield, used once |

**Light/dark:** light-committed.

Jomo is the friendliest palette in the field — literally sky and clouds — and it uses a rounded
bubble display face for the wordmark that nothing else here attempts. The cost is that the app
UI underneath is stock iOS blue-on-grey, so the personality lives entirely in the marketing
wrapper and the emoji.

### Information architecture

- **Home leads with a number:** "Screen time / 1h31" set very large, under a date picker, with a
  rainbow-gradient pill reading "✓ Under your 2h goal". Below: a three-up KPI row
  (Decrease ▼5h29 · Pickups 71 · Notifications 21), then the chart, then a "+ Start blocking" CTA.
- **This is the most important screen in the whole research set.** Jomo's stats card plots
  **usage by hour of day** — a 24-bar chart with 12AM / 6AM / 12PM / 6PM on the x-axis and
  0s / 30min / 1h on the y-axis, with small app-icon badges marking peaks. It is the only
  time-of-day visualisation anyone ships.
- **Rules list** is the second screen: cards with an emoji, a name, a status pill
  (Blocking / Upcoming), a time range, and stacked app icons — plus a per-rule streak flame.
- **Blocked state:** blurred content behind, a 3D gold padlock, "You've stayed off Instagram for
  67h15", streak badge (156) in a red pill, blue "I've got this" primary, ghost "Unlock"
  secondary. It reframes the block as an achievement in progress — the loss-aversion play.
- **Unlock friction** is unusually inventive: retype a paragraph of text, or photograph proof of
  a healthy meal for AI verification.
- **Earned screen time:** complete habits (run 4km, clean the room) to unlock minutes. "Clean the
  room to earn 10min on TikTok. That's the deal."

### Read — and the Rhythm implication

Jomo has the raw material for Rhythm and does nothing with it. The hourly chart is *data*, placed
below the fold inside an expandable card, with no interpretation layered on top. It never says
"you scroll most between 9 and 11pm." It never names a window. It never acts on it.

That is the gap. Quiet should not treat "hourly bar chart" as the Rhythm feature — Jomo already
has that and gets no marketing value from it. Quiet's product is the **sentence**, with the chart
demoted to supporting evidence.

---

## SocialLite

**Store:** [apps.apple.com/us/app/sociallite-block-reels-shorts/id6757661674](https://apps.apple.com/us/app/sociallite-block-reels-shorts/id6757661674)

### Colour

Measured dominants: `#FFFFFF` (37.8%), `#F0F0E0` (33.4%), `#000000` (3.2%), then greys.
Two colours account for 71% of every pixel.

| Role | Estimate | Notes |
|---|---|---|
| Background (marketing) | `#F0EDE8` warm cream | With white four-point sparkle motifs |
| Surface | `#FFFFFF` | |
| Grouped background | `#F7F7F5` | |
| Primary accent | `#0A7CFF` | Links, "Connect Another Kid" |
| Toggle on | `#34C759` | Stock iOS green, used heavily |
| Badge | `#E23B3B` | Red "BETA" stickers |

**Light/dark:** light-committed.

### Information architecture

- **Home is a grid** of platform tiles — Instagram, YouTube, X, Snapchat, Facebook, TikTok —
  rendered as glossy 3D versions of each platform's real logo, each with a red BETA sticker.
- Drilling into a platform gives **a nested toggle list**: Block Reels, Block Explore, Hide Ads
  & Suggested, Block Stories, Block Story Ads, Block Saved Posts, Block Feed, DMs Only, Grayscale.
  Two rows are locked to "Always On" with a padlock and a green check.
- Also ships Family Management (child accounts via a 6-character share code).
- **No stats surface at all.** No charts, no numbers, no time data.
- **Blocked state:** none. Content simply does not render — absence rather than interruption.
- **Rhythm-like feature:** none.

### Read

Two things matter here, and both are warnings.

First, the reviews. The published complaint is that onboarding *"is painfully overexplained, the
upselling is relentless,"* and that the app *"walks you through every single step like you're a
toddler"* ([review aggregation](https://appshunter.io/ios/app/sociallite-block-reels-and-shorts/id6757661674/reviews)).
The reviewer's follow-on point is the sharp one: someone downloading an app to reduce phone usage
already knows how to use a phone. The developers have since rebuilt around a 5-tab nav and
smoothed the tutorials.

Second, the logos. SocialLite renders Instagram's, TikTok's and Snapchat's actual marks in glossy
3D as its primary navigation. That is precisely the exposure the founder brief already flags.
Quiet's `constants/colors.ts` currently draws flat marks from scratch — that is the correct call
and should not drift.

**Note on `colors.ts`.** The file currently carries a block commented *"SocialLite-style additions"*:
`switchOn: '#34C759'`, `badgeRed: '#E23B3B'`, `separator`, `groupedBackground`. The layout borrowing
is fine and matches the standing guidance. But `#34C759` and `#E23B3B` are not layout — they are
the two tokens that make SocialLite, ScrollGuard and Unhook all read as preferences panes rather
than products. Detail in Recommendations §2.

---

## ScrollGuard

**Store:** [apps.apple.com/us/app/scrollguard-block-reels/id6754183872](https://apps.apple.com/us/app/scrollguard-block-reels/id6754183872)

### Colour

Measured dominants: `#101010` (30.5%), `#000000` (19.5%), `#202020` (16.1%), `#303030` (9.2%),
`#FFFFFF` (5.5%). **There is essentially no chroma in this app at all** — the highest-ranked
colour with any saturation is `#C0A090` at 0.4%, which is skin tone from a stock photo.

| Role | Estimate | Notes |
|---|---|---|
| Background | `#000000` | |
| Surface | `#2C2C2E` | Stock iOS dark card |
| Text | `#FFFFFF` / `#8E8E93` | |
| Accent | *none* | Toggles are stock iOS; on-state is a white track |

**Light/dark:** dark-committed, monochrome.

### Information architecture

- **Home is a per-platform accordion of toggles.** A centred "ScrollGuard" title, one line of
  instruction, then cards: YouTube (Hide Shorts / Allow 1 Short via Direct Link / Hide Main Feed /
  Hide Subs Tab / Hide suggestions on videos), Instagram (Block Reels / Allow Reels in DMs /
  Hide Main Feed / Hide Stories), and so on. Sub-toggles are indented one level.
- **No stats, no charts, no numbers, no blocked state.** Blocked content is simply absent — the
  Instagram screenshot shows a stories row and then nothing at all below it.
- **Rhythm-like feature:** none.

### Read

Efficient and completely characterless. The marketing frames are strong — pure black, heavy white
Helvetica, black-on-white callout boxes, "Block Brainrot / Not Apps" — but the product behind them
has no visual identity whatsoever. It is the cheapest-looking of the seven iOS apps despite being
competently built, purely because it spends nothing on colour, type, or state design.

---

## Scrolless

**Store:** [apps.apple.com/us/app/scrolless-feed-blocker/id6758870122](https://apps.apple.com/us/app/scrolless-feed-blocker/id6758870122)

> Note: two apps ship under similar names. This analysis covers *Scrolless: Feed Blocker*
> (id6758870122). A separate *Social Media Blocker Scrolless* (id6741134096) also exists.

### Colour

Measured dominants: `#F0F0E0` (48.7% — nearly half of all sampled pixels), then `#101010`,
`#000000`, `#202020`, `#303030`.

| Role | Estimate | Notes |
|---|---|---|
| Background (marketing) | `#F0EAE2` warm linen | |
| Type (marketing) | `#1A1A1A` | Set in an old-style **serif** |
| Background (app) | `#000000` | |
| Surface (app) | `#1C1C1E` | |
| Accent | platform-tinted glyphs only | Each row's icon carries its platform hue |
| Destructive | `#FF3B30` | "Request Disable" |

**Light/dark:** the marketing is warm and light; the app is cold and black. **These are two
different products visually.**

That mismatch is worth dwelling on, because Quiet is at risk of the same thing. Scrolless's store
page promises an editorial, unhurried, warm experience — cream ground, generous serif, "Block feeds,
Not your friends." Then you install it and get a black list of nine platform rows. The store page
is writing a cheque the app does not cash.

### Information architecture

- **Home is a list** of nine platforms (Bluesky, Facebook, Instagram, LinkedIn, Reddit, Threads,
  TikTok, Twitter/X, YouTube) plus "Add Platform". Settings gear left, `+` right.
- **No stats surface.**
- **Blocked state — best in the field for the *user's* experience:** a full-bleed landscape
  photograph (a mountain, a desert sunset, Mt Fuji), "Page Blocked by Scrolless" in white, a
  white pill offering a **constructive destination** — "Go to Search", "Go to Communities",
  "Go to Explore", chosen per context — and a ghost "Go Back". It replaces a feed with a view,
  and it always offers somewhere else to go rather than just refusing.
- **Anti-impulse friction:** disabling requires a 12-hour waiting period, presented as a dark
  modal with a red "Request Disable" and a neutral "Cancel". Marketed as "The 12 hour rule.
  No impulsive off switch."
- **Rhythm-like feature:** none.
- Positions on privacy and pricing: "No account. No tracking. No ads." One-time purchase,
  no subscription.

### Read

The closest thing in this field to Quiet's intended tone — and the clearest demonstration that
cream-plus-serif is no longer unclaimed territory in this category. Also the clearest lesson in
carrying your tone all the way into the product.

---

## Freedom

**Store:** [apps.apple.com/us/app/freedom-screen-time-control/id1269788228](https://apps.apple.com/us/app/freedom-screen-time-control/id1269788228)

### Colour — read this section carefully

Measured dominants: `#FFFFFF` (9.9%), **`#608060` (8.1%)**, `#F0F0F0`, **`#E0F0E0` (6.4%)**,
**`#407050` (6%)**, `#C0D0C0`, `#508060`, `#508050`, `#80B080`, `#507050`, `#609060`, **`#306040`**.

Eight of the top twelve buckets are greens. This is the most single-hue-committed app in the field.

| Role | Estimate | Notes |
|---|---|---|
| Background (marketing) | `#3E6B48` → `#4F7D57` | Forest green with heavy grain texture |
| Display type | `#F2F0E4` cream | Set in a chunky bracketed **serif** |
| Background (app) | `#E4EDE0` → `#DCE9D8` → `#FFFFFF` | Pale sage gradient down to white |
| Text | `#2C4A33` dark green | Not black — green-black |
| Primary accent | `#6F9B76` / `#7BA882` | Pill buttons, active dots |
| System CTA | `#0A84FF` | Only in stock iOS alert dialogs |

**Light/dark:** light-committed, and warm-light rather than white-light.

### Information architecture

- **Home leads with a CTA, not a number.** Butterfly mark, gift and help icons, "Good Morning /
  Have a great day!", then a full-width "START A SESSION" pill. Below it: an **Active** section
  (session card, green dot, "13 minutes left", "1 device, 1 blocklist") and a **Scheduled**
  section ("Evening Decompression — Starts at 9PM", "Lunch Break — Starts at 1PM").
- **Sessions** screen: NOW / LATER / RECURRING segmented control, then "Recommended Sessions" —
  Focused Work (9–5 weekdays), Deep Work Mornings, Better Sleep (9PM–7AM), All Day, Custom Schedule.
  Each with a line-drawn icon.
- **Blocklists** screen: named lists ("Social Media — 5 iOS apps, 12 MacOS Apps") with padlock
  and overflow.
- Session length picker: a scatter of pills — 15 MIN, 25 MIN, 1 HR, 2 HRS, 5 HRS, 24 HRS, CUSTOM.
- **No stats surface appears in any of the six screenshots.** No charts, no scores, no time saved.
- **Blocked state:** solid green field, white butterfly, *"You are free. Go do great things."*
  with "Instagram is blocked by Freedom" beneath in smaller type. The most positively-framed
  block screen in the field, though also the most generic.
- **Rhythm-like feature:** none — but note "Evening Decompression, starts at 9PM". That is a
  *user-authored* recurring session with a human name. It looks like a detected pattern and is not
  one. The naming convention is worth stealing even though the intelligence behind it does not exist.

### Read — the strategic problem for Quiet

Freedom is 4M+ users, App Store Editors' Choice, and it owns:

- forest green as the brand hue (`#407050`, `#306040`)
- pale sage as the app background (`#E0F0E0`)
- cream as the type colour on green (`#F2F0E4`)
- a warm serif as the display face
- calm, permission-giving copy

Quiet's declared palette is `#1B4D3E` primary, `#E8F0EE` primarySubtle, `#FAFAF7` cream background.
`#E8F0EE` and Freedom's measured `#E0F0E0` are the same colour to any normal viewer. `#1B4D3E` is
Freedom's green pushed darker and a few degrees bluer. Quiet is not adjacent to Freedom's identity —
it is inside it, and Freedom got there first with two orders of magnitude more users.

This is the most consequential finding in this document. Detail in Recommendations §1.

---

## Unhook (Chrome extension)

**Store:** [chromewebstore.google.com/detail/unhook-remove-youtube-rec/khncfooichmfjbepaaaebmommgaepoid](https://chromewebstore.google.com/detail/unhook-remove-youtube-rec/khncfooichmfjbepaaaebmommgaepoid)
· Featured · 4.9 (4.4K ratings) · 1,000,000 users · v1.6.9, updated March 2026 · free, donation-supported

> Sourcing note: the Chrome Web Store carousel is JS-rendered, so the static HTML only yielded
> promo tiles belonging to *related* extensions. I loaded the listing in a browser and pulled the
> five genuine screenshots from the live DOM. The first set I downloaded was discarded as
> mis-attributed.

### Colour

Measured dominants: `#101010` (29.3%) and `#202020` (13%) — that is YouTube's own dark UI, not
Unhook's. Unhook's own contributions are the marketing bands: `#E0C0C0` (15.6%) dusty pink and
`#F0E0D0` (10.6%) tan, with `#FFFFFF` (7.3%) for the popup.

| Role | Estimate | Notes |
|---|---|---|
| Popup background | `#FFFFFF` | With a light/dark toggle in the header |
| Toggle on | `#1A73E8` | Google blue |
| Toggle off | `#DADCE0` | |
| Brand mark | `#E5202B` | Red play-button-with-scissors |
| Marketing bands | `#E8C8C8` dusty pink, `#F0E0D0` tan | Black Poppins-style bold display |

### Information architecture

- **The entire product is one popup panel of toggles.** Header ("Unhook", contrast toggle, power
  button), then twenty-plus rows: Hide Home Feed → Redirect to Subscriptions (indented) → Hide
  Video Sidebar → Hide Recommended / Hide Live Chat / Hide Playlist / Hide Fundraiser (indented)
  → Hide End Screen Feed → Hide End Screen Cards → Hide Shorts → Hide Comments → Hide Mixes →
  Hide Merch, Tickets, Offers… and it keeps scrolling. Footer: Donate | Request Feature | Support.
- No hierarchy beyond one level of indent. No primary action. No summary of current state. No
  stats. No blocked state — hidden elements simply do not render.
- **Rhythm-like feature:** none.

### Read

The founder brief's "2014 checkbox list" characterisation is accurate and, viewed directly, generous.
There is no state summary, no default preset, no sense of what the user has actually configured —
just an undifferentiated scroll of switches, all styled identically regardless of impact. Hiding
the entire home feed and hiding the fundraiser banner are given exactly the same visual weight.

And yet: 1M users, 4.9 stars, Featured. **Visual quality is not what wins this category — it is
what lets you charge for it.** Unhook is free. Quiet is not, and that is precisely why it cannot
look like this.

---

# Synthesis

## What the category converges on — the four clichés

**1. The wellness gradient.** Cool blue/teal/purple on a dark ground with a glowing focal object.
Opal (ice blue on black, luminous gemstone) and one sec (periwinkle-teal on navy) both do it. It
reads premium and mindful, and it is the default choice for any funded app in this space.
*Quiet already avoids this. Keep avoiding it.*

**2. iOS-default green toggles on white.** SocialLite, ScrollGuard, Unhook (blue variant). The
instant signal that you are looking at a settings screen someone shipped as a product.
*Quiet's `colors.ts` currently imports this exact token.*

**3. Big number plus streak flame.** Opal (score 85, flame 77), Jomo (1h31, flame 156, per-rule
flames). Gamified-habit-app grammar, borrowed wholesale from Duolingo. Effective and completely
generic, and it forces you to compete on data volume — which a new app always loses.

**4. Cream plus serif — the newest cliché, and the one Quiet is standing in.** Scrolless
(`#F0F0E0` at 48.7% of pixels, old-style serif) and Freedom (cream serif on forest green) have both
made the "calm editorial" turn. SocialLite's marketing cream measures at the identical `#F0F0E0`.
Cream is no longer a differentiator in this category; it is the indie-blocker default wrapper.

## Calm versus anxious — and why

Three levers, in order of strength:

**Saturation is the primary signal.** Freedom's `#608060` sits around 25% saturation and reads
institutional and safe. one sec's interrupt gradient starts at `#FF1B6B`, roughly 90% saturation,
and reads as an alarm. Same job — tell the user something about their behaviour — opposite
physiological response. Below about 35% saturation, a hue reads as an environment. Above about
70%, it reads as a warning regardless of which hue it is.

**Contrast ratio sets the urgency.** Scrolless's marketing is `#1A1A1A` on `#F0EAE2` — high enough
to read comfortably, low enough to feel like paper rather than a screen. Opal's `#7FC8E8` on
`#000000` is a very high-contrast pairing and feels clinical and alert even though the hue itself
is placid. **Cream backgrounds do most of the calming work not through hue but by lowering
maximum contrast.** This is Quiet's real asset and it is worth protecting: pure `#FFFFFF` surfaces
sitting on `#FAFAF7` partly discard it.

**Warm versus cool sets the relationship.** Warm and desaturated (cream, sage, ochre) reads as
domestic and forgiving — the app is on your side. Cool and desaturated (ice blue, slate) reads as
clinical and objective — the app is measuring you. Cool and saturated (`#2090FF`) reads as generic
consumer tech. Warm and saturated (magenta, orange-red) reads as urgent.

The category default is *cool*, because measurement feels authoritative. Quiet's cream-and-gold is
*warm*, which positions it as an ally rather than an instrument. That instinct is right — the
execution is what needs work.

## Home screens: what each leads with

| App | Leads with | Notes |
|---|---|---|
| one sec | List | Chronological block schedule |
| Opal | Number | Score 85 + mascot + sub-scores |
| Jomo | Number | Screen time 1h31 + goal pill + hourly chart |
| SocialLite | Grid | Platform tiles → nested toggles |
| ScrollGuard | List | Toggle accordion |
| Scrolless | List | Platform rows |
| **Freedom** | **CTA** | Greeting + START A SESSION + Active/Scheduled |
| Unhook | List | Toggle panel |

Five of eight lead with a list, two with a number, one with a CTA. **Freedom is the only app whose
home screen is an invitation to act rather than a report on the past** — and it is also the only
one that never risks showing a new user an empty chart.

## How time data is presented

| Treatment | Who | Notes |
|---|---|---|
| Semicircular gauge | Opal | Composite score only |
| Bar with `AVG` marker + delta chip | Opal | Personal baseline, aggregate |
| **24-hour bar chart** | **Jomo** | **The only time-of-day view in the field** |
| Longitudinal area chart | one sec | Months, gradient stroke |
| Before/after comparison bars | one sec | "8× now vs 128× then" |
| Brand-tinted "time saved" cards | one sec | Per-platform |
| Plain KPI row | Jomo | Decrease / Pickups / Notifications |
| **Nothing at all** | **Freedom, SocialLite, ScrollGuard, Scrolless, Unhook** | Five of eight |

Five of eight ship no stats surface whatsoever. Statistics are the premium behaviour-change signal,
not table stakes.

## The Rhythm question

**No competitor detects, names, or acts on a personal time-of-day risk window.** Closest approaches,
in order:

1. **Jomo** plots usage by hour of day — the raw material — but never interprets it. No peak
   called out, no window named, no action attached. It sits below the fold in a collapsible card.
2. **Opal** has an `AVG` marker comparing you to your own baseline, but aggregate rather than
   hourly, and a "Doomscrolling Alert!" that is reactive rather than predictive.
3. **Freedom** ships a *user-authored* recurring session that a user has chosen to call "Evening
   Decompression, starts at 9PM". It has the vocabulary of a detected pattern with none of the
   detection.

The concept is genuinely unoccupied. The *visualisation* is not — Jomo owns hourly bars. See
Recommendations §6.

## Blocked and limit-reached states — two philosophies

**Interruption** (one sec, Opal, Jomo, Freedom, Scrolless) — a full screen with a mark, a message,
and one or two actions. Every one of these apps puts its entire personality here. It is the most
designed screen in each product.

**Absence** (ScrollGuard, SocialLite, Unhook) — blocked content simply does not render. Cheaper to
build, less irritating in daily use, but it surrenders the one moment where the product can speak,
and it makes the value invisible — the user never sees what was prevented.

Dissecting the interruption screens, each strong one does exactly one thing well:

| App | Does well | Missing |
|---|---|---|
| Opal | **Reason** — "You set this rule yesterday. Past you was right." | Nowhere to go, no progress |
| Scrolless | **Destination** — "Go to Search" / "Go to Communities" | No reason, no progress |
| Jomo | **Progress** — "You've stayed off Instagram for 67h15" | No reason, nowhere to go |
| Freedom | Tone — "You are free. Go do great things." | Generic; none of the three |
| one sec | Friction — breathing exercise | Interrogative, mildly nagging |

**No competitor combines reason, destination, and progress in one screen.** That combination is
available and it is cheap to build.

## Onboarding and paywall placement

> **Confidence: low-to-moderate.** Onboarding flows are not visible in store screenshots.
> Everything below is secondary-sourced from published reviews and store pricing metadata.
> Screen counts are not reliably available for any app and I have not invented them.

| App | Pricing (as listed) | Reported paywall behaviour |
|---|---|---|
| Opal | $99.99/yr, $19.99/mo | Free tier reported as near-useless; onboarding includes a "years of your life" projection (fear framing); charge lands the day the trial ends |
| Jomo | $5.99/mo · $29.99/yr · $59.99 lifetime | Scheduled sessions, app groupings and insights all paywalled — reviews note the free version is not the version that changes behaviour |
| one sec | ~$2.99/mo · ~$19/yr · ~$50 lifetime | Reviews call $20/yr steep "once the novelty wears off" |
| SocialLite | Free; Pro $3.99/mo | Onboarding "painfully overexplained"; upsell "relentless"; since redesigned to 5-tab nav |
| ScrollGuard | Free; IAP $3.99–$59.99 | Unlimited custom filters gated |
| Freedom | Subscription | Not established from sources reviewed — not asserted |
| **Scrolless** | **One-time purchase** | **"No account. No tracking. No ads." — advertised on the store page as positioning** |
| Unhook | Free, donations | No paywall |

The pattern across reviews is consistent enough to state plainly: **ratings are high in week one
and collapse in week three, when trials convert.** The complaint is almost never about the product
working — it is that a blocker should not cost what a streaming service costs. Scrolless is the
only app treating that resentment as a positioning opportunity rather than a cost of doing business.

## Attract versus repel

**Reads premium:**
- A display typeface that is not the system font. Freedom's serif, Scrolless's serif, Jomo's
  rounded bubble, Opal's tight grotesque. This is the strongest single signal and the cheapest
  to acquire.
- Rendered or photographic depth — Opal's cave and gemstone, Jomo's sky, Scrolless's landscapes.
  Reads as budget, therefore as a real team.
- Restraint in accent count. Opal carries a whole product on two hues; Freedom on one.
- Copy with a voice. "Past you was right." "You are free. Go do great things."
- Type set at genuinely large sizes with room around it.

**Reads cheap:**
- Stock iOS toggle rows as the primary screen (Unhook, ScrollGuard, SocialLite).
- Competitor logos rendered in glossy 3D (SocialLite) — looks like an affiliate page, and carries
  the trade-dress exposure the founder brief already flags.
- Red "BETA" stickers on shipping features (SocialLite) — advertises incompleteness on the home screen.
- More than three accent hues in one system.
- Undifferentiated visual weight across controls of wildly different consequence (Unhook).
- **Store frames whose visual language does not match the app inside** (Scrolless: warm cream
  editorial outside, cold black list inside). This produces a specific kind of week-one
  disappointment that no feature can fix.

---

# Recommendations for Quiet

Current tokens: background `#FAFAF7` · surface `#FFFFFF` · primary `#1B4D3E` · primarySubtle
`#E8F0EE` · accentGold `#C89B3C` · textPrimary `#1A1A1A` · Inter throughout.

### 1. Move the primary off Freedom's axis — gold is the differentiator, not green

The measured overlap with Freedom is not a near-miss:

| Token | Quiet | Freedom (measured) |
|---|---|---|
| Primary green | `#1B4D3E` | `#407050`, `#306040` |
| Pale green surface | `#E8F0EE` | `#E0F0E0` |
| Cream | `#FAFAF7` | `#F2F0E4` (as type colour) |

Meanwhile **not one of the eight competitors uses a warm metallic, ochre, amber or gold as a
primary or secondary accent.** Jomo has orange inside a gradient pill and a red-orange flame;
that is the entire field's use of warm accent colour. `#C89B3C` is the single most differentiated
token Quiet owns and it is currently classified as a tertiary.

Recommended: **promote gold to primary brand carrier and demote green to a semantic role**
(active / safe / protected state only). Then move the ground colour away from Freedom's sage:

- Keep `#FAFAF7` as background but introduce a warmer second surface — around `#F2EDE3` — instead
  of pure `#FFFFFF`, so cards sit *warmer* than the ground rather than colder. This also recovers
  the low-max-contrast advantage that white surfaces currently discard.
- Replace `primarySubtle #E8F0EE` (Freedom's sage) with a gold-tinted tint such as `#F5EBD6`.
- If green is retained as primary, push it off the forest axis toward a darker, warmer olive-ink
  (`#26301F`) or a near-black warm brown (`#2A241C`), so the brand pairing reads
  *ink-and-gold*, not *green-and-sage*.

Ink-and-gold on warm cream is unoccupied in this category and is a harder look to dismiss as
derivative.

### 2. Delete `switchOn: '#34C759'` and `badgeRed: '#E23B3B'`

These two tokens are the specific mechanism by which SocialLite, ScrollGuard and Unhook read as
preferences panes. Two further problems:

- `#34C759` is a second, unrelated green sitting next to `primary #1B4D3E`. Two greens in one
  interface reads as an accident every time.
- A red badge on the home screen is the SocialLite "BETA sticker" pattern — it advertises
  incompleteness.

Use the primary for switch-on states and `accentGold` for badges. The standing guidance to copy
SocialLite's *layout* and never its *visual style* is right; these two tokens are visual style,
and they are the exact two that carry the cheapness.

### 3. Resolve the `warning` / `accentGold` collision

`warning #E8A54A` and `accentGold #C89B3C` are close in hue and will be confusable at small sizes —
a warning state and a brand accent must never be mistakable for each other. If gold becomes the
brand carrier this becomes urgent. Move warning to a burnt orange around `#B4571E`, or drop the
warning token entirely and let `destructive #D45A5A` carry all alert states.

### 4. Add one display typeface — the highest-leverage change available

Inter everywhere is the visual equivalent of not choosing. Every competitor that reads premium has
a display face with a point of view; every one that reads cheap uses the system font at default
weights.

Keep Inter for UI, labels, and body. Add **one** display face used in no more than four places:
the home headline, the Rhythm window statement, the block screen, and the paywall. A warm humanist
or low-contrast transitional serif suits cream-and-gold. Note that Freedom and Scrolless use serif
in *marketing only* — their in-app type is stock sans. **Carrying an editorial face into the
product is open territory,** and it is the fix for exactly the store-page-versus-app mismatch that
Scrolless suffers from.

### 5. Build the block screen as reason + destination + progress

No competitor combines all three. The composition:

- Full-bleed warm cream. Never red, never a red number — shame reads as urgency and urgency is what
  the user is trying to escape.
- **Reason**, in the display face, invoking the user's own past decision — the Opal pattern, which
  is the best-written thing in the category.
- **Destination** — one primary action that goes somewhere useful, the Scrolless pattern. Not
  "Dismiss". Something like "Open Messages" or "Back to what you were doing".
- **Progress** — a small, quiet figure, the Jomo pattern, in gold rather than a red streak pill.
- A single thin gold rule as the only ornament.

### 6. Rhythm: ship the sentence, not the chart

Jomo already ships the hourly bar chart and extracts no marketing value from it, because a chart is
data and users do not act on data. Quiet's product is the **interpretation**.

- Lead with a named, specific statement: *"Your window is 9:40–11:15pm."* One line, display face,
  on the home screen.
- Demote the hourly strip to small supporting evidence beneath it — a slim 24-cell band with the
  window highlighted in gold, not a full axis-and-gridline chart. Do not ship Jomo's chart.
- **Give the window a persistent proper name in the UI** and let the user rename it. Freedom
  demonstrates that human-named windows ("Evening Decompression") feel like intelligence even when
  they are entirely manual — Quiet's would be genuinely detected, so the effect should be stronger.
- Attach exactly one action to the window (protect it, or be asked at the start of it).

### 7. Home should lead with a CTA and current state, not a number

Following Opal and Jomo into big-number-on-home means competing on data volume against apps with
years of it, and it guarantees a broken-looking day-one experience — Rhythm needs roughly a week
before it can say anything.

Freedom's structure is the right model for a small app: greeting → primary CTA → Active → Scheduled.
It never shows an empty chart and it never looks broken on install. Add Rhythm's window statement
into that structure once it exists, with an honest pre-detection state ("Learning your rhythm —
about four more days") rather than a zeroed chart.

### 8. Define dark-mode tokens now, even if light ships first

Light-committed is defensible — Freedom and Jomo, the two warmest-feeling apps here, are both
light. But half the category is dark and "no dark mode" is a predictable review complaint. Cream
inverts badly if handled carelessly, so decide deliberately rather than letting `#FAFAF7` become
`#000000`:

- background `#16150F` (warm near-black, never pure `#000` — pure black is Opal's and ScrollGuard's)
- surface `#201E17`
- `accentGold #C89B3C` holds on dark without modification, which is another argument for promoting it
- lift primary to roughly `#6E9B84` for contrast compliance

### 9. Keep drawing platform marks from scratch — and desaturate them at rest

The existing flat `BRAND` marks are the correct call and should not drift toward SocialLite's
glossy 3D reproductions. One improvement available: render platform icons **monochrome at rest and
in colour only when active**. Every competitor lets eight saturated brand hues fight their own
palette on the main screen. Quiet showing a calm monochrome list that gains colour only where
something is live would look more considered than anything in this set — and it further reduces
trade-dress exposure.

### 10. Make the pricing model part of the visual identity

The category's most reliable repel signal is the paywall: Opal's $99.99 charge at trial end and
SocialLite's relentless upsell are the two loudest complaints in the field, and both apps are
otherwise well-built. Scrolless is the only one treating this as an opportunity, and it puts
*"No account. No tracking. No ads."* directly on its store page — a positioning claim rendered as
typography.

For a solo developer this is close to free to adopt and hard for funded competitors to match.
Concretely: **let Rhythm produce its first window before any paywall.** The feature needs about a
week of data to say anything — that week *is* the trial, it is honest, and it means the paywall
arrives immediately after the moment of first real value rather than before it. That is the exact
inversion of Opal's model, and it is the strongest argument the app can make about whose side
it is on.

---

## Appendix — sources

App Store listings: [one sec](https://apps.apple.com/us/app/one-sec-screen-time-focus/id1532875441)
· [Opal](https://apps.apple.com/us/app/opal-screen-time-control/id1497465230)
· [Jomo](https://apps.apple.com/us/app/jomo-screen-time-blocker/id1609960918)
· [SocialLite](https://apps.apple.com/us/app/sociallite-block-reels-shorts/id6757661674)
· [ScrollGuard](https://apps.apple.com/us/app/scrollguard-block-reels/id6754183872)
· [Scrolless](https://apps.apple.com/us/app/scrolless-feed-blocker/id6758870122)
· [Freedom](https://apps.apple.com/us/app/freedom-screen-time-control/id1269788228)
· [Unhook](https://chromewebstore.google.com/detail/unhook-remove-youtube-rec/khncfooichmfjbepaaaebmommgaepoid)

Review and comparison sources:
[Blok — Opal review](https://www.blok.so/resources/opal-app-review-is-it-worth-100-year-for-screen-time-management)
· [Unstar — 5 screen time apps ranked](https://unstar.app/blog/opal-forest-freedom-one-sec-jomo-screen-time-apps-ranked-2026)
· [Screen Time Index — Opal vs Jomo](https://screentimeindex.com/posts/opal-vs-jomo/)
· [AppsHunter — SocialLite reviews](https://appshunter.io/ios/app/sociallite-block-reels-and-shorts/id6757661674/reviews)
