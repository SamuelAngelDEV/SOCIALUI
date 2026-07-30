import { ViewStyle } from 'react-native';

/**
 * 4pt grid. These are the step values already in use across the app — this file
 * names them, it does not introduce a new scale. Anything off-grid that survives
 * in a component (optical nudges like `marginLeft: -6`, or a value derived from
 * another value like a slider track height) stays a literal on purpose.
 */
export const Spacing = {
  /** 4 — hairline gaps, dot rows, tight vertical rhythm. */
  xs: 4,
  /** 8 — badge padding, chip gaps, small margins. */
  sm: 8,
  /** 12 — the default gap between stacked cards and rows. */
  md: 12,
  /** 16 — the standard screen gutter and card padding. */
  lg: 16,
  /** 20 — section header spacing. */
  xl: 20,
  /** 24 — spacing between major blocks; onboarding screen gutter. */
  xxl: 24,
  /** 32 — page-level top/bottom breathing room. */
  xxxl: 32,
} as const;

/**
 * Corner radii already in use. `circleSm`/`circleLg` are exactly half of the
 * fixed-size icon circles they round, so they are paired with `Size` below.
 */
export const Radii = {
  /** 5 — the small stickers on a home tile (BETA / BLOCK ONLY / SOON). */
  badge: 5,
  /** 12 — buttons, chips, preset cards, inline plaques. */
  md: 12,
  /** 16 — cards and grouped settings containers. */
  lg: 16,
  /** 22 — half of `Size.iconCircleSm` (44). */
  circleSm: 22,
  /** 36 — half of `Size.iconCircleLg` (72). */
  circleLg: 36,
  /** 999 — fully rounded pill. */
  pill: 999,
} as const;

/** Fixed element sizes that pair with the circle radii above. */
export const Size = {
  /** 44 — onboarding reassurance icon circle. */
  iconCircleSm: 44,
  /** 72 — the limit-reached hourglass circle. */
  iconCircleLg: 72,
} as const;

/**
 * The single elevation in the app: a barely-there lift under a home tile.
 * Deliberately one token — new surfaces should reuse it rather than invent
 * another shadow.
 */
export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
} satisfies Record<string, ViewStyle>;
