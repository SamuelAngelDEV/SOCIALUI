# Visual Direction — Ink, Paper, Brass

> **Status.** Proposal. One direction, argued for. Builds on `02-competitor-ui-analysis.md`
> (competitor palettes, the Freedom-overlap problem, the cream-and-serif cliché) rather than
> repeating it.
>
> **Method.** Part 1 is a literature pass with every claim labelled by evidence strength.
> Part 2 is direct visual inspection — 22 Dribbble shots across seven tags were downloaded and
> viewed, plus published design-token extractions for the non-category references. Part 4's
> contrast ratios are **computed**, not estimated: WCAG 2.x relative-luminance maths, run in
> `node`, every pair in the tables below. Downloaded images live in the session scratchpad only
> and are deliberately not committed — this repo is public and those are third-party assets.
>
> Run date: 2026-07-30.

---

## The one-paragraph version

Quiet's differentiator is not a colour, it is an **absence of colour**. Every app in the category
solves "look calm" by picking a calm *hue* — Opal's ice blue, one sec's periwinkle, Freedom's
forest green, the whole Dribbble mindfulness genre's lavender gradient. Hue is the weakest of the
three levers the evidence actually supports; **saturation and contrast are the strong ones**. So
the direction is: a near-achromatic warm system — plaster ground, ink type, hairlines — carrying
**exactly one chromatic accent**, a deep brass, at roughly five percent of screen area. Green
survives only as a 6px state dot. The primary button is ink, not brass, which solves gold's fatal
contrast problem while keeping gold as the thing people remember. This is Linear's structural move
(one accent hue on a near-monochrome ground) executed in warm light rather than cold dark, and it
is unoccupied in the blocker category — nobody there has the nerve to ship a product with almost
no colour in it.

---

# Part 1 — Colour and human response, sorted by what actually holds up

Three labels are used throughout:

- **WELL-SUPPORTED** — perceptual, physiological or standards facts with converging evidence, or
  hard thresholds in a normative standard.
- **MIXED/CONTESTED** — a real literature exists, effects are small, context-dependent, or the
  direction of causation is unclear.
- **FOLKLORE** — repeated constantly in design writing; no adequate source, or the source says
  something different from what it is cited for.

## 1.1 The claims that are actually solid

### WCAG contrast thresholds — WELL-SUPPORTED (normative, not psychological)

WCAG 2.2 Level AA requires **4.5:1** for normal text, **3:1** for large text (≥18pt, or ≥14pt
bold), and **3:1** for non-text UI components and graphical objects that convey information
(SC 1.4.3, 1.4.11). These are legally operative — ADA Title II, Section 508, EN 301 549 in the EU.
They apply symmetrically to dark-on-light and light-on-dark.

