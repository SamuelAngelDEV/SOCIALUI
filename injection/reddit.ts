import { buildScript, Rule, RouteGuard } from './engine';

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
  },
];

const GUARDS: RouteGuard[] = [
  { key: 'blockPopular', redirectPrefixes: ['/r/popular', '/r/all'], to: '/' },
];

export function buildRedditScript(
  config: Record<string, boolean>,
  limitCount = 10
): string {
  return buildScript({
    rules: RULES,
    guards: GUARDS,
    config,
    grayscaleKey: 'grayscale',
    limitKey: 'limitFeed',
    limitSelector: 'shreddit-post, article',
    limitCount,
    limitPath: '/', // cap only the home feed, not subreddits or comment pages
  });
}
