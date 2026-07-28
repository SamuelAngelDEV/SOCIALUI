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
    css: ['section a[href*="/liked_by/"]', 'a[href$="/liked_by/"]'],
    controlCss: [
      'svg[aria-label="Like"]',
      'svg[aria-label="Unlike"]',
      'div[role="button"]:has(> svg[aria-label="Like"])',
      'div[role="button"]:has(> svg[aria-label="Unlike"])',
    ],
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
      'a[href$="/followers/"] span',
      'a[href$="/following/"] span',
    ],
    textHide: {
      probe: 'span, a',
      match: ['^[\\d.,]+ ?[km]? ?followers$', '^[\\d.,]+ ?[km]? ?following$'],
      regex: true,
      closest: 'span, a',
    },
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
    // Everything that isn't the inbox bounces to the inbox. '/reel/' is allowed
    // so a Reel a friend sent in a chat can still be opened — the DM-reel logic
    // below blocks any reel NOT reached from a chat.
    redirectPrefixes: ['/'],
    allowPrefixes: ['/direct', '/reel/'],
    to: '/direct/inbox/',
  },
];

/**
 * Reels shared in DMs.
 *
 * A Reel a friend sends is worth watching; the endless queue after it is not.
 * This runs only when Block Reels is on and:
 *   - remembers the chat you were in when a Reel opens (`/reel/{id}`),
 *   - locks scrolling on that Reel so a swipe can't advance to the next one,
 *   - blocks any Reel NOT opened from a chat (those go home, as before),
 *   - returns you to that same chat when you leave the Reel.
 *
 * The origin chat is kept in sessionStorage so it survives the page reloads
 * Instagram sometimes does mid-navigation. Listeners are attached only while
 * locked — a permanent non-passive touchmove listener would degrade scrolling
 * everywhere else in the app.
 */
function dmReelGuard(config: Record<string, boolean | string>): string {
  if (!config.blockReels) return '';
  return `
    (function() {
      try {
        if (window.__quietDmReel) return;
        window.__quietDmReel = true;

        var KEY = 'quiet-dm-reel-origin';
        var locked = false;
        var lastPath = null;

        function isSingleReel(p) { return p.indexOf('/reel/') === 0; }
        function isChat(p) { return p.indexOf('/direct/') === 0; }
        function getOrigin() { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } }
        function setOrigin(v) {
          try { v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY); } catch (e) {}
        }

        function stopMove(e) { if (locked) e.preventDefault(); }
        function stopKeys(e) {
          if (!locked) return;
          var k = e.key;
          if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'PageDown' ||
              k === 'PageUp' || k === ' ') e.preventDefault();
        }

        function setLock(on) {
          if (on === locked) return;
          locked = on;
          var el = document.getElementById('quiet-reel-lock');
          if (on) {
            if (!el) {
              var s = document.createElement('style');
              s.id = 'quiet-reel-lock';
              // Lock the page and any inner scroller the Reel viewer uses;
              // pan-x keeps horizontal gestures (dismiss) working.
              s.textContent =
                'html,body{overflow:hidden !important;overscroll-behavior:none !important;}' +
                'main,main *{overscroll-behavior:none !important;scroll-snap-type:none !important;}' +
                'body{touch-action:pan-x !important;}';
              (document.head || document.documentElement).appendChild(s);
            }
            document.addEventListener('touchmove', stopMove, { passive: false, capture: true });
            document.addEventListener('wheel', stopMove, { passive: false, capture: true });
            document.addEventListener('keydown', stopKeys, true);
          } else {
            if (el) el.remove();
            document.removeEventListener('touchmove', stopMove, true);
            document.removeEventListener('wheel', stopMove, true);
            document.removeEventListener('keydown', stopKeys, true);
          }
        }

        function onPath(path, prev) {
          if (isSingleReel(path)) {
            // Opened straight from a chat — remember which one.
            if (prev && isChat(prev)) setOrigin(prev);
            if (getOrigin()) {
              setLock(true);           // watchable, but going nowhere
            } else {
              setLock(false);
              location.replace('/');   // reel not reached from a chat
            }
            return;
          }

          setLock(false);
          var origin = getOrigin();
          if (origin) {
            if (isChat(path)) {
              setOrigin(null);         // already back in messages
            } else {
              setOrigin(null);
              location.replace(origin); // send them back to the friend's chat
            }
          }
        }

        function tick() {
          var path = location.pathname;
          if (path === lastPath) return;
          var prev = lastPath;
          lastPath = path;
          try { onPath(path, prev); } catch (e) {}
        }

        tick();
        setInterval(tick, 250);
        window.addEventListener('popstate', tick);
      } catch (e) {}
    })();
  `;
}

export function buildInstagramScript(
  config: Record<string, boolean | string>,
  limitCount = 10
): string {
  return dmReelGuard(config) + buildScript({
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
