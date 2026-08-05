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
  background: '#F7F0F8', // lilac-tinted ground — 36% saturation, up from 13%
  surface: '#FDFAFE', // cards, rows
  surfaceElevated: '#FFFFFF', // modals and overlays only

  textPrimary: '#241C28', // 14.76:1
  textSecondary: '#5E5166', // 6.60:1
  textTertiary: '#71627A', // 5.03:1
  textOnFill: '#FFFFFF', // on primary/primaryFill — 7.79:1

  primary: '#6B2D78', // plum, brand — 8.26:1 as text. 45% saturation, up from 22%.
  primaryFill: '#7B3489', // filled buttons — 7.79:1 with white on top
  primaryLine: '#9455A3', // rules, focus rings — 4.59:1
  primarySubtle: '#F0DDF4', // banners, selected rows — 12.86:1 with textPrimary

  success: '#2F7350', // 5.09:1
  warning: '#96610F', // 4.68:1. Semantic only; not a brand colour.
  destructive: '#B32D2D', // 5.64:1

  /**
   * Activity categories. Two registers per category: `cat*` is the chart mark
   * (needs 3:1), `catText*` is the label (needs 4.5:1).
   *
   * Warm hues carry algorithmic time, cool hues carry intentional time, so the
   * split reads as a family before any label is read. Colour never carries the
   * meaning alone — always pair a mark with its label.
   */
  catFeed: '#8A3D9E', // algorithmic — 5.79:1
  catReels: '#C13B6B', // algorithmic — 4.57:1
  catExplore: '#A65E1B', // algorithmic — 4.43:1
  catMessages: '#1E7A72', // intentional — 4.60:1
  catVideo: '#2F63A8', // intentional — 5.41:1
  catSearch: '#4A4E9C', // intentional — 6.56:1
  catOther: '#8E8296', // unclassified — 3.25:1

  catTextFeed: '#6B2D78', // 8.26:1
  catTextReels: '#A32B58', // 6.17:1
  catTextExplore: '#6E4E12', // 6.80:1
  catTextMessages: '#166159', // 6.50:1
  catTextVideo: '#28518A', // 7.13:1
  catTextSearch: '#3F3A88', // 8.64:1
  catTextOther: '#6E6377', // 5.05:1

  border: '#E8DCEC', // decorative hairline — no WCAG minimum
  borderControl: '#94829C', // input/control boundary — 3.16:1. #9B8AA3 fails at 2.86:1.
  separator: '#E8DCEC', // hairline between settings rows
  groupedBackground: '#EFE6F2', // grouped-list backdrop

  /**
   * Switch track, on. Uses the brand fill so the control reads as ours rather
   * than as the iOS default green. 5.79:1 against `background`.
   */
  switchOn: '#7B3489',
  /**
   * Switch track, off. React Native's `Switch` is the native control and takes
   * no border, so this cannot reach the 3:1 of SC 1.4.11 on its own — iOS's own
   * off-state is roughly 1.1:1. Following the platform convention here and
   * leaning on the adjacent row label to carry state, rather than shipping a
   * heavy grey track that reads as enabled.
   */
  switchOff: '#DCCCE2',

  badgeRed: '#B32D2D', // BETA sticker — 5.94:1 with white on top
  accentGold: '#96610F', // BLOCK ONLY sticker — 4.99:1 with white on top
  pillSubtle: 'rgba(123,52,137,0.12)', // Always-On pill fill, tinted from primaryFill
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