Worth knowing so you don't get talked into it: **APCA is not a standard.** WCAG 3.0 is a Working
Draft with no expected Recommendation before roughly 2029; visual contrast was pulled out of the
draft in July 2023 and as of the 2026 drafts the WCAG 3 contrast algorithm is still listed as
undetermined. APCA remains exploratory. Build to WCAG 2.2 AA; treat APCA as a sanity check on
light-on-dark pairs, where WCAG 2.x is known to be over-permissive, not as the target.
([W3C status summary](https://web-accessibility-checker.com/en/blog/wcag-3-0-guide-2026-changes-prepare),
[WCAG 2.2 1.4.3](https://callingallminds.com/resources/wcag/1.4.3-contrast-minimum))

### Saturation drives arousal more reliably than hue does — WELL-SUPPORTED

Valdez & Mehrabian (1994) is the study everyone half-remembers. What it actually reports is that
**brightness and saturation carry the effect and hue barely does**: regression on their data gives
arousal ≈ −0.31·Brightness + 0.60·Saturation, with hue effects "weak" by comparison. Higher
saturation → higher rated arousal; higher brightness → lower arousal and higher pleasure.
([Valdez & Mehrabian, *J. Exp. Psychol. Gen.*](https://www.semanticscholar.org/paper/Effects-of-color-on-emotions.-Valdez-Mehrabian/d15bdf485f3a64abb59e4d0d1d1b18a9fc652bf9);
replicated in structure by [Wilms & Oberfeld 2018](https://www.staff.uni-mainz.de/oberfeld/downloads/Wilms-Oberfeld2018_Article_ColorAndEmotionEffectsOfHueSat.pdf))

This is the single most load-bearing finding for Quiet, and it points somewhere counterintuitive:
**arguing about which hue is calm is arguing about the weakest variable.** A desaturated red is
calmer than a saturated blue. The prior document's field observation agrees — Freedom's `#608060`
at ~25% saturation reads institutional; one sec's `#FF1B6B` at ~90% reads as an alarm.

Note the second term honestly: Valdez & Mehrabian also found *darker* colours more arousing at
equal saturation. That is an argument for a light-mode-first product, and against the category's
dark-committed default.

### Melanopic irradiance, not "blue light", is the evening variable — WELL-SUPPORTED

The mechanism is real: intrinsically photosensitive retinal ganglion cells containing melanopsin,
peak sensitivity around 480nm, project to the suprachiasmatic nucleus and suppress pineal
melatonin. Evening display exposure lengthens sleep latency and delays melatonin onset **as a
dose-dependent function of melanopic irradiance** — not of how "blue" the screen looks.
([*Communications Biology* 2023](https://www.nature.com/articles/s42003-023-04598-4))

The practical consequence is usually stated backwards by designers. Melanopic irradiance is
dominated by **total emitted light**, so overall screen luminance and how much of the screen is
bright matters more than accent hue. A mostly-white app at full brightness at 11pm delivers more
melanopic stimulus than a mostly-dark app with a blue accent.

Two honest caveats: the blue-blocking-glasses literature is much weaker than the mechanism
([2025 meta-analysis of actigraphic outcomes](https://pmc.ncbi.nlm.nih.gov/articles/PMC12668929/)
finds unimpressive effects), and there is
[preliminary evidence that red light at night induces alertness too](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2744917/) —
so "warm = circadian-safe" is itself oversold.

**What Quiet should take from this, and only this:** the evening screen — the block screen, the
Rhythm window, whatever fires at 10pm — should be *low total luminance*. Not "warm-tinted".
Dimmer. This is a real, defensible reason for Quiet to ship a genuine dark mode rather than a
palette-inverted one, and to consider a scheduled auto-dim tied to the user's detected window.
It is not a reason to claim the app protects anyone's sleep, and we should never say that.

### Light-on-dark costs legibility for a large minority — WELL-SUPPORTED (with caveats)

Positive polarity (dark text on light) generally produces better proofreading performance and
smaller pupil size than negative polarity. The mechanism is halation: a dilated pupil admits more
oblique rays, so uncorrected refractive error — astigmatism especially — smears the edges of light
glyphs on dark grounds. ([BOIA summary](https://www.boia.org/blog/dark-mode-can-improve-text-readability-but-not-for-everyone),
[Walter, dark-mode accessibility](https://stephaniewalter.design/blog/dark-mode-accessibility-myth-debunked/))

Caveat, stated plainly: the polarity advantage is **not universal**. Users with photophobia,
migraine, or some low-vision conditions read better in dark mode, and
[contrast-polarity effects vary by age group](https://arxiv.org/pdf/2409.10841). "Dark mode is more
accessible" is a myth; so is "light mode is more accessible". Ship both, default to light, and
make the dark theme genuinely designed rather than inverted.

Direct consequence for the dark palette below: **do not use pure white text on pure black.**
`#FFFFFF` on `#000000` is 21:1 and maximises halation. Warm off-white on warm near-black lands
around 15:1, which is still AAA and visibly kinder.

### Colour-vision deficiency — WELL-SUPPORTED

Red–green deficiency (protan/deutan) affects roughly 8% of males of northern-European descent.
Blue/orange is the most robust hue pair across all three CVD types. Wong/Okabe-Ito is the standard
safe categorical set. But the important point for Quiet is the one designers skip: **many
CVD-safe palettes are safe by hue separation and collapse in greyscale.** Encoding by *lightness*
is safe for every CVD type including achromatopsia, and it is the only encoding that also survives
screenshots, printing, and low-quality displays.
([Accessible colour sequences for dataviz, arXiv 2107.02270](https://arxiv.org/pdf/2107.02270))

Quiet's data surface is a single measure — minutes, by hour. It has no categories. So it does not
need a categorical palette at all, and every decision below encodes with **height and lightness,
never hue**.

## 1.2 The claims that are contested

### "Colours are systematically associated with emotions" — MIXED/CONTESTED, and weaker than the headlines

The best current source is a 2024 systematic review in *Psychonomic Bulletin & Review*: 132
peer-reviewed articles, 1895–2022, 42,266 participants, 64 countries. It reports systematic
colour–emotion correspondences — yellow/joy, black/sadness, light colours positive, dark negative.
([Springer](https://link.springer.com/article/10.3758/s13423-024-02615-z))

Read the actual conclusion, not the press release. The authors state that correspondences are
mostly **many-to-many** and that effects are **driven by lightness, saturation and hue** — with
lightness and saturation doing the work, exactly as in §1.1. "Association" here means what people
*report* when asked to match a colour chip to an emotion word. It does not establish that showing
someone a colour in an interface *induces* that emotion, and it does not license "our green makes
users feel calm".

### "Colour affects cognition and behaviour" (red/blue priming) — MIXED, leaning FOLKLORE

Mehta & Zhu (2009) in *Science* — red enhances detail-oriented tasks, blue enhances creative ones —
is the origin of most "red means X" design copy.
[It failed to replicate](https://link.springer.com/article/10.3758/s13423-013-0548-3) in
*Psychonomic Bulletin & Review*. Do not cite it. Do not cite anything derived from it.

### "Warm colours feel domestic, cool colours feel clinical" — MIXED

The prior document asserts this and it matches what I observed across 22 Dribbble shots and eight
competitors. But it is a **design-community consensus and an aesthetic judgment**, not a finding.
It is being used below because the observation is consistent and the risk of being wrong is low —
not because it is evidence.

## 1.3 The folklore

| Claim | Verdict | What is actually true |
|---|---|---|
| "Blue conveys trust" | **FOLKLORE** | No adequate source exists. Blue dominates corporate identity for historical and printing reasons and because it is the safest hue under CVD. The trust attribution is post-hoc. |
| "Google's 41 shades of blue earned $200M" | **FOLKLORE (the number), TRUE (the test)** | The test happened — Google was reconciling two different blues between Search and Gmail and tested the range between them; Doug Bowman left over the culture and wrote about it. The **$200M figure is not attributable to that test**, is repeated without a primary source, and [the framing has been picked apart](https://www.insights4print.ceo/2022/02/the-google-41-shades-of-blue-test-is-fundamentally-flawed/). Never use the number. |
| "Red increases urgency by N%" / "red CTAs convert X% better" | **FOLKLORE — unsourced** | Traces to a handful of uncontrolled A/B posts where the red button was also the *higher-contrast* button. The variable was contrast, not hue. |
| "Colour improves brand recognition by 80%" | **FOLKLORE — unsourced** | Circulates with no traceable primary study. Do not repeat. |
| "Blue light from screens damages your eyes" | **FOLKLORE** | Distinct from the circadian claim in §1.1, which is real. There is no good evidence of retinal damage at display irradiance levels. |
| "Colours lower heart rate / cortisol" | **UNSOURCED as stated** | Turns up constantly in wellness-app design writing, including in sources found for this document. I could not source it and it should not be repeated. |
| "Yellow causes anxiety / babies cry more in yellow rooms" | **FOLKLORE** | Attributed to a nonexistent study. Genuinely fabricated. |

## 1.4 What this means for an anti-addictive product — the thesis

The engagement palette is a real, describable thing, and it is describable in the *supported*
variables rather than the folklore ones:

1. **High chroma** — saturated fills, brand gradients, category-coded icons. Raises arousal
   (§1.1). Instagram, TikTok, Snapchat all live here.
2. **High local contrast on interruptive elements** — red badges, unread dots, streak flames.
   Contrast is what drives salience; the red is incidental.
3. **Many competing accent hues at once**, so no region of the screen can be ignored.

A blocker that adopts any of the three is arguing against itself. So the negative space of the
product thesis is precise, and it is not "use calm colours":

- **Keep global saturation low.** Under ~30% HSL saturation for anything covering area.
- **Reserve high local contrast for exactly one element per screen**, and make that element the
  user's own chosen action — never a notification, never a count, never a shame number.
- **One accent hue. Total.** Not three.
- **Do not encode anything with red.** No red streak pills, no red badges, no red numbers.
  `destructive` exists for one thing: confirming that the user is about to disable their own
  protection.
- **Lower maximum contrast, not average contrast.** This is the counterintuitive one and it is
  where the prior document was right: a paper ground calms by pulling the top of the luminance
  range *down*, not by tinting anything. Pure `#FFFFFF` surfaces on a near-white ground throw
  that away for no gain.

---

# Part 2 — What the best current work actually does

22 shots downloaded and viewed across `digital-wellbeing`, `screen-time`, `focus-app`,
`habit-tracker`, `meditation-app`, `mindfulness`, `wellness-app`. Honest summary first: **most of
it is bad in the specific way that is dangerous**, because it is bad in a way that photographs
well. Four patterns dominate and all four are traps.

### The four Dribbble traps

**1. The purple-gradient wellness shot.** Deep violet-to-indigo ground (`#4A3F7A`-ish), glassy
translucent cards, a glowing circular focal object, a soft-rounded geometric sans. I saw this in
meditation, mindfulness and mental-health tags without meaningful variation. It is the fourth
competitor cliché from `02` — Opal and one sec's territory — rendered by people who are not
shipping. Avoid.

**2. Blob-mascot pastel.** Lilac/baby-blue/pink cards, hand-drawn character, `#C9A7F0` fills. One
digital-wellbeing shot fronted this with "Control Your Scroll, Not Algorithms". It infantilises,
which is precisely the SocialLite complaint from `02` ("walks you through every step like you're a
toddler"). Avoid.

**3. iOS-blue analytics.** `#0A7CFF` primary, white cards on `#EEF2F8`, big number + green delta
pill, **stacked multi-colour bar charts using six saturated hues at once**. This is the trap that
matters most for Quiet, because it is the one a screen-time app falls into by default. Those
stacked bars are the engagement palette applied to the user's own guilt.

**4. Neon-on-black gamification.** Cyan `#22D3EE` on `#0A0F14`, XP bars, levels, avatars, streaks.
Not calm, not for us, and it is the direction "add a streak" always ends in.

### The two shots that were genuinely good, and what to steal

**A fitness-ring dashboard on a warm neutral ground.** Ground around `#F2EFEA` with a
brown-grey photographic backdrop; near-achromatic UI; **one** accent, a terracotta
`#E4674A`, used only on the active tab pill and a heatmap. Numerals set very large at a *light*
weight (`12,231` at what reads as 300–400, not bold) with the unit set small underneath. The
week's data drawn as a **grid of small squares in a single-hue lightness ramp** — GitHub-contribution
style — with two individual days labelled inline rather than an axis.

Everything about that is right for Quiet:
- One accent on an otherwise colourless system.
- **Large numerals at light weight.** Big-and-bold reads as an alert; big-and-light reads as a
  fact. The category (Opal 85, Jomo 1h31) sets its numbers heavy. Setting them light is free
  differentiation and it is on-thesis.
- **Single-hue lightness ramp for the data.** CVD-safe by construction (§1.1), survives greyscale,
  and it is the correct encoding for a one-measure dataset.
- **Label two points inline; skip the axis.** Axes and gridlines are what make Jomo's hourly chart
  read as data rather than as a statement.

**A time-tracking dashboard on `#F7F6F4`.** Its hero was a horizontal 9am–5pm timeline where
activity blocks were pale amber `#F5D9A8` and the *gaps* were pale grey hatch. Almost no chroma
elsewhere. This is the closest thing I found to the correct Rhythm visualisation: a **horizontal
band, not a bar chart**, where the day is the axis and the highlighted region is the finding. It
proves the pattern reads without gridlines, and it proves amber works as a data fill when the rest
of the screen is neutral.

### Cross-cutting observations, concrete

- **Density.** Every good shot used a **4px base grid, 16px screen gutter, 20–24px card padding,
  12–16px between cards**. The bad shots use 8px padding and cram. Generous internal padding with
  fewer elements is the single cheapest "expensive" signal.
- **Radii.** The current premium range is **12–16px on cards, 8–10px on controls, full pill on
  chips**. The 24px+ "squircle everything" look now reads 2021.
- **Data visualisation.** The good work uses one hue, encodes with size and lightness, and drops
  axes. The bad work uses six hues, stacked bars, and a full axis+gridline apparatus.
- **Empty states.** Universally the weakest area — either a spot illustration and a dead sentence,
  or nothing. Nobody uses the empty state to explain *what will appear there and when*. Given that
  Quiet's Rhythm needs about a week before it can say anything, the honest progressive empty state
  ("Learning your rhythm — about four more days") is genuinely open territory and worth designing
  properly rather than treating as a fallback.
- **Motion.** Not visible in stills, and I will not pretend otherwise. Motion guidance below comes
  from Part 3, where I have documented durations.

---

# Part 3 — The non-category references: what "expensive" is made of

## Linear

Published token extraction of linear.app
([awesome-design-md](https://github.com/voltagent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md);
this is the **marketing site**, not the product, and the numbers should be read that way):

- Canvas `#010102`; surfaces `#0f1011` / `#141516` / `#18191a` / `#191a1b`. **Four elevation steps
  inside 9 luminance points.** Hairlines `#23252a` → `#3e3e44`.
- Text `#f7f8f8` / `#d0d6e0` / `#8a8f98` / `#62666d`.
- **One chromatic token in the entire system**: `#5e6ad2`. One semantic success `#27a644`.
  That is it.
- Type: 80/56/40/28/22/20/18/16/14/12px, weights 400–600 only, **letter-spacing scaling with
  size**: −3.0px at 80, −1.8px at 56, −1.0px at 40, −0.6px at 28, −0.4px at 22, −0.2px at 20,
  −0.1px at 18, −0.05px at 16, 0 at 14 and below. Eyebrows go *positive* (+0.4px at 13px).
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48, section 96. Radii 4 / 6 / 8 / 12 / 16 / 24 / pill.
- Motion: **100ms / 160ms / 400ms**. Nothing else.

The lesson is not the dark theme. It is that **hierarchy is built from luminance and type, and
colour is spent only where a decision is being requested.** Four background greys within nine
points of each other only work if the type scale is doing the real separation.

## Things 3

Apple Design Award 2017. What it does that is copyable:

- **Deletes chrome instead of styling it.** No card borders, no section backgrounds — grouping is
  done with whitespace alone. Structure is implied, not drawn.
- **One accent (blue), used only for today/date semantics and the check state.** Everything else
  is black, grey, and paper.
- **Motion carries the information architecture.** The new-to-do "magic plus" physically pushes
  rows apart to open a slot; completing an item animates it out along a path. You always know
  where a thing went. Nothing animates decoratively.
- **Type is the interface.** A single serifless family across a narrow size range, with weight and
  colour — not boxes — doing the hierarchy.

*(Aesthetic judgment, from use and from published critique — no token extraction exists.)*

## Arc

- **The chrome moves out of the way.** The sidebar collapses; the browser's own UI is not
  competing with content.
- **Colour is user-chosen per space and applied as a soft ground wash**, not as component fills —
  identity without an accent fighting the content.
- **Spring physics, not eased curves**, on every panel transition; the app has a consistent
  physical feel rather than a set of unrelated fades.

## What "expensive" is actually made of — five things, all free

1. **Accent scarcity.** One hue. Linear: one. Things: one. Freedom: one. Opal: two. Everything
   that reads cheap has four or more.
2. **Luminance-driven hierarchy.** Surfaces separated by 1–3 luminance points, not by borders and
   fills.
3. **Letter-spacing that scales with size.** Negative tracking at display sizes, zero at body,
   positive at 11–13px eyebrows. This is the most reliably overlooked typographic detail and it is
   the difference between "set in a nice font" and "typeset".
4. **Short, few, consistent motion durations**, with motion that explains where things went.
5. **Real internal padding.** 20–24px inside a card, not 12.

Note what is *not* on that list: illustration budget. Opal's rendered cave and Jomo's photographic
sky read as money, but they are the one premium signal a solo developer cannot buy. All five above
are available for the cost of discipline, which is the correct thing for Samuel to compete on.

---

# Part 4 — The recommendation

## 4.1 The direction: **Ink, Paper, Brass**

**Ground:** warm plaster, not cream. **Type:** warm ink, not black. **Structure:** hairlines and
whitespace, no filled panels. **Accent:** one deep brass, ~5% of screen area. **Primary button:**
ink. **Green:** demoted to a 6px state dot. **Red:** exists only to confirm you are about to
disable your own protection.

### On the prior document's "promote gold to primary" recommendation

The *diagnosis* is right and I am adopting it: gold is the unowned token, nobody in the field uses
a warm metallic, and `#C89B3C` is the most differentiated thing Quiet already has. The
*prescription* — gold as primary brand carrier — has three problems, and the third is fatal.

1. **Contrast.** `#C89B3C` on the current `#FAFAF7` is **2.36:1**. On the proposed plaster ground
   it is 2.48:1. It fails as text (needs 4.5) and fails as a UI component boundary (needs 3.0).
   White on `#C89B3C` is ~2.1:1, so it cannot be a filled button with light text either. A gold
   primary is a token you are not allowed to use anywhere it matters.
2. **Semantics.** Amber is the universal caution colour. `02` already flags the
   `warning #E8A54A` / `accentGold #C89B3C` collision. Making amber the brand does not resolve
   that collision, it globalises it.
3. **The thesis.** Amber-yellow is the highest-luminance chromatic region and, per §1.1, high
   saturation raises arousal. Filling a calm product's primary surfaces with saturated amber is
   the one move that contradicts the entire argument the app is making. Gold at 5% coverage reads
   precious. Gold at 40% coverage reads like a lager advert.

**The resolution that keeps the differentiation and drops the problems:** make the *system*
near-achromatic and let brass be its only colour. Gold becomes more distinctive, not less, when it
is the only chromatic thing on screen — that is exactly the mechanism by which `#5e6ad2` reads as
"Linear" despite covering almost nothing. And it lets the primary action be ink, which is both
16:1 and considerably more grown-up than a gold button.

I am also **moving off `#C89B3C` itself**, to a range: `#8A6414` where it must carry text (4.74:1),
`#A87D24` where it is a 2px indicator or control boundary (3.30:1), `#C4922E` only as a fill
behind ink (6.00:1). Same brass family, three luminances, each legal for its job.

### On the cream-and-serif cliché

`02` is right that cream + serif is now the indie-blocker default — Scrolless at `#F0EAE2`,
SocialLite's marketing at `#F0F0E0`, Freedom's cream-on-green. Two moves separate Quiet from it:

- **Plaster, not cream.** `#F2F1EC` is HSL 50°, **19%** saturation. Scrolless's `#F0EAE2` is 32%
  and Freedom's sage `#E0F0E0` is 35%. Nearly half the chroma. Side by side it reads as paper
  stock rather than as a colour choice, and it is measurably further from both competitors than
  they are from each other.
- **Carry the serif into the product.** Freedom and Scrolless both use a serif in *marketing only*
  and ship stock sans inside — which is exactly the store-page-versus-app mismatch `02` identifies
  as Scrolless's core failure. The serif being *in the app*, on the Rhythm sentence and the block
  screen, is the open territory.

## 4.2 Palette — light mode

**Surfaces and structure**

| Token | Hex | Role |
|---|---|---|
| `background` | `#F2F1EC` | App ground. Plaster. HSL 50/19/94. |
| `surface` | `#FBFAF8` | Cards, rows. Sits **lighter** than ground. |
| `surfaceElevated` | `#FFFFFF` | Modals and sheets **only**. The one place pure white is earned. |
| `border` | `#E2DFD7` | Decorative hairline between rows. |
| `borderControl` | `#8A8372` | Boundary of any control whose shape carries meaning (unfilled button, input, checkbox). |
| `overlay` | `#1F1D1A` @ 40% | Scrim behind sheets. |

Elevation steps are 1.08:1 (surface/background) and 1.04:1 (elevated/surface). That is deliberate
and it is the Linear move — separation comes from the hairline and the type, not from a luminance
cliff. `borderControl` is the token that satisfies WCAG 1.4.11; `border` is decorative and exempt.

**Text**

| Token | Hex | on `#F2F1EC` | on `#FBFAF8` | on `#FFFFFF` | Verdict |
|---|---|---|---|---|---|
| `textPrimary` | `#1F1D1A` | **14.87:1** | **16.12:1** | **16.81:1** | AAA |
| `textSecondary` | `#5F5A52` | **6.05:1** | **6.56:1** | **6.84:1** | AA (AAA on white) |
| `textTertiary` | `#726B5E` | **4.67:1** | **5.06:1** | **5.28:1** | AA at any size |
| `textDisabled` | `#A39C8F` | 2.41:1 | 2.61:1 | 2.72:1 | Fails — **disabled only**, exempt under 1.4.3; never use for live content |

`textTertiary` is deliberately darker than the current `#9B9B9B` (which is 2.5:1 on the current
ground and fails outright). Because Quiet's `caption` token is 11px, tertiary must clear **4.5**,
not 3.0 — 11px is not "large text" under any reading of SC 1.4.3.

**Brand**

| Token | Hex | Contrast | Use |
|---|---|---|---|
| `ink` | `#1F1D1A` | 14.87:1 on bg | **Primary button fill**, primary type. |
| `onInk` | `#FBFAF8` | 16.12:1 on ink | Label on the primary button. |
| `brass` | `#8A6414` | **4.74:1** on bg, 5.14:1 on surface | Brass *as text*: links, active tab label, the Rhythm figure. |
| `brassLine` | `#A87D24` | **3.30:1** on bg, 3.58:1 on surface | Brass *as a mark*: 2px active-window rule, focus ring, selected-state stroke, switch-on track. |
| `brassFill` | `#C4922E` | 6.00:1 **with ink on top** | Brass *as a fill*, only ever with `ink` type over it. Never with light type. |
| `brassSubtle` | `#F0E4C9` | 13.33:1 with ink on top | Tint behind the detected window band, selected chips. |

Three brasses is not three accents — it is one accent at three luminances, which is what makes it
legal. Same hue family (40–42°), same story.

**Semantic — deliberately minimal**

| Token | Hex | Contrast | Use |
|---|---|---|---|
| `success` | `#3F6147` | **6.16:1** on bg, 6.68:1 on surface | Protected/active state. **Only ever a 6px dot plus a text label, or small type.** Never a surface, never a fill. |
| `destructive` | `#9A3324` | **6.46:1** on bg, 7.01:1 on surface | One job: the confirm step when the user disables their own protection. |
| `onDestructive` | `#FBFAF8` | 7.01:1 on destructive | |

**There is no `warning` token.** This is intentional and it resolves the `02` §3 collision by
deletion rather than by relocation. Any amber warning would sit in the brass family and become
confusable with the brand at small sizes; a burnt-orange warning would be a fourth accent. If a
state needs emphasis short of destruction, it gets `textPrimary` and more space, not a colour.

`success` and `destructive` are a red/green pair, which is the classic CVD failure. Mitigation is
structural, not chromatic: **neither is ever the sole carrier of meaning.** Success is always
dot + word; destructive is always a labelled button. They also differ by 1.05:1 in luminance and
by shape of use, so they are distinguishable in greyscale.

**Data**

Quiet's data is one measure — minutes, by hour. It has no categories, so it gets no categorical
palette.

The primary Rhythm visualisation is a **24-cell horizontal band, not a bar chart**, and it encodes
**magnitude by cell height, salience by lightness** — never by hue:

| Token | Hex | Contrast on bg | Use |
|---|---|---|---|
| `chartRest` | `#DFD6BE` | 1.28:1 | Hours outside the detected window. Deliberately low-contrast — these are context, not content. |
| `chartRamp1` | `#DFD6BE` | 1.28:1 | |
| `chartRamp2` | `#C9B487` | 1.79:1 | Adjacent steps 1.40 / 1.67 / 1.87 — |
| `chartRamp3` | `#A8873A` | 3.00:1 | each step is a clear lightness increment. |
| `chartRamp4` | `#7A5A18` | **5.62:1** | Peak hour. |
| `chartWindow` | `#F0E4C9` | — | Tint block behind the detected window's hours. |
| `chartRule` | `#A87D24` | 3.30:1 | The 2px rule under the window. Carries the meaning. |

Rules that come with this and are not optional:

- **Steps 1–3 are below 3:1 and are therefore never the sole carrier of information.** The peak
  is always named in text ("Your window is 9:40–11:15pm"), which is the product anyway.
  Per `02` §6: ship the sentence, demote the chart.
- **No axis, no gridlines.** Two inline labels maximum. Axes are what made Jomo's hourly chart
  read as data instead of as a finding.
- **No second series, ever.** No stacked bars, no per-app colour coding. That is trap 3 from Part 2
  and it is the engagement palette applied to the user's guilt.
- Platform marks stay monochrome `#726B5E` at rest and take their brand colour only when a block
  is live — `02` §9, and it further reduces trade-dress exposure.

## 4.3 Palette — dark mode

Warm near-black, never `#000000`. Pure black is Opal's and ScrollGuard's, and per §1.1 it
maximises halation.

| Token | Hex | Role |
|---|---|---|
| `background` | `#141310` | Warm near-black. HSL 45/11/7. |
| `surface` | `#1C1A16` | 1.07:1 step. |
| `surfaceElevated` | `#242017` | 1.07:1 step. |
| `border` | `#302C25` | Decorative hairline. |
| `borderControl` | `#736B5B` | 3.30:1 on surface, 3.52:1 on bg — passes 1.4.11. |

| Token | Hex | on `#141310` | on `#1C1A16` | on `#242017` | Verdict |
|---|---|---|---|---|---|
| `textPrimary` | `#F0EDE6` | **15.89:1** | **14.86:1** | **13.88:1** | AAA. Warm off-white, **not** `#FFFFFF`. |
| `textSecondary` | `#A8A196` | **7.26:1** | **6.79:1** | **6.34:1** | AA / AAA on bg |
| `textTertiary` | `#918878` | **5.31:1** | **4.96:1** | **4.63:1** | AA at every level |

| Token | Hex | on `#141310` | on `#1C1A16` | Use |
|---|---|---|---|---|
| `ink` (inverted) | `#F0EDE6` | — | — | **Primary button fill** becomes paper; label is `#141310` at 15.89:1. |
| `brass` | `#D9A94A` | **8.60:1** | **8.05:1** | Brass as text and as fill-with-dark-type (8.60:1 with `#141310` on top). |
| `brassLine` | `#B98F3C` | 6.26:1 | **5.84:1** | Rules, focus rings, strokes. |
| `brassSubtle` | `#33291A` | 1.30:1 | — | Window tint. `textPrimary` on it: **12.19:1**. |
| `success` | `#7FA98A` | **7.03:1** | **6.57:1** | Same rules — dot plus label only. |
| `destructive` | `#D97B6B` | **6.19:1** | **5.79:1** | Same single job. |

Dark chart ramp: `#3A3222` (1.47:1) → `#5C4E2C` (2.28:1) → `#8C7439` (**4.13:1**) →
`#D9A94A` (**8.60:1**). Adjacent steps 1.56 / 1.81 / 2.08. `chartRest` `#3A3222`.

**The dark mode is not an inversion and must not be built as one.** The brass *lightens* going
dark (`#8A6414` → `#D9A94A`) while the ground barely warms; the primary button flips from ink to
paper; the chart ramp reverses direction. Six token pairs are genuine redesigns, not negations.

Per §1.1, the useful circadian lever is **total luminance**, not hue. So the dark theme's real job
is being dim: cap any single bright region, and consider auto-switching at the start of the
detected window rather than at a fixed clock hour. That is a feature the palette makes possible; do
not ship a claim about sleep with it.

## 4.4 Type

### Recommendation: **Newsreader** for display, **Inter** for everything else.

Both verified installable today — package existence checked against the npm registry, export names
checked against the `expo/google-fonts` source:

- `@expo-google-fonts/newsreader` @ 0.4.1 — 14 styles, `Newsreader_200ExtraLight` through
  `Newsreader_800ExtraBold`, **every weight with a true italic**.
- `@expo-google-fonts/inter` @ 0.4.2 — **already a dependency**. Zero migration cost.

Both are OFL. Ship only the four faces listed in the scale — bundling 32 static faces is real
install weight for a solo app.

**Why Newsreader.** It is a low-contrast transitional serif drawn for on-screen *reading*, not for
logos. That matters because Quiet's display face has to carry a full sentence — the Rhythm window
statement, the block-screen reason — not just a wordmark. It has a genuine italic, which is the
one typographic gesture available for emphasis that is not "make it louder", and a calm,
anti-urgency product should never emphasise by shouting.

**Rejected, and why:**

- **Fraunces.** Charming, and precisely for that reason: it is *the* indie-app soft-serif of the
  moment. Its optical-size axis and wonky terminals are personality-forward, which puts Quiet
  straight back into the Scrolless/cream-editorial lane that `02` correctly flags as no longer
  differentiating.
- **Instrument Serif.** Beautiful, but 400 weight only, no bold, high stroke contrast. Fragile
  below ~24px and gives no range. A one-weight display face means the display face can only ever
  appear in one place.
- **Playfair / Lora.** Higher contrast, more decorative, and Lora in particular reads as a
  2016 blog.
- **Swapping Inter.** No. Inter is what Linear uses, it is metrically excellent at 11–17px, and
  the current implementation is already correct. Replacing it would be motion without progress.

### Scale

`fontFamily` values are the exact `@expo-google-fonts` export names.

**Display — Newsreader. Maximum four uses in the entire app**: the home Rhythm sentence, the block
screen, the paywall headline, the onboarding cover. If it appears in a fifth place, it has stopped
being a display face.

| Token | Family | Size | Line height | Tracking | Colour |
|---|---|---|---|---|---|
| `displayLarge` | `Newsreader_400Regular` | 34 | 40 | **−0.8** | `textPrimary` |
| `displayMedium` | `Newsreader_400Regular` | 28 | 34 | **−0.5** | `textPrimary` |
| `displaySmall` | `Newsreader_400Regular` | 22 | 30 | **−0.3** | `textPrimary` |
| `displayEmphasis` | `Newsreader_400Regular_Italic` | inherits | inherits | inherits | `brass` |

Weight 400, not bold. A 34px serif at regular weight on plaster is quiet and expensive; the same
thing at 700 is a headline in a newspaper about a disaster. `displayEmphasis` is how the app
emphasises — italic and brass, not bold and large. That is the single most opinionated call in
this document.

**UI and body — Inter.** Tracking follows the Linear principle: negative at large, zero at body,
positive at eyebrow.

| Token | Family | Size | Line height | Tracking | Colour |
|---|---|---|---|---|---|
| `titleLarge` | `Inter_600SemiBold` | 22 | 28 | **−0.4** | `textPrimary` |
| `title` | `Inter_600SemiBold` | 17 | 22 | **−0.2** | `textPrimary` |
| `headline` | `Inter_500Medium` | 17 | 22 | **−0.1** | `textPrimary` |
| `tileLabel` | `Inter_500Medium` | 15 | 20 | 0 | `textPrimary` |
| `body` | `Inter_400Regular` | 15 | 22 | 0 | `textPrimary` |
| `bodyLarge` | `Inter_400Regular` | 17 | 26 | **−0.1** | `textPrimary` |
| `callout` | `Inter_400Regular` | 13 | 18 | 0 | `textSecondary` |
| `button` | `Inter_500Medium` | 15 | 20 | 0 | contextual |
| `eyebrow` | `Inter_500Medium` | 11 | 14 | **+0.6**, uppercase | `textTertiary` |
| `tag` | `Inter_500Medium` | 11 | 14 | 0 | contextual |

**Numerals.** One dedicated pair, and this is where the Part 2 observation lands:

| Token | Family | Size | Line height | Tracking |
|---|---|---|---|---|
| `figureLarge` | `Inter_300Light` | 44 | 48 | **−1.2** |
| `figureMedium` | `Inter_400Regular` | 28 | 32 | **−0.6** |

`Inter_300Light` at 44px is deliberate. Opal sets 85 heavy; Jomo sets 1h31 heavy. Big-and-bold
reads as an alert. Big-and-light reads as a fact. Set every figure with
`fontVariant: ['tabular-nums']` so live-updating counters do not jitter.

Four bundled faces total: `Newsreader_400Regular`, `Newsreader_400Regular_Italic`,
`Inter_300Light`, `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`. Six files. That is
the whole type system.

### Spacing, radii, motion

- **Spacing (4px base):** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48. Screen gutter **16**. Card padding
  **20**. Gap between cards **12**. Section break **32**.
- **Radii:** control 10, card 14, sheet 20, chip/pill 999. Nothing above 20.
- **Motion:** **120ms** state change (toggle, press), **220ms** enter/exit (row, card), **320ms**
  sheet/screen. Nothing longer, nothing else. Standard easing throughout; springs only on the
  sheet. **Every animation must explain where something went** (Things), never decorate. Honour
  `AccessibilityInfo.isReduceMotionEnabled` — for a low-arousal product this is thesis, not
  compliance.

## 4.5 Migration from the current tokens

| Current | Action |
|---|---|
| `background: #FAFAF7` | → `#F2F1EC`. Lowers max contrast; further from Freedom's sage and from cream. |
| `surface: #FFFFFF` | → `#FBFAF8`. White reserved for modals. |
| `primary: #1B4D3E` | **Delete.** This is the Freedom-overlap token from `02`. Primary action becomes `ink #1F1D1A`. |
| `primarySubtle: #E8F0EE` | **Delete.** Measurably Freedom's `#E0F0E0`. → `brassSubtle #F0E4C9`. |
| `accentGold: #C89B3C` | → split into `brass #8A6414` / `brassLine #A87D24` / `brassFill #C4922E`. |
| `success: #4A9B6E` | → `#3F6147`, and demoted to dot-plus-label only. |
| `warning: #E8A54A` | **Delete.** Collides with brass; the token has no honest job. |
| `destructive: #D45A5A` | → `#9A3324` (D45A5A is 3.36:1 on the new ground — fails AA for text). |
| `textTertiary: #9B9B9B` | → `#726B5E`. The old value fails AA at 11px. |
| `switchOn: #34C759` | **Delete.** `02` §2 — a second unrelated green, and the token that makes SocialLite read as a preferences pane. → `brassLine`. |
| `badgeRed: #E23B3B` | **Delete.** `02` §2 — advertises incompleteness. |
| `separator: #E5E5E2` | → `border #E2DFD7`. |
| `groupedBackground: #F2F2F0` | **Delete** — redundant once `background` is `#F2F1EC`. |
| `Typography.pill` (colour `switchOn`) | Recolour to `success`; the token survives, the colour does not. |
| `BRAND` marks | Keep flat and drawn from scratch. Render at `textSecondary` monochrome at rest; brand colour only when a block is live. |

Net: **five tokens deleted, no new hues introduced.** The system goes from four accent hues
(green, gold, iOS green, iOS red) to one.

## 4.6 What we are deliberately NOT doing

- **No streak, no flame, no score.** Opal's 85 and Jomo's 156 are Duolingo grammar. They
  manufacture loss aversion, which is an engagement mechanic wearing a wellness jumper, and they
  force competition on data volume — which a one-week-old app always loses.
- **No red anything except the disable-confirm.** No red badges, no red counts, no red deltas.
  Shame reads as urgency, and urgency is the thing the user downloaded this app to escape.
- **No `warning` token.** Deleted, not relocated.
- **No second accent hue.** Not for charts, not for platform tinting, not "just for the paywall".
- **No wellness gradient.** No purple-to-indigo, no glowing orb, no glassmorphism. `02` §clichés,
  Part 2 trap 1.
- **No mascot, no blob character, no spot illustration.** Part 2 trap 2, and `02`'s SocialLite
  infantilisation warning.
- **No stacked multi-colour bar chart.** Part 2 trap 3. One measure, one hue, height and lightness.
- **No axis or gridlines on the Rhythm band.** Jomo already owns the hourly bar chart and gets
  nothing for it.
- **No pure `#FFFFFF` background and no pure `#000000`.** Both throw away the max-contrast
  advantage; black additionally maximises halation (§1.1).
- **No bold display type.** Emphasis is italic and brass. If something needs more attention than
  that, it needs fewer neighbours, not more weight.
- **No competitor logos rendered in 3D.** `02` §9 — SocialLite's trade-dress exposure.
- **No claim that any of this improves sleep, lowers cortisol, or reduces anxiety.** The mechanism
  in §1.1 is about total luminance and is real; the leap to a health claim is not, and refusing to
  make it is the same discipline that produced Part 1.
- **No colour-psychology copy anywhere in marketing.** No "calming green", no "trust blue", no
  "41 shades" story, no invented percentages. This is a differentiator precisely because the
  category is full of it.

---

## Appendix — how the numbers were produced

Contrast ratios use the WCAG 2.x definition: `(L1 + 0.05) / (L2 + 0.05)`, with relative luminance
`0.2126R + 0.7152G + 0.0722B` over sRGB channels linearised by
`c ≤ 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4`. Computed in `node`, all pairs, not sampled.
HSL values quoted for saturation comparisons are standard sRGB HSL.

### Sources

Colour and vision science:
[Valdez & Mehrabian 1994](https://www.semanticscholar.org/paper/Effects-of-color-on-emotions.-Valdez-Mehrabian/d15bdf485f3a64abb59e4d0d1d1b18a9fc652bf9)
· [Wilms & Oberfeld 2018](https://www.staff.uni-mainz.de/oberfeld/downloads/Wilms-Oberfeld2018_Article_ColorAndEmotionEffectsOfHueSat.pdf)
· [Jonauskaite & Mohr 2024, 128-year systematic review](https://link.springer.com/article/10.3758/s13423-024-02615-z)
· [Steele 2014, failure to replicate Mehta & Zhu](https://link.springer.com/article/10.3758/s13423-013-0548-3)
· [Melanopic irradiance and evening display light, *Comms Bio* 2023](https://www.nature.com/articles/s42003-023-04598-4)
· [Blue-light-blocking glasses meta-analysis 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12668929/)
· [Red light and nighttime alertness](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2744917/)
· [Accessible colour sequences for data visualization, arXiv 2107.02270](https://arxiv.org/pdf/2107.02270)
· [Contrast polarity across age groups, arXiv 2409.10841](https://arxiv.org/pdf/2409.10841)

Accessibility standards:
[WCAG 2.2 SC 1.4.3](https://callingallminds.com/resources/wcag/1.4.3-contrast-minimum)
· [WCAG 3.0 / APCA status, 2026](https://web-accessibility-checker.com/en/blog/wcag-3-0-guide-2026-changes-prepare)
· [Dark mode and readability](https://www.boia.org/blog/dark-mode-can-improve-text-readability-but-not-for-everyone)
· [Walter — the dark mode accessibility myth](https://stephaniewalter.design/blog/dark-mode-accessibility-myth-debunked/)

Folklore debunks:
[Zeldman on 41 shades of blue](https://zeldman.com/2009/03/20/41-shades-of-blue/)
· [The 41-shades test is fundamentally flawed](https://www.insights4print.ceo/2022/02/the-google-41-shades-of-blue-test-is-fundamentally-flawed/)

Design references:
[Linear design tokens (marketing site extraction)](https://github.com/voltagent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md)
· [Design critique: Things 3](https://ixd.prattsi.org/2020/02/design-critique-things-3-ios-app/)

Font availability verified against `registry.npmjs.org` and
[expo/google-fonts](https://github.com/expo/google-fonts/tree/master/font-packages) on 2026-07-30:
`@expo-google-fonts/newsreader` 0.4.1, `@expo-google-fonts/inter` 0.4.2.

Visual survey: 22 shots across Dribbble tags `digital-wellbeing`, `screen-time`, `focus-app`,
`habit-tracker`, `meditation-app`, `mindfulness`, `wellness-app`, downloaded to the session
scratchpad and viewed directly. Not committed, not reproduced.
