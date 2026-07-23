import { buildScript, Rule, RouteGuard } from './engine';

/**
 * Rule keys match `FEATURES.twitter`. X's web app uses data-testid attributes
 * extensively — the most stable anchors of any platform we wrap.
 */
export const RULES: Rule[] = [
  {
    key: 'hideForYou',
    // The "For You" tab in the home timeline switcher. Text pass, since the two
    // tabs are identical markup apart from the label.
    textHide: {
      probe: 'span',
      match: ['for you'],
      exact: true,
      closest: 'div[role="presentation"]',
    },
  },
  {
    key: 'blockTrending',
    css: [
      'a[href="/explore"]',
      'a[href^="/explore/"]',
      '[aria-label="Timeline: Trending now"]',
      '[data-testid="sidebarColumn"] section',
    ],
  },
  {
    key: 'blockWhoToFollow',
    css: ['[data-testid="UserCell"]'],
    textHide: {
      probe: 'span, h2',
      match: ['who to follow'],
      exact: true,
      closest: 'aside, section',
    },
  },
  {
    key: 'hideMetrics',
    // The animated count containers inside reply/repost/like buttons.
    css: [
      '[data-testid="reply"] [data-testid="app-text-transition-container"]',
      '[data-testid="retweet"] [data-testid="app-text-transition-container"]',
      '[data-testid="like"] [data-testid="app-text-transition-container"]',
      '[data-testid="unlike"] [data-testid="app-text-transition-container"]',
      'a[href$="/analytics"]',
    ],
  },
  {
    key: 'blockPromoted',
    // Exact match: the label span is exactly "Promoted"/"Ad". Substring matching
    // here would hide any tweet whose text contains "ad".
    textHide: {
      probe: 'span',
      match: ['promoted', 'ad'],
      exact: true,
      closest: 'article[data-testid="tweet"]',
    },
  },
  {
    key: 'blockGrok',
    css: [
      'a[href="/i/grok"]',
      'a[href^="/i/grok"]',
      '[data-testid="GrokDrawer"]',
      'button[aria-label="Grok actions"]',
    ],
  },
];

const GUARDS: RouteGuard[] = [
  {
    key: 'blockTrending',
    redirectPrefixes: ['/explore'],
    to: '/home',
  },
  {
    key: 'dmsOnly',
    redirectPrefixes: ['/'],
    allowPrefixes: ['/messages', '/i/'], // /i/ hosts compose + media internals
    to: '/messages',
  },
];

export function buildTwitterScript(
  config: Record<string, boolean>,
  limitCount = 10
): string {
  return buildScript({
    rules: RULES,
    guards: GUARDS,
    config,
    grayscaleKey: 'grayscale',
    limitKey: 'limitFeed',
    limitSelector: 'article[data-testid="tweet"]',
    limitCount,
    limitPath: '/home', // cap only the home timeline, not threads or profiles
  });
}
