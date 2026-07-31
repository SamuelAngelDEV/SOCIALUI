/* eslint-disable no-console */
/**
 * Time-tracking accuracy checks. Run with:
 *
 *   node scripts/verify-tracking.js
 *
 * There is no test runner in this repo, so this follows the existing precedent:
 * a standalone script with no dependencies.
 *
 * It does NOT re-implement the functions under test. It reads utils/stats.ts,
 * lifts the real function bodies out of it, strips the type annotations from
 * their signatures and evaluates them. A copied-out implementation would drift
 * from the shipped one and quietly stop testing anything, which is the exact
 * failure mode this file exists to prevent.
 *
 * Covered:
 *   1. mapPathToCategory against the URL shapes the real sites produce.
 *   2. effectiveSegmentEnd — the idle clamp arithmetic.
 *   3. A simulation of the [id].tsx commit loop, which is where the clamp and
 *      the sub-500ms carry actually have to hold together.
 */

const fs = require('fs');
const path = require('path');

const STATS_TS = path.join(__dirname, '..', 'utils', 'stats.ts');

// ---------------------------------------------------------------------------
// Loading the real source
// ---------------------------------------------------------------------------

/** Index just past the brace/paren matching the opener at `open`. */
function matchDelimiter(src, open, openCh, closeCh) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === openCh) depth++;
    else if (src[i] === closeCh) {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error(`unbalanced ${openCh}${closeCh} from index ${open}`);
}

/**
 * Pull `function NAME(...) {...}` out of TS source as plain JS.
 * Only the signature is rewritten; the body is taken verbatim, so this is only
 * valid for functions whose bodies carry no type annotations. Asserted below.
 */
function extractFunction(src, name) {
  const decl = new RegExp(`(?:export\\s+)?function\\s+${name}\\s*\\(`);
  const m = decl.exec(src);
  if (!m) throw new Error(`could not find function ${name} in utils/stats.ts`);

  const parenOpen = src.indexOf('(', m.index);
  const parenClose = matchDelimiter(src, parenOpen, '(', ')');
  const braceOpen = src.indexOf('{', parenClose);
  const braceClose = matchDelimiter(src, braceOpen, '{', '}');

  const params = src
    .slice(parenOpen + 1, parenClose)
    .split(',')
    .map((p) => p.split(':')[0].trim())
    .filter(Boolean);

  const body = src.slice(braceOpen, braceClose + 1);
  if (/:\s*(string|number|boolean|Category|PlatformId)\b/.test(body)) {
    throw new Error(`body of ${name} contains type annotations; extractor needs updating`);
  }
  return `function ${name}(${params.join(', ')}) ${body}`;
}

function loadStats() {
  const src = fs.readFileSync(STATS_TS, 'utf8');
  const names = ['normalizePath', 'mapPathToCategory', 'effectiveSegmentEnd'];
  const code = names.map((n) => extractFunction(src, n)).join('\n\n');

  // IDLE_GRACE_MS is a plain const; read it from source too rather than
  // hardcoding, so a change to the grace window shows up here.
  const graceMatch = /export const IDLE_GRACE_MS\s*=\s*([0-9_]+)/.exec(src);
  if (!graceMatch) throw new Error('could not find IDLE_GRACE_MS in utils/stats.ts');

  // eslint-disable-next-line no-new-func
  const factory = new Function(`${code}\nreturn { ${names.join(', ')} };`);
  return { ...factory(), IDLE_GRACE_MS: Number(graceMatch[1].replace(/_/g, '')) };
}

const { mapPathToCategory, effectiveSegmentEnd, IDLE_GRACE_MS } = loadStats();

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let passed = 0;
const failures = [];

