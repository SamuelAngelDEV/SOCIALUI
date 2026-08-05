/**
 * Background themes — the decorative ground behind every screen.
 *
 * THE RULE THAT SHAPES ALL OF THIS
 *
 * A theme changes the GROUND ONLY. Cards, rows and text keep the token system
 * untouched, so every contrast ratio computed in `constants/colors.ts` still
 * holds on top of any theme. That is not a stylistic preference, it is the only
 * way to offer decoration without quietly breaking the accessibility work.
 *
 * Two mechanisms enforce it:
 *
 * 1. Every scene is drawn, then covered by a scrim of `Colors.background` at
 *    `SCRIM_ALPHA`. The scene reads as a tint, never as an image.
 * 2. Scene marks are constrained to LIGHT values. This is the part that is easy
 *    to get wrong: even at a 0.92 scrim, a mark as dark as `#5E2A6B` drags the
 *    effective ground to a point where `textTertiary` (#71627A) lands at
 *    4.40:1 — under the 4.5 minimum — because tertiary text has only 5.03:1 of
 *    headroom on the plain ground to begin with. Marks therefore stay at or
 *    above roughly `#BE9BC9` in lightness.
 *
 * `scripts/verify-themes.js` composites every colour declared below and fails
 * if any of them would push text under the minimum. The guarantee is checked,
 * not asserted in a comment.
 *
 * Note how well the constraint sits with the product: a loud photographic
 * background would contradict the low-arousal argument the whole app makes
 * (`research/03-visual-direction.md` §1.4 — keep global saturation low). The
 * accessibility limit and the design thesis point the same way, which is
 * usually a sign the constraint is the right one.
 */

/** How much of the plain ground sits over the scene. */
export const SCRIM_ALPHA = 0.85;

export type ThemeId = 'plain' | 'ocean' | 'blossom' | 'dusk' | 'orbit';

export type Theme = {
  id: ThemeId;
  name: string;
  /** One line for the picker — says what it is, not how it feels. */
  note: string;
  /**
   * Every colour the scene draws with. Read by `verify-themes.js`, so this must
   * list them all — a colour used in the component but missing here is
   * unchecked, which is the one failure mode this design has.
   */
  marks: string[];
};

export const THEMES: Theme[] = [
  {
    id: 'plain',
    name: 'Plain',
    note: 'Just the paper ground.',
    marks: [],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    note: 'Slow swells across the bottom.',
    marks: ['#A9C9D9', '#BFD8E4', '#93B9CE'],
  },
  {
    id: 'blossom',
    name: 'Blossom',
    note: 'Scattered petals, mostly out of the way.',
    marks: ['#E4B6CD', '#DCC3E4', '#CBDFC4'],
  },
  {
    id: 'dusk',
    name: 'Dusk',
    note: 'A wash that deepens toward the bottom.',
    marks: ['#E7C9DA', '#CDBBE0'],
  },
  {
    id: 'orbit',
    name: 'Orbit',
    note: 'A quiet starfield and one planet edge.',
    marks: ['#C4AEDC', '#DACDEA', '#BE9BC9'],
  },
];

export const DEFAULT_THEME: ThemeId = 'plain';

export const isThemeId = (v: unknown): v is ThemeId =>
  typeof v === 'string' && THEMES.some((t) => t.id === v);

export const themeById = (id: ThemeId): Theme =>
  THEMES.find((t) => t.id === id) ?? THEMES[0];
