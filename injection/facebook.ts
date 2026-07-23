import { buildScript, Rule, RouteGuard } from './engine';

/**
 * Rule keys match `FEATURES.facebook`. Targets m.facebook.com. Meta obfuscates
 * classes, so anchor on hrefs and aria-labels only.
 */
export const RULES: Rule[] = [
  {
    key: 'blockReels',
    css: [
      'a[href*="/reels/"]',
      'a[href*="/reel/"]',
      '[aria-label="Reels"]',
    ],
    textHide: {
      probe: 'span',
      match: ['reels'],
      exact: true,
      closest: '[data-mcomponent="MContainer"][data-type="container"]',
    },
  },
  {
    key: 'blockStories',
    css: ['[aria-label="Stories"]', '[data-type="stories-tray"]'],
  },
  {
    key: 'blockWatch',
    css: ['a[href*="/watch/"]', 'a[href="/watch"]', '[aria-label="Watch"]', '[aria-label="Video"]'],
  },
  {
    key: 'blockMarketplace',
    css: ['a[href*="/marketplace"]', '[aria-label="Marketplace"]'],
  },
];

const GUARDS: RouteGuard[] = [
  { key: 'blockReels', redirectPrefixes: ['/reels', '/reel'], to: '/' },
  { key: 'blockWatch', redirectPrefixes: ['/watch'], to: '/' },
  { key: 'blockMarketplace', redirectPrefixes: ['/marketplace'], to: '/' },
];

export function buildFacebookScript(
  config: Record<string, boolean>,
  limitCount = 10
): string {
  return buildScript({
    rules: RULES,
    guards: GUARDS,
    config,
    grayscaleKey: 'grayscale',
    limitKey: 'limitFeed',
    limitSelector: '[data-tracking-duration-id], article',
    limitCount,
    limitPath: '/', // cap only the news feed
  });
}
