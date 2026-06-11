import type { PackFile } from '@/schemas/pack';
import {
  computePackInstallStatus,
  type PackInstallStatus,
} from '@/utils/packInstallStatus.js';
import { matchesDomain } from '@/utils/utils.js';

/**
 * A pack that matches the currently open tabs, with its relevance score.
 *
 * `matchedTabs` is the primary score (number of open http(s) tabs whose domain
 * matches at least one of the pack's rules). `matchedDomains` is the number of
 * distinct hostnames among those matched tabs, used as a tie-breaker.
 */
export interface SuggestedPack {
  pack: PackFile;
  matchedTabs: number;
  matchedDomains: number;
  installStatus: PackInstallStatus;
}

export interface ScorePacksOptions {
  /** Minimum number of matched tabs for a pack to be suggested. */
  minTabs?: number;
  /** When set, keep only the top `max` packs (used by the onboarding hero). */
  max?: number;
}

/** Minimum matched tabs before a pack is suggested in the onboarding hero. */
export const DEFAULT_SUGGESTION_MIN_TABS = 2;
/** Maximum number of packs surfaced in the onboarding hero. */
export const DEFAULT_SUGGESTION_MAX = 3;

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Cross open-tab URLs with the pack catalog and return packs ordered by
 * relevance. Pure function: no network call, no storage of the analyzed URLs.
 *
 * Rules:
 * - Only http(s) URLs are considered; everything else (chrome://, about:,
 *   extension pages, ...) is ignored.
 * - Domain matching reuses {@link matchesDomain} (no reimplementation).
 * - Fully installed packs are excluded; `not-installed` and `partial` stay
 *   eligible.
 * - A pack is kept only when it matches at least `minTabs` tabs.
 * - Ordering: matched tabs desc, then distinct matched domains desc, then the
 *   catalog order of `packs` (already sorted by {@link usePacks}).
 */
export function scorePacksByOpenTabs(
  tabUrls: readonly string[],
  packs: readonly PackFile[],
  existingRuleIds: ReadonlySet<string>,
  opts: ScorePacksOptions = {},
): SuggestedPack[] {
  const minTabs = opts.minTabs ?? DEFAULT_SUGGESTION_MIN_TABS;
  const httpUrls = tabUrls.filter(isHttpUrl);

  const scored: Array<{ suggestion: SuggestedPack; order: number }> = [];

  packs.forEach((pack, order) => {
    const installInfo = computePackInstallStatus(pack, existingRuleIds);
    if (installInfo.status === 'installed') return;

    const filters = pack.domainRules.map((rule) => rule.domainFilter);
    if (filters.length === 0) return;

    const matchedHosts = new Set<string>();
    let matchedTabs = 0;
    for (const url of httpUrls) {
      if (filters.some((filter) => matchesDomain(url, filter))) {
        matchedTabs += 1;
        const host = hostnameOf(url);
        if (host) matchedHosts.add(host);
      }
    }

    if (matchedTabs < minTabs) return;

    scored.push({
      suggestion: {
        pack,
        matchedTabs,
        matchedDomains: matchedHosts.size,
        installStatus: installInfo.status,
      },
      order,
    });
  });

  scored.sort((a, b) => {
    if (a.suggestion.matchedTabs !== b.suggestion.matchedTabs) {
      return b.suggestion.matchedTabs - a.suggestion.matchedTabs;
    }
    if (a.suggestion.matchedDomains !== b.suggestion.matchedDomains) {
      return b.suggestion.matchedDomains - a.suggestion.matchedDomains;
    }
    return a.order - b.order;
  });

  const ordered = scored.map((entry) => entry.suggestion);
  return opts.max != null ? ordered.slice(0, opts.max) : ordered;
}
