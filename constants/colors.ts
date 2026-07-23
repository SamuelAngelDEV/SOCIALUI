export const Colors = {
  background: '#FAFAF7',
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#9B9B9B',
  primary: '#1B4D3E',
  primarySubtle: '#E8F0EE',
  accentGold: '#C89B3C',
  success: '#4A9B6E',
  destructive: '#D45A5A',
  warning: '#E8A54A',
  border: '#EEEEEB',
  // SocialLite-style additions (Task 2).
  switchOn: '#34C759', // iOS system green — matches SocialLite's toggles
  badgeRed: '#E23B3B', // red BETA sticker
  separator: '#E5E5E2', // hairline between settings rows
  groupedBackground: '#F2F2F0', // cream grouped-list backdrop
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
