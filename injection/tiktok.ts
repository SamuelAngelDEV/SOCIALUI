import { buildScript, Rule, RouteGuard } from './engine';

/**
 * Rule keys match `FEATURES.tiktok`. TikTok's web DOM uses data-e2e attributes,
 * which are its automation hooks and reasonably stable.
 */
const RULES: Rule[] = [
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

export function buildTikTokScript(
  config: Record<string, boolean>,
  limitCount = 10
): string {
  // The root path IS the FYP, so the generic prefix guard can't express
  // "redirect exactly /" without catching everything. Handle it with CSS-safe
  // route logic here: prepend a tiny guard for the exact-root case.
  const script = buildScript({
    rules: RULES,
    guards: GUARDS,
    config,
    grayscaleKey: 'grayscale',
    limitKey: 'limitFeed',
    limitSelector: '[data-e2e="recommend-list-item-container"]',
    limitCount,
  });

  if (!config.blockFYP) return script;

  return `
    (function() {
      try {
        if (location.pathname === '/' ) location.replace('/following');
      } catch (e) {}
    })();
    ${script}
  `;
}
