/**
 * Quiet — "Plum" palette.
 *
 * Every foreground/background pair below was computed against WCAG 2.x relative
 * luminance, not estimated. The ratio in each comment is against `background`
 * unless stated otherwise. Body text targets 4.5:1, large text and non-text UI
 * components 3:1 (WCAG 2.2 SC 1.4.3 / 1.4.11).
 *
 * Two values from the previous palette were removed because they failed:
 *   - switchOn  #34C759 → 2.12:1, below the 3:1 minimum for a UI component
 *   - accentGold #C89B3C → 2.45:1, unusable as text
 * Both came from the block `colors.ts` labelled "SocialLite-style additions".
 * The standing rule is to copy that app's layout, never its visual style.
 *
 * Direction: saturation drives perceived arousal far more reliably than hue
 * (Valdez & Mehrabian 1994; Wilms & Oberfeld 2018), so this palette carries
 * several hues at deliberately restrained chroma rather than one loud one.
 * See research/03-visual-direction.md.
 */
export const Colors = {
  background: '#F5F2F4', // warm mauve-neutral ground
  surface: '#FCFBFC', // cards, rows
  surfaceElevated: '#FFFFFF', // modals and overlays only

  textPrimary: '#221E24', // 14.77:1
  textSecondary: '#5A525F', // 6.73:1
  textTertiary: '#6D6472', // 5.08:1
  textOnFill: '#FFFFFF', // on primary/plumFill — 6.16:1

  primary: '#5B3A5B', // plum, brand — 8.58:1 as text
  primaryFill: '#7A5480', // filled buttons — 6.16:1 with white on top
  primaryLine: '#8E6694', // rules, focus rings — 4.22:1
  primarySubtle: '#EFE6F0', // banners, selected rows — 13.48:1 with textPrimary

  success: '#3F6147', // 6.27:1
  warning: '#8A6414', // brass — 4.83:1. Semantic only; not a brand colour.
  destructive: '#9A3324', // 6.57:1

  /**
   * Activity categories. Two registers per category: `cat*` is the chart mark
   * (needs 3:1), `catText*` is the label (needs 4.5:1).
   *
   * Warm hues carry algorithmic time, cool hues carry intentional time, so the
   * split reads as a family before any label is read. Colour never carries the
   * meaning alone — always pair a mark with its label.
   */
  catFeed: '#7A5480', // algorithmic — 5.54:1
  catReels: '#A34A6B', // algorithmic — 5.04:1
  catMessages: '#2F6E6A', // intentional — 5.31:1
  catVideo: '#3A5F8A', // intentional — 5.93:1
  catOther: '#8A8080', // unclassified — 3.45:1

  catTextFeed: '#5B3A5B', // 8.58:1
  catTextReels: '#8E3757', // 6.66:1
  catTextMessages: '#245853', // 7.28:1
  catTextVideo: '#2F4E73', // 7.68:1
  catTextOther: '#6E6672', // 4.96:1

  border: '#E6E0E8', // decorative hairline — no WCAG minimum
  borderControl: '#8B838F', // input/control boundary — 3.29:1
  separator: '#E6E0E8', // hairline between settings rows
  groupedBackground: '#EDEAEC', // grouped-list backdrop

  /**
   * Switch track, on. Uses the brand fill so the control reads as ours rather
   * than as the iOS default green. 5.54:1 against `background`.
   */
  switchOn: '#7A5480',
  /**
   * Switch track, off. React Native's `Switch` is the native control and takes
   * no border, so this cannot reach the 3:1 of SC 1.4.11 on its own — iOS's own
   * off-state is roughly 1.1:1. Following the platform convention here and
   * leaning on the adjacent row label to carry state, rather than shipping a
   * heavy grey track that reads as enabled.
   */
  switchOff: '#D6CFD8',

  badgeRed: '#9A3324', // BETA sticker — 7.31:1 with white on top
  accentGold: '#8A6414', // BLOCK ONLY sticker — 5.37:1 with white on top
  pillSubtle: 'rgba(122,84,128,0.12)', // Always-On pill fill, tinted from primaryFill
};

/**
 * Brand colors for the flat app-icon marks. Drawn from scratch as simple SVG,
 * not the platforms' own artwork.
 */
export const BRAND: Record<string, { bg: string; fg: string }> = {
  instagram: { bg: '#E1306C', fg: '#FFFFFF' }, // gradient handled in PlatformLogo
  youtube: { bg: '#FF0000', fg: '#FFFFFF' },
  twitter: { bg: '#000000', fg: '#FFFFFF' },
  facebook: { bg: '#1877F2', fg: '#FFFFFF' },
  reddit: { bg: '#FF4500', fg: '#FFFFFF' },
  tiktok: { bg: '#000000', fg: '#FFFFFF' },
  linkedin: { bg: '#0A66C2', fg: '#FFFFFF' },
  snapchat: { bg: '#FFFC00', fg: '#000000' },
};
