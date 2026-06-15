import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Callout, Flex, SegmentedControl, Text, TextField } from '@radix-ui/themes';
import { Info, Search } from 'lucide-react';
import type { AppSettings } from '@/types/syncSettings.js';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout.js';
import { useExploration } from '@/hooks/useExploration.js';
import { CATALOG } from '@/exploration/catalog.js';
import { EXPLORATION_DOMAINS } from '@/exploration/domains.js';
import { getEntryState, isReviewPromptEligible } from '@/exploration/coverage.js';
import { setManualMark, markDiscovered } from '@/exploration/progressStore.js';
import { explorationFilterItem } from '@/utils/workspaceStorage.js';
import { getMessage } from '@/utils/i18n.js';
import { logger } from '@/utils/logger.js';
import type { EntryDisplayState } from '@/types/exploration.js';
import { ExplorationCoverageSummary } from '@/components/Core/Exploration/ExplorationCoverageSummary.js';
import { ExplorationDomainGroup } from '@/components/Core/Exploration/ExplorationDomainGroup.js';
import { ExplorationReviewCallout } from '@/components/Core/Exploration/ExplorationReviewCallout.js';

type ExplorationFilter = 'all' | 'discovered' | 'to-discover' | 'not-possible';

const FILTER_VALUES: ExplorationFilter[] = ['all', 'discovered', 'to-discover', 'not-possible'];

interface ExplorationPageProps {
  syncSettings: AppSettings;
}

/**
 * The "Référentiel d'exploration" page: coverage summary, filters and search,
 * and the per-domain collapsible catalogue. Coverage and the three derived
 * states are computed in O(n) with no storage access at render.
 */