function check(label, actual, expected) {
  if (actual === expected) passed++;
  else failures.push(`${label}\n      expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function section(name) {
  console.log(`\n${name}`);
}

// ---------------------------------------------------------------------------
// 1. mapPathToCategory
// ---------------------------------------------------------------------------
//
// Path shapes below are sourced from the URLs this repo's own injection rules
// and route guards already key on (injection/instagram.ts, injection/youtube.ts
// et al) — those selectors were written against the live sites, so they are the
// best in-repo evidence of real URL shapes. Shapes NOT corroborated that way are
// marked `[unverified]` and are also listed in research/04-tracking-accuracy.md.

section('mapPathToCategory — Instagram');
const ig = (p) => mapPathToCategory('instagram', p);
check('IG home', ig('/'), 'feed');
check('IG post detail', ig('/p/C8xYz1AbCdE/'), 'feed');
check('IG reels tab', ig('/reels/'), 'reels');
check('IG single reel', ig('/reel/C8xYz1AbCdE/'), 'reels');
check('IG reels audio page', ig('/reels/audio/123456789/'), 'reels');
check('IG DM inbox', ig('/direct/inbox/'), 'messages');
check('IG DM thread', ig('/direct/t/17845678901234567/'), 'messages');
check('IG explore is unclassified, not feed', ig('/explore/'), 'other');
check('IG explore search', ig('/explore/search/'), 'other');
check('IG stories', ig('/stories/someuser/3412345678901234567/'), 'other');
check('IG profile', ig('/someuser/'), 'other');
check('IG saved', ig('/someuser/saved/'), 'other');
check('IG accounts', ig('/accounts/edit/'), 'other');
// Robustness: query strings, mixed case and missing trailing slashes.
check('IG home with query', ig('/?variant=x'), 'feed');
check('IG reel without trailing slash', ig('/reel/ABC'), 'reels');
check('IG uppercase direct', ig('/DIRECT/inbox/'), 'messages');
check('IG full href', ig('https://www.instagram.com/direct/inbox/'), 'messages');
check('IG empty path defaults to home', ig(''), 'feed');

section('mapPathToCategory — YouTube');
const yt = (p) => mapPathToCategory('youtube', p);
check('YT home', yt('/'), 'feed');
check('YT watch', yt('/watch'), 'video');
check('YT watch with query stripped upstream', yt('/watch?v=dQw4w9WgXcQ'), 'video');
check('YT shorts', yt('/shorts/abc123XYZ_-'), 'reels');
check('YT shorts tab', yt('/shorts'), 'reels');
check('YT subscriptions [unverified]', yt('/feed/subscriptions'), 'other');
check('YT history [unverified]', yt('/feed/history'), 'other');
check('YT search results [unverified]', yt('/results?search_query=cats'), 'other');
check('YT channel handle [unverified]', yt('/@somechannel'), 'other');
check('YT playlist [unverified]', yt('/playlist?list=PL123'), 'other');
check('YT desktop-mode home', yt('/?app=desktop'), 'feed');

section('mapPathToCategory — Reddit');
const rd = (p) => mapPathToCategory('reddit', p);
check('RD home', rd('/'), 'feed');
check('RD subreddit listing', rd('/r/aww/'), 'feed');
check('RD subreddit sort', rd('/r/aww/top/'), 'feed');
// The regression this run is meant to catch: a comment permalink is a thread
// the user chose to open, not the ranked listing, and both live under /r/.
check('RD comment permalink is not feed', rd('/r/aww/comments/1a2b3c/some_slug/'), 'other');
check('RD comment permalink, no slug', rd('/r/aww/comments/1a2b3c/'), 'other');
check('RD chat', rd('/chat/'), 'messages');
check('RD messages', rd('/message/inbox/'), 'messages');
check('RD user profile', rd('/user/someone/'), 'other');

section('mapPathToCategory — X / Facebook / LinkedIn / TikTok');
check('X home', mapPathToCategory('twitter', '/home'), 'feed');
check('X home trailing slash', mapPathToCategory('twitter', '/home/'), 'feed');
check('X root', mapPathToCategory('twitter', '/'), 'feed');
check('X DMs', mapPathToCategory('twitter', '/messages/1234'), 'messages');
check('X status [unverified]', mapPathToCategory('twitter', '/user/status/123'), 'other');
check('FB home', mapPathToCategory('facebook', '/'), 'feed');
check('FB legacy home.php', mapPathToCategory('facebook', '/home.php'), 'feed');
check('FB reel', mapPathToCategory('facebook', '/reel/123456'), 'reels');
check('FB watch', mapPathToCategory('facebook', '/watch/'), 'video');
check('FB messages', mapPathToCategory('facebook', '/messages/t/123'), 'messages');
check('LI feed', mapPathToCategory('linkedin', '/feed/'), 'feed');
check('LI messaging', mapPathToCategory('linkedin', '/messaging/thread/123'), 'messages');
check('LI jobs', mapPathToCategory('linkedin', '/jobs/'), 'other');
check('TT root is the video wall', mapPathToCategory('tiktok', '/'), 'reels');
check('TT user video', mapPathToCategory('tiktok', '/@user/video/123'), 'reels');
check('TT messages', mapPathToCategory('tiktok', '/messages'), 'messages');
check('TT search is user-driven', mapPathToCategory('tiktok', '/search?q=cats'), 'other');
check('unknown platform', mapPathToCategory('snapchat', '/'), 'other');

// ---------------------------------------------------------------------------
// 2. effectiveSegmentEnd
// ---------------------------------------------------------------------------

section('effectiveSegmentEnd — idle clamp');
const G = IDLE_GRACE_MS;
check('grace window intact', G, 60000);

// Active user: last touch a second ago, nothing is clamped.
check('active user is not clamped', effectiveSegmentEnd(0, 30000, 29000, G), 30000);
// Exactly at the boundary.
check('at the grace boundary', effectiveSegmentEnd(0, G, 0, G), G);
// Phone put down at t=0, still open 20 minutes later: only the grace counts.
check('20 idle minutes collapse to the grace', effectiveSegmentEnd(0, 1_200_000, 0, G), G);
// Idle span entirely before the segment started — nothing to credit at all.
check('fully idle segment collapses to zero length', effectiveSegmentEnd(500_000, 900_000, 0, G), 500_000);
// The clamp must never invent time by returning a value beyond `now`.
check('clamp never exceeds now', effectiveSegmentEnd(0, 10_000, 9_999_999, G), 10_000);
// …nor go behind the start, which would make `end - start` negative.
check('clamp never precedes start', effectiveSegmentEnd(100, 200, -999_999, G) >= 100, true);

// ---------------------------------------------------------------------------
// 3. The commit loop, as [id].tsx runs it
// ---------------------------------------------------------------------------
//
// Mirrors commitSegment(): the clamp, the 500ms floor, and the rule that a
// sub-floor remainder is carried rather than deleted.

function makeTracker(startAt) {
  return {
    catStart: startAt,
    lastActivity: startAt,
    cat: 'feed',
    recorded: {},
    commit(now) {
      const start = this.catStart;
      const end = effectiveSegmentEnd(start, now, this.lastActivity, G);
      const ms = end - start;
      if (ms < 500) {
        if (end < now) this.catStart = now; // idle span: step over it
        return;                             // else: carry the remainder
      }
      this.catStart = now;
      this.recorded[this.cat] = (this.recorded[this.cat] || 0) + ms;
    },
    total() {
      return Object.values(this.recorded).reduce((a, b) => a + b, 0);
    },
  };
}

section('commit loop');

// A phone left on the feed for 20 minutes records one grace window, not 20 min.
{
  const t = makeTracker(0);
  t.commit(1_200_000);
  check('abandoned 20min session records 60s', t.total(), G);
}

// A genuinely active 20-minute session, touching every 10s, records all of it.
{
  const t = makeTracker(0);
  for (let s = 10_000; s <= 1_200_000; s += 10_000) {
    t.lastActivity = s;
    t.commit(s);
  }
  check('active 20min session records 20min', t.total(), 1_200_000);
}

// Rapid category thrash: 10 switches inside 3s. Every segment is under the
// 500ms floor, so the old code recorded nothing at all. Nothing may be lost.
{
  const t = makeTracker(0);
  for (let i = 1; i <= 10; i++) {
    t.lastActivity = i * 300;
    t.commit(i * 300);
    t.cat = i % 2 ? 'reels' : 'feed';
  }
  t.lastActivity = 3000;
  t.commit(3000);
  check('rapid nav loses no time', t.total(), 3000);
}

// Idle in the middle: active 30s, away 10min, active 30s more.
{
  const t = makeTracker(0);
  t.lastActivity = 30_000;
  t.commit(30_000);                 // 30s of real use
  const resume = 30_000 + 600_000;  // ping arrives after a 10min silence
  t.commit(resume);                 // clamps to the grace window
  t.catStart = resume;              // …then the clock restarts
  t.lastActivity = resume;
  t.commit(resume + 30_000);
  check('idle gap credits one grace window only', t.total(), 30_000 + G + 30_000);
}

// ---------------------------------------------------------------------------

console.log('');
if (failures.length) {
  console.log(`FAILED — ${passed} passed, ${failures.length} failed\n`);
  for (const f of failures) console.log(`  ✗ ${f}\n`);
  process.exit(1);
}
console.log(`OK — ${passed} checks passed.`);
