export type Rule = {
  /** Matches a feature key in the settings store. */
  key: string;
  /** CSS selectors hidden with `display: none` when the feature is on. */
  css?: string[];
  /**
   * JS text pass: hide the nearest `ancestor` of any element whose trimmed text
   * equals one of `match`. Used where `:contains()` would be needed (it is not
   * valid CSS). Case-insensitive.
   */
  textHide?: { match: string[]; ancestor: string };
};

export type RouteGuard = {
  /** Feature key that enables this guard. */
  key: string;
  /** Pathname prefixes that trigger a redirect to `to` (checked with startsWith). */
  redirectPrefixes: string[];
  /** Pathname prefixes exempted from the redirect (e.g. keep search working). */
  allowPrefixes?: string[];
  to: string;
};

export type BuildScriptArgs = {
  rules: Rule[];
  guards?: RouteGuard[];
  config: Record<string, boolean>;
  /** Feature key that, when on, applies `filter: grayscale(1)` to the page. */
  grayscaleKey?: string;
  /** Feature key that caps the feed; hides list items past `limitCount`. */
  limitKey?: string;
  /** CSS selector for the repeating feed item to cap (e.g. 'article'). */
  limitSelector?: string;
  limitCount?: number;
  /**
   * If set, a feed item only counts when it contains a descendant matching this
   * selector — used to skip skeleton placeholders (e.g. 'time' on Instagram,
   * which real posts have and placeholders don't).
   */
  limitRequireDescendant?: string;
  /**
   * Exact pathname of the page the cap applies to (e.g. '/' for the Instagram
   * feed). Elsewhere — post details, profiles — the cap style is removed so the
   * hide-unmarked rule can't swallow their content.
   */
  limitPath?: string;
  /**
   * Feature key that hides red notification badges. Keys on the visual (a small
   * element with a red background) rather than markup, so it survives class-name
   * obfuscation. Only safe on sites where red is not part of the chrome.
   */
  badgeKey?: string;
};

/**
 * Returns a self-contained IIFE string for WebView injection. Static work (CSS,
 * config) is serialized at build time; the runtime only re-attaches the style node
 * and runs the debounced text/route passes as the SPA mutates.
 */
