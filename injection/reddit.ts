import { buildScript, Rule, RouteGuard } from './engine';
import { PlatformAdapter, buildFromAdapter } from './adapter';

/**
 * Rule keys match `FEATURES.reddit`. New reddit.com renders posts as
 * <shreddit-post> custom elements with <faceplate-number> counters — unusually
 * clean anchors.
 */
export const RULES: Rule[] = [
  {
    key: 'blockPopular',
    css: [
      'a[href="/r/popular/"]',
      'a[href^="/r/popular"]',
      '#popular-posts',
      'shreddit-gallery-carousel',
    ],
  },
  {
    key: 'hideMetrics',
    css: [
      'shreddit-post faceplate-number',
      'shreddit-post-overflow-menu ~ span faceplate-number',
      '[data-testid="vote-arrows"] faceplate-number',
    ],
    controlCss: [
      '[data-testid="vote-arrows"]',
      'shreddit-post [slot="credit-bar"]',
    ],
  },
];

const GUARDS: RouteGuard[] = [
  { key: 'blockPopular', redirectPrefixes: ['/r/popular', '/r/all'], to: '/' },
];

export const redditAdapter: PlatformAdapter = {
  rules: RULES,
  guards: GUARDS,
  grayscaleKey: 'grayscale',
  limitKey: 'limitFeed',
  limitSelector: 'shreddit-post, article',
  limitPath: '/',
};

export function buildRedditScript(
  config: Record<string, boolean | string>,
  limitCount = 10
): string {
  return buildFromAdapter(redditAdapter, config, limitCount);
}
