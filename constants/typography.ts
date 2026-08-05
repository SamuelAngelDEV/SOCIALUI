import { Platform, TextStyle } from 'react-native';
import { Colors } from './colors';

/**
 * Type — the system font, deliberately.
 *
 * WHY NOTHING IS BUNDLED
 *
 * On iOS the system font IS SF Pro Text / SF Pro Display, so asking for the
 * system stack gets the real thing. That is better than shipping font files,
 * not a compromise:
 *
 *   - SF Pro cannot legally be bundled. Apple's license limits it to Apple
 *     platforms and this app builds for Android too.
 *   - iOS switches between SF Pro Text and SF Pro Display automatically at
 *     around 20pt, adjusting spacing and aperture for the size. Static bundled
 *     files cannot do that.
 *   - No download, no `useFonts` gate, no blank first frame, no bundle weight.
 *
 * Android renders Roboto. The app is not pixel-identical across platforms and
 * that is the correct trade — each looks native where it runs.
 *
 * WEIGHT, NOT FAMILY. With the system font, weight is selected through
 * `fontWeight`; naming a family per weight (the `Inter_600SemiBold` pattern
 * this file used to use) would pin us back to a bundled face.
 */

/**
 * The system serif — New York on iOS 13+, installed, not bundled.
 *
 * Kept for two or three placements only: the Rhythm finding and the session
 * verdict. `research/03-visual-direction.md` §4.4 makes the argument and it
 * still holds — Freedom and Scrolless both use a serif in their marketing and
 * ship a stock sans inside the app, and that mismatch is a large part of why
 * they read cheap. A serif *in product* is close to free differentiation.
 *
 * Android has no equivalent, so it falls back to the platform serif rather
 * than to something arbitrary.
 */
const SERIF = Platform.select({ ios: 'New York', default: 'serif' });

export const Typography = {
  /**
   * The one sentence or number that carries a screen. Roughly four placements
   * per screen, maximum.
   */
  statement: {
    fontFamily: SERIF,
    fontSize: 30,
    letterSpacing: -0.4,
    color: Colors.textPrimary,
  },
  /** Serif italic — a Rhythm finding, a session verdict. Never a paragraph. */
  quote: {
    fontFamily: SERIF,
    fontStyle: 'italic',
    fontSize: 19,
    color: Colors.primary,
  },
  /**
   * Hero figure. Weight contrast, not size alone, is what reads considered — a
   * light weight at a large size looks deliberate where bold looks shouty.
   */
  figureXL: {
    fontWeight: '300',
    fontSize: 44,
    letterSpacing: -1.2,
    color: Colors.textPrimary,
  },
  figureLG: {
    fontWeight: '300',
    fontSize: 32,
    letterSpacing: -0.8,
    color: Colors.textPrimary,
  },
  largeTitle: {
    fontWeight: '700',
    fontSize: 28,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  title: {
    fontWeight: '600',
    fontSize: 22,
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  },
  headline: {
    fontWeight: '500',
    fontSize: 17,
    color: Colors.textPrimary,
  },
  /** Platform name inside a home grid tile: 15/500, between body and headline. */
  tileLabel: {
    fontWeight: '500',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  body: {
    fontWeight: '400',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  callout: {
    fontWeight: '400',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  caption: {
    fontWeight: '500',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textTertiary,
  },
  /**
   * Sentence-case label inside a filled pill. Shares `caption`'s metrics
   * (11/500) but stays a separate token: `caption` is an uppercase eyebrow, and
   * applying it here would rewrite "Recommended" as "RECOMMENDED".
   */
  tag: {
    fontWeight: '500',
    fontSize: 11,
    color: Colors.surface,
  },
  /** Status pill in Settings, e.g. the locked "Always On" marker. */
  pill: {
    fontWeight: '600',
    fontSize: 12,
    color: Colors.switchOn,
  },
  /** Smallest type in the app: home-tile stickers (BETA / BLOCK ONLY / SOON). */
  badge: {
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 0.4,
    color: Colors.surface,
  },
} satisfies Record<string, TextStyle>;
