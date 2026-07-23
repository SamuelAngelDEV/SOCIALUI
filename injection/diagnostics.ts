import { PlatformId } from '@/constants/platforms';
import { Rule } from './engine';
import { RULES as instagramRules } from './instagram';
import { RULES as youtubeRules } from './youtube';
import { RULES as twitterRules } from './twitter';
import { RULES as tiktokRules } from './tiktok';
import { RULES as facebookRules } from './facebook';
import { RULES as redditRules } from './reddit';
import { RULES as linkedinRules } from './linkedin';

export const RULES_BY_PLATFORM: Partial<Record<PlatformId, Rule[]>> = {
  instagram: instagramRules,
  youtube: youtubeRules,
  twitter: twitterRules,
  tiktok: tiktokRules,
  facebook: facebookRules,
  reddit: redditRules,
  linkedin: linkedinRules,
};

export type DiagnosticResult = {
  key: string;
  kind: 'css' | 'text';
  selector: string;
  count: number;
};

/**
 * Builds a script that HIDES NOTHING — it only counts, per selector, how many
 * elements the live page currently matches, and reports back. Zero matches on a
 * page where the element exists means the selector has drifted.
 */
export function buildDiagnosticScript(platform: PlatformId): string {
  const rules = RULES_BY_PLATFORM[platform] ?? [];
  const probes = rules.map((r) => ({
    key: r.key,
    css: r.css ?? [],
    textHide: r.textHide
      ? {
          probe: r.textHide.probe,
          match: r.textHide.regex
            ? r.textHide.match
            : r.textHide.match.map((m) => m.toLowerCase()),
          exact: !!r.textHide.exact,
          regex: !!r.textHide.regex,
        }
      : null,
  }));

  return `
    (function() {
      var probes = ${JSON.stringify(probes)};

      function run() {
        var results = [];
        for (var i = 0; i < probes.length; i++) {
          var p = probes[i];
          for (var s = 0; s < p.css.length; s++) {
            var count = -1; // -1 = selector itself is invalid in this engine
            try { count = document.querySelectorAll(p.css[s]).length; } catch (e) {}
            results.push({ key: p.key, kind: 'css', selector: p.css[s], count: count });
          }
          if (p.textHide) {
            var hits = 0;
            try {
              var regs = [];
              if (p.textHide.regex) {
                for (var r = 0; r < p.textHide.match.length; r++) {
                  try { regs.push(new RegExp(p.textHide.match[r])); } catch (e) {}
                }
              }
              var nodes = document.querySelectorAll(p.textHide.probe);
              for (var n = 0; n < nodes.length; n++) {
                var text = (nodes[n].textContent || '').trim();
                if (!text || text.length > 140) continue;
                var lower = text.toLowerCase();
                var hit = false;
                if (p.textHide.regex) {
                  for (var g = 0; g < regs.length; g++) if (regs[g].test(lower)) { hit = true; break; }
                } else {
                  for (var m = 0; m < p.textHide.match.length; m++) {
                    if (p.textHide.exact ? lower === p.textHide.match[m] : lower.indexOf(p.textHide.match[m]) !== -1) { hit = true; break; }
                  }
                }
                if (hit) hits++;
              }
            } catch (e) {}
            results.push({ key: p.key, kind: 'text', selector: p.textHide.probe, count: hits });
          }
        }
        try {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'quiet-diagnostic',
              path: location.pathname,
              results: results
            }));
          }
        } catch (e) {}
      }

      // Let the SPA render before counting; run twice in case content is slow.
      setTimeout(run, 3000);
      setTimeout(run, 8000);
      true;
    })();
  `;
}
