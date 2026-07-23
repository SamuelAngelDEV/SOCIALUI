import { buildScript, Rule, RouteGuard } from './engine';

/**
 * Rule keys match `FEATURES.linkedin`. LinkedIn's web classes are BEM-style and
 * comparatively stable (feed-shared-update-v2, notification-badge, etc.).
 */
export const RULES: Rule[] = [
  {
    key: 'hideFeed',
    // Hide the home feed stream but keep the rest of the page (nav, search,
    // messaging entry points) usable.
    css: [
      'main [data-finite-scroll-hotkey-context="FEED"]',
      'main .scaffold-finite-scroll',
      '.feed-container',
    ],
  },
  {
    key: 'blockNews',
    css: ['[data-view-name="news-module"]', 'aside[aria-label="LinkedIn News"]', '#news-module'],
    textHide: {
      probe: 'span, h2',
      match: ['linkedin news'],
      exact: true,
      closest: 'aside, section',
    },
  },
  {
    key: 'hideBadgeCounts',
    css: ['.notification-badge', '[data-test-notification-badge]'],
  },
  {
    key: 'hideReactionCounts',
    css: [
      '.social-details-social-counts',
      '.social-proof-fact',
      'ul.social-details-social-counts__list',
    ],
  },
];

const GUARDS: RouteGuard[] = [
  {
    key: 'dmsOnly',
    redirectPrefixes: ['/'],
    allowPrefixes: ['/messaging'],
    to: '/messaging/',
  },
];

export function buildLinkedInScript(
  config: Record<string, boolean>,
  limitCount = 10
): string {
  return buildScript({
    rules: RULES,
    guards: GUARDS,
    config,
    grayscaleKey: 'grayscale',
    limitKey: 'limitFeed',
    limitSelector: '.feed-shared-update-v2, div[data-urn]',
    limitCount,
    limitPath: '/feed', // cap only the home feed ('/feed/' normalizes to this)
  });
}
