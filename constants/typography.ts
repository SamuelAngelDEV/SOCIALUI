import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography = {
  largeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  },
  headline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 17,
    color: Colors.textPrimary,
  },
  // Platform name inside a home grid tile. Design system specifies 15/500, which
  // falls between `body` (15/400) and `headline` (17/500).
  tileLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  callout: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textTertiary,
  },
} satisfies Record<string, TextStyle>;
