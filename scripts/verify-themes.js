/* eslint-disable no-console */
/**
 * Background-theme contrast checks. Run with:
 *
 *   node scripts/verify-themes.js
 *
 * Same precedent as the other scripts: no dependencies, no test runner, and it
 * reads the real source rather than re-stating it.
 *
 * WHAT THIS PROTECTS
 *
 * A background theme is the one feature in this app that can silently break
 * every contrast ratio in `constants/colors.ts`. Those ratios were computed
 * against a known ground; a scene drawn behind them changes that ground.
 *
 * So this script does the composite arithmetic the eye cannot: for every colour
 * every theme declares, it mixes that colour under the scrim, then re-checks
 * the text tokens against the resulting ground. `textTertiary` is the binding
 * constraint — it has only 5.03:1 on the plain ground, so it runs out of
 * headroom long before anything else does.
 *
 * A colour that fails here is not a styling nit. It means text somewhere on
 * that theme is illegible to someone, and the failure is invisible to whoever
 * added it.
 */

const fs = require('fs');
const path = require('path');

const THEMES_TS = path.join(__dirname, '..', 'constants', 'themes.ts');
const COLORS_TS = path.join(__dirname, '..', 'constants', 'colors.ts');

// ---------------------------------------------------------------------------
// WCAG 2.x, same definition as research/03's appendix
// ---------------------------------------------------------------------------

const chan = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const luminance = (hex) => {
  const [r, g, b] = rgb(hex);
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
};
const ratio = (a, b) => {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const toHex = (arr) =>
  '#' + arr.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** `mark` seen through a scrim of `ground` at `alpha`. */
const composite = (mark, ground, alpha) => {
  const m = rgb(mark);
  const g = rgb(ground);
  return toHex(g.map((v, i) => alpha * v + (1 - alpha) * m[i]));
};

// ---------------------------------------------------------------------------
// Reading the real source
// ---------------------------------------------------------------------------

/** One `name: '#RRGGBB'` token out of constants/colors.ts. */
function readColor(src, name) {
  const m = new RegExp(`\\b${name}:\\s*'(#[0-9A-Fa-f]{6})'`).exec(src);
  if (!m) throw new Error(`could not find ${name} in constants/colors.ts`);
  return m[1];
}

function readThemes(src) {
  const out = [];
  // Each entry is `id: 'x'` … `marks: [...]`, in that order.
  const re = /id:\s*'([a-z]+)'[\s\S]*?marks:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const marks = (m[2].match(/#[0-9A-Fa-f]{6}/g) ?? []).map((s) => s);
    out.push({ id: m[1], marks });
  }
  return out;
}

function readScrim(src) {
  const m = /export const SCRIM_ALPHA\s*=\s*([0-9.]+)/.exec(src);
  if (!m) throw new Error('could not find SCRIM_ALPHA in constants/themes.ts');
  return Number(m[1]);
}

const themeSrc = fs.readFileSync(THEMES_TS, 'utf8');
const colorSrc = fs.readFileSync(COLORS_TS, 'utf8');

const SCRIM_ALPHA = readScrim(themeSrc);
const themes = readThemes(themeSrc);

const background = readColor(colorSrc, 'background');
// The tokens that can appear directly on the ground rather than inside a card.
const TEXT_ON_GROUND = {
  textPrimary: readColor(colorSrc, 'textPrimary'),
  textSecondary: readColor(colorSrc, 'textSecondary'),
  textTertiary: readColor(colorSrc, 'textTertiary'),
};
/** Body-text minimum. `textTertiary` is 11–13px, so 3:1 never applies to it. */
const MIN_TEXT = 4.5;

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let passed = 0;
const failures = [];

function check(label, actual, expected) {
  if (actual === expected) passed++;
  else
    failures.push(
      `${label}\n      expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
}

function section(name) {
  console.log(`\n${name}`);
}

// ---------------------------------------------------------------------------

section('setup');
check('scrim is in a sane range', SCRIM_ALPHA > 0.5 && SCRIM_ALPHA < 1, true);
check('themes were parsed', themes.length > 0, true);
check('a plain theme exists', themes.some((t) => t.id === 'plain'), true);
check(
  'the plain theme draws nothing',
  (themes.find((t) => t.id === 'plain') ?? { marks: [1] }).marks.length,
  0
);

// The plain ground itself must already be legal, or nothing below means anything.
section('plain ground');
for (const [name, hex] of Object.entries(TEXT_ON_GROUND)) {
  const r = ratio(hex, background);
  check(`${name} on the plain ground (${r.toFixed(2)}:1)`, r >= MIN_TEXT, true);
}

// ---------------------------------------------------------------------------
// The real check: every declared mark, composited, against every text token.
// ---------------------------------------------------------------------------

section('themed grounds');
for (const theme of themes) {
  if (theme.marks.length === 0) continue;
  for (const mark of theme.marks) {
    const ground = composite(mark, background, SCRIM_ALPHA);
    for (const [name, hex] of Object.entries(TEXT_ON_GROUND)) {
      const r = ratio(hex, ground);
      check(
        `${theme.id}: ${name} over ${mark} → ground ${ground} (${r.toFixed(2)}:1)`,
        r >= MIN_TEXT,
        true
      );
    }
  }
}

// A regression guard on the constraint itself. If someone raises SCRIM_ALPHA to
// let a darker mark through, this is the check that should stop them: a mark
// this dark is known to fail, and it must keep failing.
section('the constraint still bites');
{
  const tooDark = '#5E2A6B';
  const ground = composite(tooDark, background, SCRIM_ALPHA);
  const r = ratio(TEXT_ON_GROUND.textTertiary, ground);
  check(
    `a saturated plum mark (${tooDark}) is still rejected (${r.toFixed(2)}:1)`,
    r < MIN_TEXT,
    true
  );
}

// ---------------------------------------------------------------------------

console.log('');
if (failures.length) {
  console.log(`FAILED — ${passed} passed, ${failures.length} failed\n`);
  for (const f of failures) console.log(`  ✗ ${f}\n`);
  process.exit(1);
}
console.log(`${passed} passed, 0 failed`);
