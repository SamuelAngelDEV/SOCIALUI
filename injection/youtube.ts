import { buildScript, Rule, RouteGuard } from './engine';

/**
 * Rule keys match `FEATURES.youtube` in constants/features.ts. Targets are the
 * mobile web (m.youtube.com) DOM, which uses ytm-* custom elements.
 */
const RULES: Rule[] = [
  {
    key: 'blockShorts',
    css: [
      'ytm-pivot-bar-item-renderer:has(a[href="/shorts"])',
      'a[href^="/shorts"]',
      'ytm-rich-section-renderer:has(a[href^="/shorts"])',
      'ytm-reel-shelf-renderer',
      '[is-shorts]',
    ],
  },
  {
    key: 'blockRecommendations',
    css: [
      'ytm-rich-grid-renderer',
      'ytm-browse[page-subtype="home"] ytm-section-list-renderer',
    ],
  },
  {
    key: 'searchOnly',
    // Hide everything on the home browse surface; the search bar lives in the header.
    css: ['ytm-browse[page-subtype="home"]', 'ytm-pivot-bar-renderer'],
  },
  {
    key: 'blockSponsored',
    css: ['ytm-promoted-video-renderer', 'ytm-companion-slot-renderer', '.ad-container'],
    textHide: { match: ['sponsored'], ancestor: 'ytm-rich-item-renderer, ytm-video-with-context-renderer' },
  },
  {
    key: 'hideViewCounts',
    // View counts live in the metadata line; hidden by aria where possible.
    css: ['span[aria-label*="views"]', '.ytm-view-count'],
  },
  {
    key: 'hideLikeCounts',
    css: ['button[aria-label*="like this video"] .yt-spec-button-shape-next__button-text-content'],
  },
];

const GUARDS: RouteGuard[] = [
  {
    key: 'blockShorts',
    redirectPrefixes: ['/shorts'],
    to: '/',
  },
];

export function buildYouTubeScript(
  config: Record<string, boolean>,
  limitCount = 10
): string {
  return buildScript({
    rules: RULES,
    guards: GUARDS,
    config,
    grayscaleKey: 'grayscale',
    limitKey: 'limitFeed',
    limitSelector: 'ytm-rich-item-renderer',
    limitCount,
    limitPath: '/', // cap only the home grid, not search results or watch pages
  });
}
