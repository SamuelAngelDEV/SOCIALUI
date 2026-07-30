export type Rule = {
  /** Matches a feature key in the settings store. */
  key: string;
  /** CSS selectors hidden with `display: none` when the feature is on. */
  css?: string[];
  /** CSS selectors targeting interactive controls (buttons/links), not counts.
   *  Only applied when the metric is set to 'hidden-both'. */
  controlCss?: string[];
  /**
   * Selectors whose clicks are swallowed at the capture phase while the rule is
   * on. Hiding an element with CSS only works if we found it; a route guard only
   * fires after navigation has already happened. This stops the tap itself, so
   * the target never opens even when both of those miss.
   */
  clickBlock?: string[];
  /**
   * JS text pass, used where `:contains()` would be needed (not valid CSS).
   * Scans small `probe` elements; on a text hit, hides `el.closest(closest)`
   * (falls back to the probe itself). Matching is case-insensitive against the
   * probe's trimmed text: substring by default, whole-text with `exact`, or
   * RegExp sources with `regex` — exact/regex exist to stop caption
   * false-positives (a caption merely CONTAINING "sponsored" must not hide the
   * post; the sponsored label IS exactly "sponsored").
   */
  textHide?: {
    probe: string;
    match: string[];
    closest: string;
    exact?: boolean;
    regex?: boolean;
  };
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
  config: Record<string, boolean | string>;
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
  /**
   * Feature key controlling whether badges INSIDE the DM/messages link are hidden.
   * When off, DM unread badges are kept even while other badges are removed. The
   * icon itself is never touched — only the red overlay bubble.
   */
  dmBadgeKey?: string;
  /** Selector for the DM/messages link that a DM badge lives inside. */
  dmBadgeSelector?: string;
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
    dmBadgeKey,
    dmBadgeSelector,
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
    .filter((r) => {
      const v = config[r.key];
      return v && v !== 'visible' && (r.css?.length || r.controlCss?.length);
    })
    .map((r) => {
      const v = config[r.key];
      const selectors: string[] = [];
      if (r.css) selectors.push(...r.css);
      if (r.controlCss && v === 'hidden-both') selectors.push(...r.controlCss);
      // 'hidden-number' uses only r.css; boolean true uses r.css + controlCss
      if (r.controlCss && v === true) selectors.push(...r.controlCss);
      return selectors.length
        ? `${selectors.join(', ')} { display: none !important; }`
        : '';
    })
    .filter(Boolean)
    .join('\n');

  if (grayscaleKey && config[grayscaleKey]) {
    css += `\nhtml { filter: grayscale(1) !important; }`;
  }

  // Selectors whose taps get swallowed. Same activation test as the CSS above.
  // Kept as an array so the runtime can drop individually unparseable entries.
  const clickBlockSelectors = rules
    .filter((r) => {
      const v = config[r.key];
      return v && v !== 'visible' && r.clickBlock?.length;
    })
    .flatMap((r) => r.clickBlock ?? []);

  // No CSS nth-of-type cap: it miscounts skeleton posts and only works when
  // items are siblings. applyFeedLimit() caps by real, loaded posts instead.
  // No in-feed end message either — the full-screen native wall is the only
  // end-of-feed signal (the injected ::after version kept landing mid-feed
  // when Instagram reordered/virtualized posts, so it was removed).
  const limitActive = !!(limitKey && config[limitKey] && limitSelector);

  const activeTextRules = rules.filter((r) => {
    const v = config[r.key];
    return v && v !== 'visible' && r.textHide;
  });

  // Health beacon: collect active CSS selectors keyed by rule for one-time validation.
  const healthSelectors = rules
    .filter((r) => {
      const v = config[r.key];
      return v && v !== 'visible';
    })
    .flatMap((r) => {
      const sels: { key: string; selector: string }[] = [];
      if (r.css) sels.push(...r.css.map((s) => ({ key: r.key, selector: s })));
      const v = config[r.key];
      if (r.controlCss && (v === 'hidden-both' || v === true)) {
        sels.push(...r.controlCss.map((s) => ({ key: r.key, selector: s })));
      }
      return sels;
    });

  return `
    (function() {
      if (window.__quietApplied) return true;
      window.__quietApplied = true;

      var config = ${JSON.stringify(config)};
      var css = ${JSON.stringify(css)};
      var healthSelectors = ${JSON.stringify(healthSelectors)};
      var textRules = ${JSON.stringify(
        activeTextRules.map((r) => ({
          probe: r.textHide!.probe,
          match: r.textHide!.match.map((m) => (r.textHide!.regex ? m : m.toLowerCase())),
          closest: r.textHide!.closest,
          exact: !!r.textHide!.exact,
          regex: !!r.textHide!.regex,
        }))
      )};
      var guards = ${JSON.stringify(guards.filter((g) => config[g.key]))};
      var hideBadges = ${badgeKey ? JSON.stringify(!!config[badgeKey]) : 'false'};
      var hideDmBadges = ${dmBadgeKey ? JSON.stringify(!!config[dmBadgeKey]) : 'true'};
      var dmBadgeSelector = ${JSON.stringify(dmBadgeSelector || '')};
      var limitActive = ${JSON.stringify(limitActive)};
      var limitSelector = ${JSON.stringify(limitSelector || '')};
      var limitCount = ${JSON.stringify(limitCount)};
      var limitRequireDescendant = ${JSON.stringify(limitRequireDescendant || '')};
      var limitPath = ${JSON.stringify(limitPath || '')};
      var capHideRule = ${JSON.stringify(capHideRule)};
      var clickBlockSelectors = ${JSON.stringify(clickBlockSelectors)};

      function ensureStyle() {
        if (document.getElementById('quiet-blocks')) return;
        var style = document.createElement('style');
        style.id = 'quiet-blocks';
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
      }

      // Compile regex sources once.
      for (var tr = 0; tr < textRules.length; tr++) {
        if (textRules[tr].regex) {
          var compiled = [];
          for (var ts = 0; ts < textRules[tr].match.length; ts++) {
            try { compiled.push(new RegExp(textRules[tr].match[ts])); } catch (e) {}
          }
          textRules[tr].compiled = compiled;
        }
      }

      function textHits(rule, text) {
        if (rule.regex) {
          for (var c = 0; c < rule.compiled.length; c++) {
            if (rule.compiled[c].test(text)) return true;
          }
          return false;
        }
        for (var m = 0; m < rule.match.length; m++) {
          if (rule.exact ? text === rule.match[m] : text.indexOf(rule.match[m]) !== -1) {
            return true;
          }
        }
        return false;
      }

      function applyTextRules() {
        if (!textRules.length) return;
        for (var i = 0; i < textRules.length; i++) {
          try {
          var rule = textRules[i];
          var nodes = document.querySelectorAll(rule.probe);
          for (var j = 0; j < nodes.length; j++) {
            var node = nodes[j];
            var text = (node.textContent || '').trim();
            // Probes are labels/counters, not paragraphs — a long text can't be
            // a label, and skipping it keeps the scan cheap and caption-safe.
            if (!text || text.length > 140) continue;
            if (!textHits(rule, text.toLowerCase())) continue;
            var target = node.closest(rule.closest) || node;
            if (target.getAttribute('data-quiet-hidden')) continue;
            target.setAttribute('data-quiet-hidden', '1');
            target.style.setProperty('display', 'none', 'important');
          }
          } catch (e) {}
        }
      }

      // Track active scrolling so heavy passes don't reflow the page mid-scroll
      // (that is what makes the feed lurch to the next post). A trailing timer
      // re-runs them once scrolling settles.
      var lastScroll = 0;
      var scrollTimer = null;
      // Limit-wall state: capped = the cap style is live; wallSignaled = we already
      // told the app once for this cap (reset when the limit is raised).
      var isCapped = false;
      var wallSignaled = false;
      var wallGraceUntil = 0;
      // Running count of posts we've marked this feed session. Monotonic on
      // purpose — see applyFeedLimit().
      var markedTotal = 0;

      function maybeSignalWall() {
        if (!isCapped || wallSignaled) return;
        if (Date.now() < wallGraceUntil) return;
        var seenAll = false;
        if (canMeasure) {
          var kept = document.querySelectorAll('[data-quiet-keep]');
          var last = kept[kept.length - 1];
          if (!last) return;
          var rect = last.getBoundingClientRect();
          seenAll = rect.bottom <= window.innerHeight + 80;
        } else {
          // No-layout engines (tests): fall back to page-bottom proximity.
          var doc = document.documentElement;
          var bottom = (window.scrollY || window.pageYOffset || 0) + window.innerHeight;
          seenAll = bottom >= doc.scrollHeight - 200;
        }
        if (!seenAll) return;
        wallSignaled = true;
        try {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'quiet-limit-reached',
              limit: limitCount
            }));
          }
        } catch (e) {}
      }

      function onScroll() {
        lastScroll = Date.now();
        try { maybeSignalWall(); } catch (e) {}
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
          // Never touch an icon or a link — we only want the red overlay bubble,
          // so the messages/inbox button stays fully visible and clickable.
          if (el.querySelector && el.querySelector('svg, img, a, button')) continue;
          var tag = el.tagName;
          if (tag === 'A' || tag === 'BUTTON' || tag === 'SVG') continue;
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
              // If this badge sits on the DM/messages link, only hide it when the
              // DM sub-option is on — otherwise the unread count is kept.
              if (dmBadgeSelector && el.closest && el.closest(dmBadgeSelector)) {
                if (!hideDmBadges) continue;
              }
              toHide.push(el);
            }
          }
        }
        if (hideDmBadges && dmBadgeSelector) {
          var dmLinks = document.querySelectorAll(dmBadgeSelector);
          for (var d = 0; d < dmLinks.length; d++) {
            var inner = dmLinks[d].querySelectorAll('span, div');
            for (var j = 0; j < inner.length; j++) {
              var bel = inner[j];
              if (bel.getAttribute('data-quiet-badge')) continue;
              if (bel.querySelector && bel.querySelector('svg, img, a')) continue;
              var bt = (bel.textContent || '').trim();
              if (bt.length > 3) continue;
              if (bt && !/^\\d+\\+?$/.test(bt)) continue;
              var brect = bel.getBoundingClientRect();
              if (brect.width > 0 && brect.width <= 46 && brect.height <= 30) {
                var bbg = getComputedStyle(bel).backgroundColor;
                var bbefore = getComputedStyle(bel, '::before').backgroundColor;
                var bafter = getComputedStyle(bel, '::after').backgroundColor;
                var isRed = function(c) {
                  var cm = c.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
                  return cm && +cm[1] > 190 && +cm[2] < 95 && +cm[3] < 95;
                };
                if (isRed(bbg) || isRed(bbefore) || isRed(bafter)) {
                  toHide.push(bel);
                }
              }
            }
          }
        }
        for (var h = 0; h < toHide.length; h++) {           // writes, after all reads
          toHide[h].setAttribute('data-quiet-badge', '1');
          toHide[h].style.setProperty('display', 'none', 'important');
        }
      }

      // Cap the feed at exactly limitCount VISIBLE posts.
      //
      // Keeps are PERSISTENT: once a post is marked data-quiet-keep it stays kept
      // for the life of the page, even if the site later virtualizes it (guts its
      // content, removing the timestamp). Recounting from scratch each pass made
      // the kept window shift as posts virtualized — that was the glitching.
      //
      // Eligibility excludes posts the user can't see: ones another Quiet rule hid
      // (data-quiet-hidden / inline display:none) and, where the engine can
      // measure, ones the site itself renders invisibly. Counting an invisible
      // post as one of the N is how "5" showed only 4 posts.
      //
      // The end message is a ::after on the last kept post; the cap style hides
      // anything unmarked at first paint. Scoped to limitPath so post details and
      // profiles are untouched.

      // jsdom and other no-layout engines return no rects even for the root —
      // skip geometric visibility checks there and rely on the cheap checks.
      var canMeasure = false;
      try {
        canMeasure = document.documentElement.getClientRects().length > 0;
      } catch (e) {}

      function isEligiblePost(el) {
        if (el.hasAttribute('data-quiet-keep')) return false;   // already counted
        if (el.getAttribute('data-quiet-hidden')) return false; // hidden by our rules
        if (el.getAttribute('aria-hidden') === 'true') return false;
        if (el.style && el.style.display === 'none') return false;
        if (limitRequireDescendant && !el.querySelector(limitRequireDescendant)) return false;
        if (canMeasure && el.getClientRects().length === 0) return false; // invisible
        return true;
      }

      function applyFeedLimit() {
        if (!limitActive) return;

        var capStyleEl = document.getElementById('quiet-cap-style');
        var norm = function(p) { return p.replace(/\\/+$/, ''); };
        if (limitPath && norm(location.pathname) !== norm(limitPath)) {
          if (capStyleEl) capStyleEl.remove();   // off-feed page: never cap here
          isCapped = false;
          return;
        }

        // Instagram virtualizes off-screen posts OUT of the DOM, so counting
        // [data-quiet-keep] live walks the total backwards and the cap never
        // latches — the fill loop just keeps topping it up forever. That is why
        // a limit of 5 worked (reached before virtualization kicks in) while 10
        // scrolled without end. markedTotal only ever increments.
        var liveKept = document.querySelectorAll('[data-quiet-keep]').length;

        // An SPA navigation back to the feed rebuilds it and wipes every mark.
        // Without this, the cap style would hide an entirely unmarked feed and
        // leave the user staring at nothing. Capped with zero marks left means a
        // rebuild, not virtualization: while capped the kept posts are the only
        // visible content, so they cannot all scroll away.
        if (markedTotal >= limitCount && liveKept === 0) {
          markedTotal = 0;
          isCapped = false;
          wallSignaled = false;
          if (capStyleEl) {
            capStyleEl.remove();
            capStyleEl = null;
          }
        }

        // Fill remaining slots with eligible (visible, unhidden) posts, in order.
        if (markedTotal < limitCount) {
          var all = document.querySelectorAll(limitSelector);
          for (var i = 0; i < all.length && markedTotal < limitCount; i++) {
            if (isEligiblePost(all[i])) {
              all[i].setAttribute('data-quiet-keep', '1');
              markedTotal++;
            }
          }
        }

        if (markedTotal < limitCount) return;    // not at the cap yet

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
        isCapped = true;
      }

      // Called from the app when the user chooses "Show more" on the limit wall.
      // Raises the cap for this page session; the next pass re-marks keeps up to
      // the new count and re-arms the cap (and wall) at the new limit.
      window.__quietSetLimit = function(n) {
        try {
          limitCount = n;
          wallSignaled = false;
          isCapped = false;
          wallGraceUntil = Date.now() + 2000;
          var cs = document.getElementById('quiet-cap-style');
          if (cs) cs.remove();
          runPasses();
        } catch (e) {}
      };

      window.__quietDisableLimit = function() {
        try {
          limitActive = false;
          isCapped = false;
          wallSignaled = true;
          var cs = document.getElementById('quiet-cap-style');
          if (cs) cs.remove();
        } catch (e) {}
      };

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

      // Tell the app when the SPA navigates, so it can bucket time per section
      // (feed / reels / messages). Data never leaves the device — the app stores
      // it locally. lastHref starts empty so the first call reports the entry URL.
      var lastHref = '';
      function reportNav() {
        if (location.href === lastHref) return;
        lastHref = location.href;
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'quiet-nav',
            path: location.pathname
          }));
        }
      }

      // Every pass is wrapped so a thrown error in our code (a bad selector on an
      // old engine, a detached node) can never break or hang the host page.
      function runPasses() {
        try { reportNav(); } catch (e) {}
        try { ensureStyle(); } catch (e) {}
        try { applyTextRules(); } catch (e) {}
        try { guardRoute(); } catch (e) {}
        if (!ready) return;
        try { applyBadgeHide(); } catch (e) {}
        try { applyFeedLimit(); } catch (e) {}
      }

      var healthDone = false;
      function runHealthBeacon() {
        if (healthDone || !healthSelectors.length) return;
        healthDone = true;
        var broken = [];
        var zero = [];
        for (var h = 0; h < healthSelectors.length; h++) {
          var hs = healthSelectors[h];
          try {
            var count = document.querySelectorAll(hs.selector).length;
            if (count === 0) zero.push(hs);
          } catch (e) {
            broken.push(hs);
          }
        }
        if ((broken.length || zero.length) && window.ReactNativeWebView) {
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'quiet-health',
              broken: broken,
              zero: zero
            }));
          } catch (e) {}
        }
      }

      function markReady() {
        if (ready) return;
        ready = true;
        runPasses();
        try { runHealthBeacon(); } catch (e) {}
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

        // Swallow taps on blocked targets. CSS only helps if our selector found
        // the element, and the route guard only fires after navigation has
        // already started — by then the story viewer is open. Capture phase on
        // document runs before the site's own React handlers, so the open never
        // begins. Registered once, and only when a rule actually asked for it.
        if (clickBlockSelectors.length) {
          // Drop selectors this engine can't parse. closest() throws on an
          // unsupported form (:has() on an older WebView), which would otherwise
          // take every working selector down with it.
          var usableClick = [];
          for (var ci = 0; ci < clickBlockSelectors.length; ci++) {
            try {
              document.querySelector(clickBlockSelectors[ci]);
              usableClick.push(clickBlockSelectors[ci]);
            } catch (err) {}
          }
          var clickSel = usableClick.join(', ');

          if (clickSel) {
            var swallow = function(e) {
              try {
                var t = e.target;
                if (!t) return;
                // Text nodes have no closest(); climb to the nearest element.
                if (t.nodeType !== 1 && t.parentElement) t = t.parentElement;
                if (!t || !t.closest) return;
                if (t.closest(clickSel)) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                }
              } catch (err) {}
            };
            // pointerdown/touchstart included because the site may open on press
            // rather than waiting for a full click. Not passive — we preventDefault.
            document.addEventListener('click', swallow, true);
            document.addEventListener('pointerdown', swallow, true);
            document.addEventListener('touchstart', swallow, { capture: true, passive: false });
          }
        }

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
