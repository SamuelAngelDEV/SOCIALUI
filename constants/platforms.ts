export type PlatformId =
  | 'instagram'
  | 'youtube'
  | 'twitter'
  | 'facebook'
  | 'reddit'
  | 'tiktok'
  | 'linkedin'
  | 'snapchat';

export type PlatformConfig = {
  id: PlatformId;
  name: string;
  url: string;
  userAgent: string;
  beta: boolean;
  /** 'webview' opens the site with injection; 'block-only' opens an explanation sheet. */
  kind: 'webview' | 'block-only';
};

// Current iOS Safari UA. Instagram serves a broken/hanging fallback to unfamiliar
// or stale agents, so keep this recent.
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com',
    userAgent: MOBILE_UA,
    beta: false,
    kind: 'webview',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://m.youtube.com',
    userAgent: MOBILE_UA,
    beta: false,
    kind: 'webview',
  },
  twitter: {
    id: 'twitter',
    name: 'X',
    url: 'https://x.com',
    userAgent: MOBILE_UA,
    beta: true,
    kind: 'webview',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    url: 'https://www.tiktok.com',
    userAgent: MOBILE_UA,
    beta: true,
    kind: 'webview',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    url: 'https://m.facebook.com',
    userAgent: MOBILE_UA,
    beta: true,
    kind: 'webview',
  },
  snapchat: {
    id: 'snapchat',
    name: 'Snapchat',
    url: '',
    userAgent: MOBILE_UA,
    beta: false,
    kind: 'block-only',
  },
  reddit: {
    id: 'reddit',
    name: 'Reddit',
    url: 'https://www.reddit.com',
    userAgent: MOBILE_UA,
    beta: true,
    kind: 'webview',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    url: 'https://www.linkedin.com',
    userAgent: MOBILE_UA,
    beta: true,
    kind: 'webview',
  },
};

// Grid order mirrors SocialLite's home screen.
export const PLATFORM_ORDER: PlatformId[] = [
  'instagram',
  'youtube',
  'twitter',
  'tiktok',
  'facebook',
  'snapchat',
  'reddit',
  'linkedin',
];

export const PLATFORM_LIST = PLATFORM_ORDER.map((id) => PLATFORMS[id]);
