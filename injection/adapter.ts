import { Rule, RouteGuard, BuildScriptArgs, buildScript } from './engine';

/**
 * Everything a platform needs to produce its injection script.
 * New platforms implement this interface and register in index.ts.
 */
export type PlatformAdapter = {
  rules: Rule[];
  guards?: RouteGuard[];
  grayscaleKey?: string;
  limitKey?: string;
  limitSelector?: string;
  limitRequireDescendant?: string;
  limitPath?: string;
  badgeKey?: string;
  dmBadgeKey?: string;
  dmBadgeSelector?: string;
  /** Optional extra IIFE prepended before the main script (e.g. DM reel guard). */
  preamble?: (config: Record<string, boolean | string>) => string;
};

/** Generic builder — turns any PlatformAdapter into an injection script. */
export function buildFromAdapter(
  adapter: PlatformAdapter,
  config: Record<string, boolean | string>,
  limitCount: number
): string {
  const preamble = adapter.preamble?.(config) ?? '';
  const args: BuildScriptArgs = {
    rules: adapter.rules,
    guards: adapter.guards,
    config,
    grayscaleKey: adapter.grayscaleKey,
    limitKey: adapter.limitKey,
    limitSelector: adapter.limitSelector,
    limitCount,
    limitRequireDescendant: adapter.limitRequireDescendant,
    limitPath: adapter.limitPath,
    badgeKey: adapter.badgeKey,
    dmBadgeKey: adapter.dmBadgeKey,
    dmBadgeSelector: adapter.dmBadgeSelector,
  };
  return preamble + buildScript(args);
}
