import { buildScript, Rule, RouteGuard } from './engine';

/**
 * Rule keys match `FEATURES.instagram` in constants/features.ts. Two or three
 * selectors per target — Instagram obfuscates class names, so anchor on
 * aria-label / href / data-* only. If one breaks, another catches.
 */
const RULES: Rule[] = [
  {
    key: 'blockReels',
    // Only the Reels tab/nav — NOT whole posts. Hiding an <article> by its inner
    // content collapses real posts mid-carousel and jumps the feed, so those broad
    // `article:has(reel)` selectors were removed. The route guard below still keeps
    // the Reels tab itself unreachable.
    css: [
      'a[href="/reels/"]',
      'a[href^="/reels/"]',
      'svg[aria-label="Reels"]',
      'a:has(svg[aria-label="Reels"])',
      '[role="tablist"] a[href*="/reels"]',
    ],
  },
  {
    key: 'blockExplore',
    css: [
      'a[href="/explore/"]',
      'a[href^="/explore/"]',
      'svg[aria-label="Explore"]',
      'a:has(svg[aria-label="Explore"])',
    ],
  },
  {
    key: 'blockStories',
    css: ['div[role="menu"]:has(canvas)', 'ul:has(> li canvas)'],
  },
  {
    key: 'blockSuggested',
    // "Suggested for you" / "Suggested posts" headers sit above suggested content.
    textHide: { match: ['suggested for you', 'suggested posts'], ancestor: 'article, section' },
  },
  {
    key: 'blockSponsored',
    textHide: { match: ['sponsored'], ancestor: 'article' },
  },
  {
    key: 'hideLikeCounts',
    css: ['section a[href*="/liked_by/"]', 'a[href$="/liked_by/"]'],
  },
  {
    key: 'hideFollowerCounts',
    css: [
      'a[href$="/followers/"]',
      'a[href$="/following/"]',
      'li:has(a[href$="/followers/"])',
      'li:has(a[href$="/following/"])',
    ],
  },
  // Per-element customization. Hide both the icon and its button wrapper.
  {
    key: 'hideLikeButton',
    css: [
      'svg[aria-label="Like"]',
      'svg[aria-label="Unlike"]',
      'div[role="button"]:has(> svg[aria-label="Like"])',
      'div[role="button"]:has(> svg[aria-label="Unlike"])',
    ],
  },
  {
    key: 'hideCommentButton',
    css: [
      'svg[aria-label="Comment"]',
      'div[role="button"]:has(> svg[aria-label="Comment"])',
      'a:has(> svg[aria-label="Comment"])',
    ],
  },
  {
    key: 'hideShareButton',
    css: [
      'svg[aria-label="Share Post"]',
      'svg[aria-label="Share"]',
      'div[role="button"]:has(> svg[aria-label="Share Post"])',
    ],
  },
  {
    key: 'hideSaveButton',
    css: [
      'svg[aria-label="Save"]',
      'svg[aria-label="Remove"]',
      'div[role="button"]:has(> svg[aria-label="Save"])',
    ],
  },
];

const GUARDS: RouteGuard[] = [
  {
    key: 'blockExplore',
    redirectPrefixes: ['/explore'],
    allowPrefixes: ['/explore/search'], // keep search working
    to: '/',
  },
  {
    key: 'blockReels',
    redirectPrefixes: ['/reels'],
    to: '/',
  },
  {
    key: 'dmsOnly',
    // Everything that isn't the inbox bounces to the inbox.
    redirectPrefixes: ['/'],
    allowPrefixes: ['/direct'],
    to: '/direct/inbox/',
  },
];

export function buildInstagramScript(
  config: Record<string, boolean>,
  limitCount = 10
): string {
  return buildScript({
    rules: RULES,
    guards: GUARDS,
    config,
    grayscaleKey: 'grayscale',
    limitKey: 'limitFeed',
    limitSelector: 'main article',
    limitCount,
    limitRequireDescendant: 'time', // skip skeleton posts (no timestamp yet)
    limitPath: '/', // cap only the home feed, never post details or profiles
    badgeKey: 'hideBadges',
  });
}
