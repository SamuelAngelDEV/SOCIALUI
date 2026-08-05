import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { SCRIM_ALPHA, ThemeId } from '@/constants/themes';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * The decorative ground behind every screen.
 *
 * Three layers, in order: the plain token background, the scene, then a scrim
 * of the plain background at `SCRIM_ALPHA`. The scrim is what keeps every
 * contrast ratio in `constants/colors.ts` valid on top of any theme — see the
 * header of `constants/themes.ts`, and `scripts/verify-themes.js`, which
 * composites each scene colour and fails the build if text would go illegible.
 *
 * Every colour drawn below MUST also appear in that theme's `marks` array. A
 * colour used here and missing there is unverified, which is the single failure
 * mode this design has.
 *
 * Positions are fixed literals rather than `Math.random()`: a scene that
 * reshuffles itself on every re-render is a distraction, and a distraction is
 * the specific thing this app exists to remove.
 */

/** Scattered petal positions, as fractions of the viewport. */
const PETALS: { x: number; y: number; r: number; c: string; a: number }[] = [
  { x: 0.12, y: 0.08, r: 13, c: '#E4B6CD', a: 0.9 },
  { x: 0.83, y: 0.05, r: 9, c: '#DCC3E4', a: 0.8 },
  { x: 0.62, y: 0.14, r: 7, c: '#CBDFC4', a: 0.75 },
  { x: 0.28, y: 0.21, r: 6, c: '#E4B6CD', a: 0.6 },
  { x: 0.91, y: 0.27, r: 12, c: '#DCC3E4', a: 0.7 },
  { x: 0.06, y: 0.38, r: 8, c: '#CBDFC4', a: 0.6 },
  { x: 0.72, y: 0.44, r: 6, c: '#E4B6CD', a: 0.55 },
  { x: 0.34, y: 0.56, r: 11, c: '#DCC3E4', a: 0.6 },
  { x: 0.88, y: 0.63, r: 7, c: '#CBDFC4', a: 0.55 },
  { x: 0.15, y: 0.71, r: 9, c: '#E4B6CD', a: 0.6 },
  { x: 0.57, y: 0.79, r: 13, c: '#DCC3E4', a: 0.65 },
  { x: 0.79, y: 0.88, r: 8, c: '#CBDFC4', a: 0.6 },
  { x: 0.24, y: 0.93, r: 10, c: '#E4B6CD', a: 0.55 },
];

/** Starfield. Small, plentiful, deliberately uneven. */
const STARS: { x: number; y: number; r: number; a: number }[] = [
  { x: 0.08, y: 0.06, r: 1.6, a: 0.9 }, { x: 0.21, y: 0.11, r: 1.1, a: 0.7 },
  { x: 0.37, y: 0.04, r: 2.0, a: 0.85 }, { x: 0.52, y: 0.13, r: 1.2, a: 0.6 },
  { x: 0.68, y: 0.07, r: 1.7, a: 0.8 }, { x: 0.86, y: 0.16, r: 1.3, a: 0.7 },
  { x: 0.13, y: 0.24, r: 1.4, a: 0.65 }, { x: 0.44, y: 0.27, r: 1.9, a: 0.8 },
  { x: 0.73, y: 0.31, r: 1.2, a: 0.6 }, { x: 0.93, y: 0.39, r: 1.6, a: 0.7 },
  { x: 0.05, y: 0.46, r: 1.8, a: 0.75 }, { x: 0.29, y: 0.42, r: 1.1, a: 0.55 },
  { x: 0.61, y: 0.5, r: 1.5, a: 0.7 }, { x: 0.17, y: 0.58, r: 1.3, a: 0.6 },
  { x: 0.48, y: 0.64, r: 1.9, a: 0.75 }, { x: 0.82, y: 0.6, r: 1.2, a: 0.55 },
  { x: 0.35, y: 0.75, r: 1.6, a: 0.7 }, { x: 0.66, y: 0.82, r: 1.3, a: 0.6 },
  { x: 0.1, y: 0.86, r: 1.8, a: 0.7 }, { x: 0.9, y: 0.92, r: 1.4, a: 0.6 },
];

function Scene({ theme, w, h }: { theme: ThemeId; w: number; h: number }) {
  switch (theme) {
    case 'ocean':
      // Swells stacked toward the bottom, lightest at the back.
      return (
        <Svg width={w} height={h}>
          <Path
            d={`M0 ${h * 0.68} Q ${w * 0.25} ${h * 0.62} ${w * 0.5} ${h * 0.68} T ${w} ${h * 0.68} L ${w} ${h} L0 ${h} Z`}
            fill="#BFD8E4"
            opacity={0.7}
          />
          <Path
            d={`M0 ${h * 0.78} Q ${w * 0.3} ${h * 0.71} ${w * 0.58} ${h * 0.78} T ${w} ${h * 0.8} L ${w} ${h} L0 ${h} Z`}
            fill="#A9C9D9"
            opacity={0.75}
          />
          <Path
            d={`M0 ${h * 0.88} Q ${w * 0.22} ${h * 0.83} ${w * 0.5} ${h * 0.89} T ${w} ${h * 0.87} L ${w} ${h} L0 ${h} Z`}
            fill="#93B9CE"
            opacity={0.8}
          />
        </Svg>
      );

    case 'blossom':
      return (
        <Svg width={w} height={h}>
          {PETALS.map((p, i) => (
            <Ellipse
              key={i}
              cx={p.x * w}
              cy={p.y * h}
              rx={p.r}
              ry={p.r * 0.66}
              fill={p.c}
              opacity={p.a}
            />
          ))}
        </Svg>
      );

    case 'dusk':
      return (
        <Svg width={w} height={h}>
          <Defs>
            <LinearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#E7C9DA" stopOpacity="0.25" />
              <Stop offset="1" stopColor="#CDBBE0" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={w} height={h} fill="url(#dusk)" />
        </Svg>
      );

    case 'orbit':
      return (
        <Svg width={w} height={h}>
          {STARS.map((s, i) => (
            <Circle key={i} cx={s.x * w} cy={s.y * h} r={s.r} fill="#C4AEDC" opacity={s.a} />
          ))}
          {/* One planet edge, mostly off-screen — a horizon, not an illustration. */}
          <Circle cx={w * 1.05} cy={h * 1.02} r={w * 0.55} fill="#DACDEA" opacity={0.85} />
          <Circle
            cx={w * 1.05}
            cy={h * 1.02}
            r={w * 0.55}
            fill="none"
            stroke="#BE9BC9"
            strokeWidth={1.5}
            opacity={0.9}
          />
        </Svg>
      );

    default:
      return null;
  }
}

export function ThemeBackground() {
  const theme = useSettingsStore((s) => s.theme);
  const { width, height } = useWindowDimensions();

  return (
    <View style={styles.root} pointerEvents="none">
      {theme !== 'plain' && (
        <>
          <Scene theme={theme} w={width} h={height} />
          {/*
            The guarantee. Everything above is decoration; this is what keeps
            the ground close enough to `Colors.background` that the computed
            ratios still hold. Changing SCRIM_ALPHA without re-running
            verify-themes.js is how this feature would break text somewhere.
          */}
          <View style={[styles.scrim, { opacity: SCRIM_ALPHA }]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
  },
});