export function ExplorationPage({ syncSettings }: ExplorationPageProps) {
  const { progress, coverage, isLoaded } = useExploration();
  const [filter, setFilter] = useState<ExplorationFilter>('all');
  const [search, setSearch] = useState('');
  // Which domain groups are expanded. Seeded once, after progress loads, to the
  // first domain that still has something to discover (see effect below); the
  // user's manual toggles take over afterwards.
  const [openDomains, setOpenDomains] = useState<Set<string>>(() => new Set());
  const seededOpenDomain = useRef(false);

  // Exploration: viewing the exploration coverage itself is a capability.
  useEffect(() => { void markDiscovered('stats.exploration'); }, []);

  // Load and persist the filter (global UI pref).
  useEffect(() => {
    let active = true;
    explorationFilterItem
      .getValue()
      .then((v) => {
        if (active && FILTER_VALUES.includes(v as ExplorationFilter)) setFilter(v as ExplorationFilter);
      })
      .catch((e) => logger.warn('[EXPLORATION] Failed to load filter:', e));
    return () => {
      active = false;
    };
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    const next = value as ExplorationFilter;
    setFilter(next);
    explorationFilterItem.setValue(next).catch((e) => logger.warn('[EXPLORATION] Failed to persist filter:', e));
  }, []);

  // Per-entry display state, memoized on progress.
  const stateById = useMemo(() => {
    const map = new Map<string, EntryDisplayState>();
    for (const entry of CATALOG) {
      map.set(entry.id, getEntryState(entry, progress).state);
    }
    return map;
  }, [progress]);

  const counts = useMemo(() => {
    let discovered = 0;
    let toDiscover = 0;
    let notPossible = 0;
    for (const state of stateById.values()) {
      if (state === 'discovered') discovered += 1;
      else if (state === 'to-discover') toDiscover += 1;
      else notPossible += 1;
    }
    return { all: CATALOG.length, discovered, toDiscover, notPossible };
  }, [stateById]);

  // The first domain (in catalogue order) that still has at least one
  // "to discover" entry, i.e. is not yet complete. Domains where everything is
  // discovered or not possible are considered done. Falls back to the first
  // domain when nothing is left to discover anywhere.
  const firstIncompleteDomain = useMemo(() => {
    for (const domain of EXPLORATION_DOMAINS) {
      const hasToDiscover = CATALOG.some(
        (entry) => entry.domain === domain && stateById.get(entry.id) === 'to-discover',
      );
      if (hasToDiscover) return domain;
    }
    return EXPLORATION_DOMAINS[0];
  }, [stateById]);

  // Seed the open group once progress has loaded: open the first incomplete
  // domain and leave fully completed ones collapsed. Runs a single time so it
  // never fights the user's manual expand/collapse afterwards.
  useEffect(() => {
    if (!isLoaded || seededOpenDomain.current) return;
    seededOpenDomain.current = true;
    setOpenDomains(new Set([firstIncompleteDomain]));
  }, [isLoaded, firstIncompleteDomain]);

  const query = search.trim().toLowerCase();

  const visibleByDomain = useMemo(() => {
    return EXPLORATION_DOMAINS.map((domain) => {
      let entries = CATALOG.filter((entry) => entry.domain === domain);
      if (filter !== 'all') {
        entries = entries.filter((entry) => stateById.get(entry.id) === filter);
      }
      if (query) {
        entries = entries.filter((entry) => {
          const label = getMessage(entry.labelKey as Parameters<typeof getMessage>[0]).toLowerCase();
          const desc = getMessage(entry.descriptionKey as Parameters<typeof getMessage>[0]).toLowerCase();
          return label.includes(query) || desc.includes(query);
        });
      }
      const discovered = entries.filter((entry) => stateById.get(entry.id) === 'discovered').length;
      return { domain, entries, discovered, total: entries.length };
    }).filter((group) => group.entries.length > 0);
  }, [filter, query, stateById]);

  const forceOpen = filter !== 'all' || query.length > 0;

  // Whether the discreet "leave a review" prompt may be shown (past the
  // "maîtrise + 1 capacité" milestone). The component itself handles dismissal.
  const reviewEligible = useMemo(() => isReviewPromptEligible(coverage), [coverage]);

  const toggleDomain = useCallback((domain: string) => {
    setOpenDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }, []);

  const handleToggleMark = useCallback((id: string, marked: boolean) => {
    setManualMark(id, marked).catch((e) => logger.warn('[EXPLORATION] Manual mark failed:', e));
  }, []);

  const handleGoToUi = useCallback((uiTarget: string) => {
    if (uiTarget.startsWith('#')) window.location.hash = uiTarget;
  }, []);

  return (
    <PageLayout titleKey="explorationTab" descriptionKey="explorationPageDescription" syncSettings={syncSettings}>
      {() => (
        <Flex direction="column" gap="4" data-testid="page-exploration" aria-busy={!isLoaded || undefined}>
          <ExplorationCoverageSummary coverage={coverage} />

          <ExplorationReviewCallout eligible={reviewEligible} />

          <Flex align="center" gap="3" wrap="wrap">
            <SegmentedControl.Root
              value={filter}
              onValueChange={handleFilterChange}
              aria-label={getMessage('explorationFilterAll')}
              data-testid="exploration-filter"
            >
              <SegmentedControl.Item value="all">
                {getMessage('explorationFilterAll')} ({counts.all})
              </SegmentedControl.Item>
              <SegmentedControl.Item value="discovered">
                {getMessage('explorationFilterDiscovered')} ({counts.discovered})
              </SegmentedControl.Item>
              <SegmentedControl.Item value="to-discover">
                {getMessage('explorationFilterToDiscover')} ({counts.toDiscover})
              </SegmentedControl.Item>
              <SegmentedControl.Item value="not-possible">
                {getMessage('explorationFilterNotPossible')} ({counts.notPossible})
              </SegmentedControl.Item>
            </SegmentedControl.Root>

            <Box style={{ flex: 1, minWidth: 180 }}>
              <TextField.Root
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={getMessage('explorationSearch')}
                aria-label={getMessage('explorationSearch')}
                data-testid="page-exploration-search"
              >
                <TextField.Slot>
                  <Search size={15} aria-hidden="true" />
                </TextField.Slot>
              </TextField.Root>
            </Box>
          </Flex>

          {visibleByDomain.length === 0 ? (
            <Callout.Root color="gray" data-testid="exploration-empty">
              <Callout.Icon>
                <Search size={16} aria-hidden="true" />
              </Callout.Icon>
              <Callout.Text>
                <Text weight="medium">{getMessage('explorationEmptyTitle')}</Text> {getMessage('explorationEmptyHint')}
              </Callout.Text>
            </Callout.Root>
          ) : (
            <Flex direction="column" gap="3">
              {visibleByDomain.map((group) => {
                const percent = group.total > 0 ? Math.round((group.discovered / group.total) * 100) : 0;
                return (
                  <ExplorationDomainGroup
                    key={group.domain}
                    domain={group.domain}
                    entries={group.entries}
                    progress={progress}
                    discovered={group.discovered}
                    total={group.total}
                    percent={percent}
                    open={openDomains.has(group.domain)}
                    forceOpen={forceOpen}
                    onToggle={() => toggleDomain(group.domain)}
                    onToggleMark={handleToggleMark}
                    onGoToUi={handleGoToUi}
                  />
                );
              })}
            </Flex>
          )}

          <Callout.Root color="gray" variant="surface" data-testid="exploration-note">
            <Callout.Icon>
              <Info size={16} aria-hidden="true" />
            </Callout.Icon>
            <Callout.Text>{getMessage('explorationDetectionNote')}</Callout.Text>
          </Callout.Root>
        </Flex>
      )}
    </PageLayout>
  );
}
