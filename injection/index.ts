import { PlatformId } from '@/constants/platforms';
import { MasterSettings } from '@/store/settingsStore';
import { buildInstagramScript } from './instagram';
import { buildYouTubeScript } from './youtube';
import { buildTwitterScript } from './twitter';
import { buildTikTokScript } from './tiktok';
import { buildFacebookScript } from './facebook';
import { buildRedditScript } from './reddit';
import { buildLinkedInScript } from './linkedin';

type Builder = (config: Record<string, boolean>, limitCount: number) => string;

const BUILDERS: Partial<Record<PlatformId, Builder>> = {
  instagram: buildInstagramScript,
  youtube: buildYouTubeScript,
  twitter: buildTwitterScript,
  tiktok: buildTikTokScript,
  facebook: buildFacebookScript,
  reddit: buildRedditScript,
  linkedin: buildLinkedInScript,
};

// Feature keys each master toggle forces ON. Keys a platform doesn't implement
// are harmless no-ops (the rule filter just finds nothing for them).
const METRIC_KEYS = [
  'hideLikeCounts',
  'hideFollowerCounts',
  'hideViewCounts',
  'hideMetrics',
  'hideReactionCounts',
];
const BADGE_KEYS = ['hideBadges', 'hideBadgeCounts'];

/** Per-platform settings with the cross-platform master toggles laid on top. */
export function applyMasterOverrides(
  config: Record<string, boolean>,
  master?: MasterSettings
): Record<string, boolean> {
  if (!master) return config;
  const out = { ...config };
  if (master.killAllMetrics) for (const k of METRIC_KEYS) out[k] = true;
  if (master.killAllBadges) for (const k of BADGE_KEYS) out[k] = true;
  if (master.messagesOnly) out.dmsOnly = true;
  if (master.grayscaleEverything) out.grayscale = true;
  return out;
}

/** Returns the injection script for a platform, or a no-op if none is wired yet. */
export function buildInjection(
  platform: PlatformId,
  config: Record<string, boolean>,
  limitCount: number,
  master?: MasterSettings
): string {
  const builder = BUILDERS[platform];
  return builder ? builder(applyMasterOverrides(config, master), limitCount) : 'true;';
}
