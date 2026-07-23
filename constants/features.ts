import { PlatformId } from './platforms';

export type Feature = {
  /** Stable key stored in the settings store and read by the injection engine. */
  key: string;
  /** Row label shown in Settings. */
  label: string;
  /** Renders a locked green "Always On" pill instead of a Switch (free core blockers). */
  alwaysOn?: boolean;
  /** Default value for a fresh install. Always-on features default true. */
  default: boolean;
  /** Small grey subtitle for rows that need a caveat. */
  note?: string;
  /** If set, this row nests (indented) under its parent and only shows when the
   *  parent toggle is on. */
  parent?: string;
};

/**
 * Single source of truth for per-platform toggles. Both `app/settings.tsx` and the
 * injection modules read this — add a feature once and it appears in both places.
 * `key` values must match the rule keys in the matching `injection/<platform>.ts`.
 */
export const FEATURES: Partial<Record<PlatformId, Feature[]>> = {
  instagram: [
    { key: 'blockReels', label: 'Block Reels', default: true },
    { key: 'blockExplore', label: 'Block Explore', default: true },
    {
      key: 'hideBadges',
      label: 'Hide Notification Badges',
      default: true,
      note: 'Removes red dots and counts. Icons stay clickable.',
    },
    {
      key: 'hideDmBadges',
      label: 'Hide DM Badges',
      parent: 'hideBadges',
      default: true,
      note: 'The unread count on the messages icon.',
    },
    { key: 'blockStories', label: 'Block Stories', default: false },
    {
      key: 'hideSearchBar',
      label: 'Hide Search',
      default: false,
      note: 'Removes the search bar and search icon.',
    },
    { key: 'blockSuggested', label: 'Block Suggested Posts', default: false },
    { key: 'blockSponsored', label: 'Block Sponsored Posts', default: false },
    { key: 'hideLikeCounts', label: 'Hide Like Counts', default: false },
    { key: 'hideFollowerCounts', label: 'Hide Follower Counts', default: false },
    { key: 'hideLikeButton', label: 'Hide Like Button', default: false },
    { key: 'hideCommentButton', label: 'Hide Comment Button', default: false },
    { key: 'hideShareButton', label: 'Hide Share Button', default: false },
    { key: 'hideSaveButton', label: 'Hide Save Button', default: false },
    {
      key: 'limitFeed',
      label: 'Limit Feed',
      default: true,
      note: "Stops the feed after a set number of posts.",
    },
    {
      key: 'dmsOnly',
      label: 'DMs Only',
      default: false,
      note: 'Opens straight to your inbox.',
    },
    { key: 'grayscale', label: 'Grayscale', default: false },
  ],
  youtube: [
    { key: 'blockShorts', label: 'Block Shorts', alwaysOn: true, default: true },
    { key: 'blockRecommendations', label: 'Block Home Recommendations', default: false },
    {
      key: 'searchOnly',
      label: 'Search Only Mode',
      default: false,
      note: 'Shows only the search bar and results.',
    },
    { key: 'blockSponsored', label: 'Block Ads', default: false },
    { key: 'hideViewCounts', label: 'Hide View Counts', default: false },
    { key: 'hideLikeCounts', label: 'Hide Like Counts', default: false },
    {
      key: 'limitFeed',
      label: 'Limit Feed',
      default: false,
      note: 'Stops the home grid after about 20 videos.',
    },
    {
      key: 'pictureInPicture',
      label: 'Picture in Picture',
      default: false,
      note: 'Keep a video playing in a floating window.',
    },
    { key: 'grayscale', label: 'Grayscale', default: false },
  ],
  twitter: [
    { key: 'hideForYou', label: 'Hide For You Tab', default: true },
    { key: 'blockTrending', label: 'Hide Trending & Explore', default: false },
    { key: 'blockWhoToFollow', label: 'Hide Who To Follow', default: false },
    { key: 'hideMetrics', label: 'Hide Engagement Counts', default: false },
    { key: 'blockPromoted', label: 'Block Promoted Posts', default: false },
    { key: 'blockGrok', label: 'Hide Grok', default: false },
    {
      key: 'limitFeed',
      label: 'Limit Feed',
      default: true,
      note: "Stops the timeline after a set number of posts.",
    },
    {
      key: 'dmsOnly',
      label: 'DMs Only',
      default: false,
      note: 'Opens straight to your messages.',
    },
    { key: 'grayscale', label: 'Grayscale', default: false },
  ],
  tiktok: [
    {
      key: 'blockFYP',
      label: 'Block For You Page',
      default: false,
      note: 'Redirects to your Following feed. This removes most of TikTok.',
    },
    { key: 'blockLive', label: 'Block Live', default: false },
    {
      key: 'dmsOnly',
      label: 'DMs Only',
      default: false,
      note: 'Opens straight to your messages.',
    },
    { key: 'grayscale', label: 'Grayscale', default: false },
  ],
  facebook: [
    { key: 'blockReels', label: 'Block Reels', default: true },
    { key: 'blockStories', label: 'Block Stories', default: false },
    { key: 'blockWatch', label: 'Block Watch', default: false },
    { key: 'blockMarketplace', label: 'Block Marketplace', default: false },
    {
      key: 'limitFeed',
      label: 'Limit Feed',
      default: true,
      note: "Stops the feed after a set number of posts.",
    },
    { key: 'grayscale', label: 'Grayscale', default: false },
  ],
  reddit: [
    {
      key: 'blockPopular',
      label: 'Block Popular',
      default: true,
      note: 'Keeps you in your own communities.',
    },
    { key: 'hideMetrics', label: 'Hide Vote & Comment Counts', default: false },
    {
      key: 'limitFeed',
      label: 'Limit Feed',
      default: true,
      note: "Stops the feed after a set number of posts.",
    },
    { key: 'grayscale', label: 'Grayscale', default: false },
  ],
  linkedin: [
    {
      key: 'hideFeed',
      label: 'Hide Home Feed',
      default: false,
      note: 'Keeps search, jobs, and messaging. Hides the endless feed.',
    },
    { key: 'blockNews', label: 'Hide LinkedIn News', default: true },
    { key: 'hideBadgeCounts', label: 'Hide Notification Badges', default: true },
    { key: 'hideReactionCounts', label: 'Hide Reaction Counts', default: false },
    {
      key: 'limitFeed',
      label: 'Limit Feed',
      default: true,
      note: "Stops the feed after a set number of posts.",
    },
    {
      key: 'dmsOnly',
      label: 'Messaging Only',
      default: false,
      note: 'Opens straight to your inbox.',
    },
    { key: 'grayscale', label: 'Grayscale', default: false },
  ],
};

/** "Limit Feed" — how many posts before the feed stops, and its adjustable range. */
export const DEFAULT_FEED_LIMIT = 10;
export const FEED_LIMIT_MIN = 3;
export const FEED_LIMIT_MAX = 100;
export const FEED_LIMIT_STEP = 1;

/** Platforms whose settings section is shown but not yet wired up. */
export const COMING_SOON: PlatformId[] = [];

/** Default settings object for one platform, derived from its feature defaults. */
export function defaultSettingsFor(platform: PlatformId): Record<string, boolean> {
  const features = FEATURES[platform] ?? [];
  return Object.fromEntries(features.map((f) => [f.key, f.default]));
}
