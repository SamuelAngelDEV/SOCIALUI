import { Colors } from './colors';
import { Category, CATEGORY_KIND, CategoryKind } from '@/utils/stats';

/**
 * The colour language for activity.
 *
 * One definition, because three screens now draw the same distinction: Insights
 * (the week), the session summary (the last few minutes), and Home (today).
 * Defining it more than once is how a bar ends up disagreeing with the
 * percentage printed above it.
 *
 * TWO LEVELS, AND THE REASON FOR BOTH.
 *
 * `categoryColor` gives each surface its own hue, so a stacked bar can be read
 * without a legend entry per segment being the only thing distinguishing them.
 * `KIND_COLORS` collapses to two, for the places that are genuinely about the
 * split rather than the breakdown.
 *
 * The per-category hues are not arbitrary: warm carries algorithmic, cool
 * carries intentional, so the split still reads as two families BEFORE any
 * label is read (`constants/colors.ts`). That is what makes per-category colour
 * safe here — it adds detail without destroying the grouping the product's
 * argument depends on.
 *
 * Colour is never the sole carrier of meaning: every bar and legend row is
 * labelled, and each legend row additionally names its kind in words.
 * `research/03-visual-direction.md` §1.1 — a palette that separates by hue alone
 * collapses for the ~8% of males with red–green deficiency and in greyscale.
 *
 * This lives in `constants/` rather than in `utils/stats.ts` deliberately:
 * `stats.ts` is lifted and evaluated by `scripts/verify-tracking.js`, and it
 * stays free of presentation for the same reason `utils/reclaimed.ts` stays
 * free of app imports.
 */

/**
 * Kind-level colours, for the two-tone views.
 *
 * Purple and teal, taken from the Figma. These were previously `accentGold`
 * and `primary`, which put a muddy brown-gold against plum: legal on contrast,
 * poor to look at, and the two hues were close enough in weight that the
 * stacked week chart read as one mass. Purple against teal separates cleanly
 * and is still warm-against-cool, so the algorithmic/intentional grouping
 * survives.
 *
 * Both are existing validated tokens rather than new values: `catFeed` 5.79:1
 * and `catMessages` 4.60:1. They also happen to be the marks the two largest
 * categories already use, so the split bar and the per-category bars agree
 * instead of quietly disagreeing.
 */
export const ALGORITHMIC_COLOR = Colors.catFeed;
export const INTENTIONAL_COLOR = Colors.catMessages;

export const KIND_COLORS: Record<CategoryKind, string> = {
  algorithmic: ALGORITHMIC_COLOR,
  intentional: INTENTIONAL_COLOR,
  unclassified: Colors.textTertiary,
};

/** Chart marks. Every value ≥3:1 on both ground and surface — see colors.ts. */
const CATEGORY_MARK: Record<Category, string> = {
  feed: Colors.catFeed,
  reels: Colors.catReels,
  explore: Colors.catExplore,
  messages: Colors.catMessages,
  video: Colors.catVideo,
  search: Colors.catSearch,
  other: Colors.catOther,
};

/** Label colours. Every value ≥4.5:1 — a legend row is body text, not a mark. */
const CATEGORY_TEXT: Record<Category, string> = {
  feed: Colors.catTextFeed,
  reels: Colors.catTextReels,
  explore: Colors.catTextExplore,
  messages: Colors.catTextMessages,
  video: Colors.catTextVideo,
  search: Colors.catTextSearch,
  other: Colors.catTextOther,
};

export const categoryColor = (cat: Category): string => CATEGORY_MARK[cat];
export const categoryTextColor = (cat: Category): string => CATEGORY_TEXT[cat];

/** The colour for a category's KIND, when the breakdown isn't the point. */
export const kindColor = (cat: Category): string => KIND_COLORS[CATEGORY_KIND[cat]];

/**
 * Categories present in a rollup, ordered algorithmic → intentional →
 * unclassified and by size within each group.
 *
 * The ordering is doing real work: it clusters the two families on the bar, so
 * the split is visible as two blocks of warm and cool before any number is
 * read. Sorting purely by size would interleave them and lose that.
 */
export function orderedCategories(
  totals: Partial<Record<Category, number>>
): { cat: Category; ms: number }[] {
  const rank: Record<CategoryKind, number> = {
    algorithmic: 0,
    intentional: 1,
    unclassified: 2,
  };
  return (Object.entries(totals) as [Category, number | undefined][])
    .filter((e): e is [Category, number] => !!e[1] && e[1] > 0)
    .map(([cat, ms]) => ({ cat, ms }))
    .sort((a, b) => {
      const byKind = rank[CATEGORY_KIND[a.cat]] - rank[CATEGORY_KIND[b.cat]];
      return byKind !== 0 ? byKind : b.ms - a.ms;
    });
}