export function buildScript(args: BuildScriptArgs): string {
  const {
    rules,
    guards = [],
    config,
    grayscaleKey,
    limitKey,
    limitSelector,
    limitCount = 20,
    limitRequireDescendant,
    limitPath,
    badgeKey,
  } = args;

  // The at-cap style pre-hides any post we haven't explicitly marked as kept, so
  // late-arriving posts never paint (not even for one frame). Built per comma part
  // so multi-selector limitSelectors ('shreddit-post, article') work.
  const capHideRule = (limitSelector || '')
    .split(',')
    .map((part) => `${part.trim()}:not([data-quiet-keep])`)
    .join(', ');

  // --- CSS built once, at build time ---
  let css = rules
    .filter((r) => config[r.key] && r.css && r.css.length)
    .map((r) => `${r.css!.join(', ')} { display: none !important; }`)
    .join('\n');

  if (grayscaleKey && config[grayscaleKey]) {
    css += `\nhtml { filter: grayscale(1) !important; }`;
  }

  const limitActive = !!(limitKey && config[limitKey] && limitSelector);
  if (limitActive) {
    // No CSS nth-of-type cap: it miscounts skeleton posts and only works when
    // items are siblings. applyFeedLimit() caps by real, loaded posts instead.
    //
    // End message is a ::after pseudo-element on the LAST KEPT post — no DOM node
    // of ours ever sits inside the site's React tree (crash-safe), and it renders
    // exactly under the final post. Inert until data-quiet-last is set at cap time.
    css += `
[data-quiet-last]::after{content:"You\\2019re all caught up";display:block;padding:40px 20px 72px;text-align:center;font-family:-apple-system,system-ui,sans-serif;font-size:17px;font-weight:600;color:#1A1A1A;animation:quiet-bounce-in .5s cubic-bezier(.2,.8,.3,1.2) both;}
@keyframes quiet-bounce-in{0%{transform:translateY(14px);opacity:0}60%{transform:translateY(-4px);opacity:1}100%{transform:translateY(0);opacity:1}}`;
  }

  const activeTextRules = rules.filter((r) => config[r.key] && r.textHide);

  return `
    (function() {
      if (window.__quietApplied) return true;
      window.__quietApplied = true;

      var config = ${JSON.stringify(config)};
      var css = ${JSON.stringify(css)};
      var textRules = ${JSON.stringify(
        activeTextRules.map((r) => ({
          match: r.textHide!.match.map((m) => m.toLowerCase()),
          ancestor: r.textHide!.ancestor,
        }))
      )};
      var guards = ${JSON.stringify(guards.filter((g) => config[g.key]))};
      var hideBadges = ${badgeKey ? JSON.stringify(!!config[badgeKey]) : 'false'};
      var limitActive = ${JSON.stringify(limitActive)};
      var limitSelector = ${JSON.stringify(limitSelector || '')};
      var limitCount = ${JSON.stringify(limitCount)};
      var limitRequireDescendant = ${JSON.stringify(limitRequireDescendant || '')};
      var limitPath = ${JSON.stringify(limitPath || '')};
      var capHideRule = ${JSON.stringify(capHideRule)};

      function ensureStyle() {
        if (document.getElementById('quiet-blocks')) return;
        var style = document.createElement('style');
        style.id = 'quiet-blocks';
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
      }

      function applyTextRules() {
        if (!textRules.length) return;
        for (var i = 0; i < textRules.length; i++) {
          var rule = textRules[i];
          var nodes = document.querySelectorAll(rule.ancestor);
          for (var j = 0; j < nodes.length; j++) {
            var node = nodes[j];
            if (node.getAttribute('data-quiet-hidden')) continue;
            var text = (node.textContent || '').trim().toLowerCase();
            for (var k = 0; k < rule.match.length; k++) {
              if (text.indexOf(rule.match[k]) !== -1) {
                node.setAttribute('data-quiet-hidden', '1');
                node.style.setProperty('display', 'none', 'important');
                break;
              }
            }
          }
        }
      }

      // Track active scrolling so heavy passes don't reflow the page mid-scroll
      // (that is what makes the feed lurch to the next post). A trailing timer
      // re-runs them once scrolling settles.
      var lastScroll = 0;
      var scrollTimer = null;
      function onScroll() {
        lastScroll = Date.now();
        if (scrollTimer) return;
        scrollTimer = setTimeout(function() {
          scrollTimer = null;
          runPasses();
        }, 200);
      }

      // Red notification badges (counts, dots, the follow-request pill) have no
      // stable markup, but they are all small elements with a red background.
      // Reads (computed style, layout) are batched before any writes so we never
      // force synchronous layout in the middle of the scan.
      var lastBadgeScan = 0;
      function applyBadgeHide() {
        if (!hideBadges) return;
        if (Date.now() - lastScroll < 180) return;         // skip during active scroll
        var now = Date.now();
        if (now - lastBadgeScan < 500) return;
        lastBadgeScan = now;

        var nodes = document.querySelectorAll('span, div');
        var toHide = [];
        for (var i = 0; i < nodes.length; i++) {
          var el = nodes[i];
          if (el.getAttribute('data-quiet-badge')) continue;
          if (el.children.length > 1) continue;            // badges are leaf-ish
          var t = (el.textContent || '').trim();
          if (t.length > 3) continue;                      // count or empty dot
          if (t && !/^\\d+\\+?$/.test(t)) continue;         // digits (or "9+") or empty
          var bg = getComputedStyle(el).backgroundColor;   // read
          var m = bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
          if (!m) continue;
          var red = +m[1], green = +m[2], blue = +m[3];
          if (red > 190 && green < 95 && blue < 95) {       // Instagram-red family
            var rect = el.getBoundingClientRect();          // read
            if (rect.width > 0 && rect.width <= 46 && rect.height <= 30) {
              toHide.push(el);
            }
          }
        }
        for (var h = 0; h < toHide.length; h++) {           // writes, after all reads
          toHide[h].setAttribute('data-quiet-badge', '1');
          toHide[h].style.setProperty('display', 'none', 'important');
        }
      }

      // Cap the feed by real, loaded posts (skeletons lack limitRequireDescendant
      // and never count). At cap time the first N posts are MARKED as kept and a
      // style is injected that hides anything unmarked at first paint — so a
      // late-arriving post can never flash on screen, even for one frame. The end
      // message is a ::after on the last kept post (styled in the base CSS): no
      // node of ours inside the site's React tree, always positioned right under
      // the final post. Scoped to limitPath so post details/profiles are untouched.
      function applyFeedLimit() {
        if (!limitActive) return;

        var capStyleEl = document.getElementById('quiet-cap-style');
        var norm = function(p) { return p.replace(/\\/+$/, ''); };
        if (limitPath && norm(location.pathname) !== norm(limitPath)) {
          if (capStyleEl) capStyleEl.remove();   // off-feed page: never cap here
          return;
        }

        var all = document.querySelectorAll(limitSelector);
        var real = [];
        for (var i = 0; i < all.length; i++) {
          if (!limitRequireDescendant || all[i].querySelector(limitRequireDescendant)) {
            real.push(all[i]);
          }
        }
        if (real.length < limitCount) return;    // not at the cap yet

        // Mark the kept set; the cap style hides everything else at paint time.
        var last = real[limitCount - 1];
        for (var k = 0; k < limitCount; k++) {
          if (!real[k].hasAttribute('data-quiet-keep')) {
            real[k].setAttribute('data-quiet-keep', '1');
          }
          if (real[k] !== last && real[k].hasAttribute('data-quiet-last')) {
            real[k].removeAttribute('data-quiet-last');
          }
        }
        if (!last.hasAttribute('data-quiet-last')) {
          last.setAttribute('data-quiet-last', '1');
        }

        if (!capStyleEl) {
          var capStyle = document.createElement('style');
          capStyle.id = 'quiet-cap-style';
          capStyle.textContent =
            // Anything unmarked never paints — kills the one-frame flash.
            capHideRule + ' { display: none !important; }\\n' +
            // Pagination loader hidden too; its IntersectionObserver then reads
            // "not visible" and the site stops fetching more.
            '[data-visualcompletion="loading-state"],' +
            'svg[aria-label="Loading..."],' +
            '[role="progressbar"] { display: none !important; }';
          (document.head || document.documentElement).appendChild(capStyle);
        }
      }

      function guardRoute() {
        var path = location.pathname;
        for (var i = 0; i < guards.length; i++) {
          var g = guards[i];
          var allowed = false;
          if (g.allowPrefixes) {
            for (var a = 0; a < g.allowPrefixes.length; a++) {
              if (path.indexOf(g.allowPrefixes[a]) === 0) { allowed = true; break; }
            }
          }
          if (allowed) continue;
          for (var p = 0; p < g.redirectPrefixes.length; p++) {
            if (path.indexOf(g.redirectPrefixes[p]) === 0) {
              if (path !== g.to) location.replace(g.to);
              return;
            }
          }
        }
      }

      // Passes that touch layout (badge scan reads computed style / bounding rects,
      // feed cap hides posts) can wedge the host's own visibility logic if they run
      // while the feed is still loading — that is the endless-spinner bug. So they
      // are gated behind "ready", flipped on shortly AFTER the page finishes loading.
      // The cheap passes (style tag, text rules, route guard) run immediately.
      var ready = false;

      // Every pass is wrapped so a thrown error in our code (a bad selector on an
      // old engine, a detached node) can never break or hang the host page.
      function runPasses() {
        try { ensureStyle(); } catch (e) {}
        try { applyTextRules(); } catch (e) {}
        try { guardRoute(); } catch (e) {}
        if (!ready) return;
        try { applyBadgeHide(); } catch (e) {}
        try { applyFeedLimit(); } catch (e) {}
      }

      function markReady() {
        if (ready) return;
        ready = true;
        runPasses();
      }

      runPasses();

      // SPAs mutate constantly; coalesce to one pass per frame.
      var queued = false;
      try {
        new MutationObserver(function() {
          if (queued) return;
          queued = true;
          requestAnimationFrame(function() {
            queued = false;
            runPasses();
          });
        }).observe(document.documentElement, { childList: true, subtree: true });

        // Capture-phase so inner scroll containers count too.
        window.addEventListener('scroll', onScroll, { capture: true, passive: true });

        // Stay out of the way until the feed has had time to load.
        if (document.readyState === 'complete') {
          setTimeout(markReady, 800);
        } else {
          window.addEventListener('load', function() { setTimeout(markReady, 800); });
        }
      } catch (e) {}

      true;
    })();
  `;
}
