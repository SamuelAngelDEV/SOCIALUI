import { buildScript, Rule, RouteGuard } from './engine';
import { PlatformAdapter, buildFromAdapter } from './adapter';

/**
 * Rule keys match `FEATURES.tiktok`. TikTok's web DOM uses data-e2e attributes,
 * which are its automation hooks and reasonably stable.
 */
export const RULES: Rule[] = [
  {
    key: 'blockLive',
    css: [
      'a[href="/live"]',
      'a[href^="/live"]',
      '[data-e2e="nav-live"]',
      '[data-e2e="live-card"]',
    ],
  },
];

const GUARDS: RouteGuard[] = [
  {
    key: 'blockFYP',
    // The FYP lives at the root and /foryou. Following feed stays reachable.
    redirectPrefixes: ['/foryou', '/en/'],
    to: '/following',
  },
  {
    key: 'blockLive',
    redirectPrefixes: ['/live'],
    to: '/following',
  },
  {
    key: 'dmsOnly',
    redirectPrefixes: ['/'],
    allowPrefixes: ['/messages'],
    to: '/messages',
  },
];

// The root path IS the FYP, so the generic prefix guard can't express
// "redirect exactly /" without catching everything.
function fypRootGuard(config: Record<string, boolean | string>): string {
  if (!config.blockFYP) return '';
  return `
    (function() {
      try {
        if (location.pathname === '/' ) location.replace('/following');
      } catch (e) {}
    })();
  `;
}

export const tiktokAdapter: PlatformAdapter = {
  rules: RULES,
  guards: GUARDS,
  grayscaleKey: 'grayscale',
  limitKey: 'limitFeed',
  limitSelector: '[data-e2e="recommend-list-item-container"]',
  preamble: fypRootGuard,
};

export function buildTikTokScript(
  config: Record<string, boolean | string>,
  limitCount = 10
): string {
  return buildFromAdapter(tiktokAdapter, config, limitCount);
}
