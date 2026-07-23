import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { PlatformId } from '@/constants/platforms';

type Props = {
  platform: PlatformId;
  size?: number;
};

/**
 * Flat, rounded-square brand marks drawn from scratch — recognizable and
 * brand-colored, but not the platforms' own icon artwork. `size` is the full
 * tile size; the inner glyph scales with it.
 */
export function PlatformLogo({ platform, size = 60 }: Props) {
  const r = size * 0.24; // corner radius of the app-icon square
  const white = '#FFFFFF';

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {platform === 'instagram' && (
        <>
          <Defs>
            <LinearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor="#FEDA75" />
              <Stop offset="0.35" stopColor="#FA7E1E" />
              <Stop offset="0.6" stopColor="#D62976" />
              <Stop offset="1" stopColor="#4F5BD5" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="100" rx="24" fill="url(#ig)" />
          <Rect x="26" y="26" width="48" height="48" rx="14" fill="none" stroke={white} strokeWidth="6" />
          <Circle cx="50" cy="50" r="13" fill="none" stroke={white} strokeWidth="6" />
          <Circle cx="68" cy="32" r="4" fill={white} />
        </>
      )}

      {platform === 'youtube' && (
        <>
          <Rect x="0" y="0" width="100" height="100" rx="24" fill="#FF0000" />
          <Path d="M40 34 L68 50 L40 66 Z" fill={white} />
        </>
      )}

      {platform === 'twitter' && (
        <>
          <Rect x="0" y="0" width="100" height="100" rx="24" fill="#000000" />
          <Path
            d="M28 28 L45 50 L28 72 L36 72 L49 55 L61 72 L72 72 L54 48 L70 28 L62 28 L50 43 L39 28 Z"
            fill={white}
          />
        </>
      )}

      {platform === 'tiktok' && (
        <>
          <Rect x="0" y="0" width="100" height="100" rx="24" fill="#000000" />
          {/* offset cyan + magenta shadows, white note on top */}
          <Path d="M60 26 v34 a15 15 0 1 1 -13 -14.9 v10 a6 6 0 1 0 5 6 V26 c1 8 7 13 15 13.6 v-9" fill="#25F4EE" transform="translate(-3 2)" />
          <Path d="M60 26 v34 a15 15 0 1 1 -13 -14.9 v10 a6 6 0 1 0 5 6 V26 c1 8 7 13 15 13.6 v-9" fill="#FE2C55" transform="translate(3 -2)" />
          <Path d="M60 26 v34 a15 15 0 1 1 -13 -14.9 v10 a6 6 0 1 0 5 6 V26 c1 8 7 13 15 13.6 v-9" fill={white} />
        </>
      )}

      {platform === 'facebook' && (
        <>
          <Rect x="0" y="0" width="100" height="100" rx="24" fill="#1877F2" />
          <Path
            d="M62 34 h-6 a5 5 0 0 0 -5 5 v8 h11 l-2 11 h-9 v22 h-11 V58 h-8 V47 h8 v-9 a15 15 0 0 1 15 -15 h7 z"
            fill={white}
          />
        </>
      )}

      {platform === 'reddit' && (
        <>
          <Rect x="0" y="0" width="100" height="100" rx="24" fill="#FF4500" />
          <Circle cx="50" cy="58" r="22" fill={white} />
          <Circle cx="72" cy="34" r="6" fill={white} />
          <Path d="M50 40 L54 28 L66 31" fill="none" stroke={white} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="41" cy="56" r="4" fill="#FF4500" />
          <Circle cx="59" cy="56" r="4" fill="#FF4500" />
          <Path d="M41 66 q9 7 18 0" fill="none" stroke="#FF4500" strokeWidth="4" strokeLinecap="round" />
        </>
      )}

      {platform === 'linkedin' && (
        <>
          <Rect x="0" y="0" width="100" height="100" rx="24" fill="#0A66C2" />
          {/* "in" glyph: dot + stem + n */}
          <Circle cx="33" cy="33" r="6" fill={white} />
          <Rect x="27" y="44" width="12" height="30" fill={white} />
          <Path
            d="M46 44 h11 v5 c2.5 -3.5 6.5 -6 12 -6 c9 0 13 6 13 15 v16 h-12 v-14 c0 -4.5 -1.8 -7 -5.5 -7 c-4 0 -6.5 2.7 -6.5 7.5 v13.5 h-12 z"
            fill={white}
          />
        </>
      )}

      {platform === 'snapchat' && (
        <>
          <Rect x="0" y="0" width="100" height="100" rx="24" fill="#FFFC00" />
          <Path
            d="M50 26 c9 0 15 7 15 16 c0 3 -1 6 0 8 c1 2 5 2 7 3 c1 1 0 3 -2 4 c-3 1 -7 1 -9 4 c-1 2 -3 4 -11 4 s-10 -2 -11 -4 c-2 -3 -6 -3 -9 -4 c-2 -1 -3 -3 -2 -4 c2 -1 6 -1 7 -3 c1 -2 0 -5 0 -8 c0 -9 6 -16 15 -16 z"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="2"
          />
        </>
      )}
    </Svg>
  );
}
