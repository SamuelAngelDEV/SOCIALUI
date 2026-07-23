import { buildScript, Rule, RouteGuard } from './engine';

/**
 * Rule keys match `FEATURES.instagram` in constants/features.ts. Two or three
 * selectors per target — Instagram obfuscates class names, so anchor on
 * aria-label / href / data-* only. If one breaks, another catches.
 */
export const RULES: Rule[] = [
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
    // Search lives under /explore/search/ — exclude it, or blocking Explore
    // takes the search bar with it. The route guard has the same carve-out.
    css: [
      'a[href="/explore/"]',
      'a[href^="/explore/"]:not([href^="/explore/search"])',
      'svg[aria-label="Explore"]',
      'a:has(svg[aria-label="Explore"])',
    ],
  },
  {
    key: 'hideSearchBar',
    css: [
      'a[href^="/explore/search"]',
      'svg[aria-label="Search"]',
      'a:has(svg[aria-label="Search"])',
      'input[placeholder="Search"]',
    ],
  },
  {
    key: 'blockStories',
    css: ['div[role="menu"]:has(canvas)', 'ul:has(> li canvas)'],
  },
  {
    // Belt-and-suspenders CSS for badge overlays with stable aria labels. These
    // target the RED BADGE text/bubble only — never the icon or link — so the
    // activity and messages buttons stay visible and tappable. The scanner in
    // the engine is the robust fallback for badges without aria labels.
    key: 'hideBadges',
    css: [
      'span[aria-label*="new notification" i]',
      'span[aria-label*="unread notification" i]',
      '[aria-label*="new activity" i]',
    ],
  },
  {
    key: 'hideDmBadges',
    css: [
      'a[href^="/direct/"] span[aria-label*="unread" i]',
      'a[href^="/direct/"] span[aria-label*="new message" i]',
      '[aria-label*="unread message" i]',
    ],
  },
  {
    key: 'blockSuggested',
    // The header label is EXACTLY this text; exact match so a caption that merely
    // mentions "suggested for you" can't hide a real post.
    textHide: {
      probe: 'span, h2, h3',
      match: ['suggested for you', 'suggested posts', 'suggested reels'],
      exact: true,
      closest: 'article',
    },
  },
  {
    key: 'blockSponsored',
    textHide: {
      probe: 'span, a',
      match: ['sponsored', 'paid partnership'],
      exact: true,
      closest: 'article',
    },
  },
  {
    key: 'hideLikeCounts',
    // The liked_by href is gone from much of the current DOM, so the reliable
    // hook is the count text itself: exactly "169 likes" / "Liked by x and others".
    css: ['section a[href*="/liked_by/"]', 'a[href$="/liked_by/"]'],
    textHide: {
      probe: 'span, a, div[role="button"]',
      match: ['^liked by .{1,80}$', '^[\\d.,]+ ?[km]? ?likes?$', '^[\\d.,]+ ?[km]? ?others$'],
      regex: true,
      closest: 'span, a, div[role="button"]',
    },
  },
  {
    key: 'hideFollowerCounts',
    css: [
      'a[href$="/followers/"]',
      'a[href$="/following/"]',
      'li:has(a[href$="/followers/"])',
      'li:has(a[href$="/following/"])',
    ],
    textHide: {
      probe: 'span, a',
      match: ['^[\\d.,]+ ?[km]? ?followers$', '^[\\d.,]+ ?[km]? ?following$'],
      regex: true,
      closest: 'li',
    },
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
    dmBadgeKey: 'hideDmBadges',
    dmBadgeSelector: 'a[href^="/direct/"], a[href="/direct/inbox/"]',
  });
}
