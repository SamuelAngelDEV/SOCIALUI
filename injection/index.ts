import { PlatformId } from '@/constants/platforms';
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

/** Returns the injection script for a platform, or a no-op if none is wired yet. */
export function buildInjection(
  platform: PlatformId,
  config: Record<string, boolean>,
  limitCount: number
): string {
  const builder = BUILDERS[platform];
  return builder ? builder(config, limitCount) : 'true;';
}
