import { useEffect, useMemo, useState } from 'react';
import { browser } from 'wxt/browser';
import { usePacks } from '@/hooks/usePacks';
import { logger } from '@/utils/logger';
import {
  scorePacksByOpenTabs,
  DEFAULT_SUGGESTION_MIN_TABS,
  DEFAULT_SUGGESTION_MAX,
  type SuggestedPack,
} from '@/utils/packSuggestion';

export interface UsePackSuggestionsResult {
  /** Top packs for the onboarding hero (>= min tabs, capped to the hero limit). */
  suggestions: SuggestedPack[];
  /** Matched-tab count per pack id, for relevance ordering in the gallery. */
  matchedTabsByPackId: Map<string, number>;
  /** False until the first tab query resolves. */
  isLoaded: boolean;
}

/**
 * Cross the currently open tabs with the pack catalog (scoped to the active
 * workspace via `existingRuleIds`) and expose relevance suggestions.
 *
 * The analysis is fully local: tabs are queried once on mount, URLs are scored
 * in memory and never stored. Private/incognito windows and non-http(s) URLs
 * are excluded.
 */
export function usePackSuggestions(
  existingRuleIds: ReadonlySet<string>,
): UsePackSuggestionsResult {
  const { packs } = usePacks();
  const [tabUrls, setTabUrls] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!browser.tabs?.query) {
      setTabUrls([]);
      return;
    }
    browser.tabs
      .query({})
      .then((tabs) => {
        if (cancelled) return;
        const urls = tabs
          .filter((tab) => !tab.incognito)
          .map((tab) => tab.url ?? '')
          .filter((url) => url.length > 0);
        setTabUrls(urls);
      })
      .catch((error) => {
        logger.debug('[usePackSuggestions] tabs.query failed:', error);
        if (!cancelled) setTabUrls([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo<UsePackSuggestionsResult>(() => {
    if (tabUrls === null) {
      return { suggestions: [], matchedTabsByPackId: new Map(), isLoaded: false };
    }

    // minTabs: 1 so the gallery can flag every matched pack; the hero applies
    // its own threshold below.
    const allScores = scorePacksByOpenTabs(tabUrls, packs, existingRuleIds, {
      minTabs: 1,
    });

    const matchedTabsByPackId = new Map<string, number>();
    for (const score of allScores) {
      matchedTabsByPackId.set(score.pack.pack.id, score.matchedTabs);
    }

    const suggestions = allScores
      .filter((score) => score.matchedTabs >= DEFAULT_SUGGESTION_MIN_TABS)
      .slice(0, DEFAULT_SUGGESTION_MAX);

    return { suggestions, matchedTabsByPackId, isLoaded: true };
  }, [tabUrls, packs, existingRuleIds]);
}
