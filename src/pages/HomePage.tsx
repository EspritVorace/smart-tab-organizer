import { useCallback, useEffect, useMemo, useRef } from 'react';
import { browser } from 'wxt/browser';
import { Box, Flex } from '@radix-ui/themes';
import { useSessions } from '@/hooks/useSessions';
import { useShortcuts, type ShortcutAction } from '@/hooks/useShortcuts';
import { usePackSuggestions } from '@/hooks/usePackSuggestions';
import { useImportExportWizards } from '@/contexts/ImportExportWizardsContext';
import { buildPackSelections } from '@/components/Core/Pack/PackGallery/usePackSelections';
import type { AppSettings } from '@/types/syncSettings';
import type { Session } from '@/types/session';
import type { StatisticsAggregates } from '@/types/statistics';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { HeroOnboarding } from '@/components/HomePage/HeroOnboarding';
import { HeroOnboardingSuggestions } from '@/components/HomePage/HeroOnboardingSuggestions';
import { PinnedSessionsSection } from '@/components/HomePage/PinnedSessionsSection';
import { QuickActionsSection } from '@/components/HomePage/QuickActionsSection';
import { TipsSection } from '@/components/HomePage/TipsSection';
import {
  MiniStatsSection,
  type MiniStatRoute,
} from '@/components/HomePage/MiniStatsSection';
import { HomePageSkeleton } from '@/components/HomePage/HomePageSkeleton';
import type { QuickActionId } from '@/components/HomePage/data';
import type { HomeRestoreTarget } from '@/components/HomePage/types';
import type { DefaultRestoreActionValue } from '@/schemas/enums';

export interface HomePageProps {
  syncSettings: AppSettings;
  statisticsAggregates: StatisticsAggregates | null;
  onNavigate: (tab: string) => void;
  onOpenSnapshotWizard: () => void;
  onOpenRuleWizard: () => void;
  onOpenShortcutsAside: () => void;
  onRestore: (session: Session, target: HomeRestoreTarget) => void;
  /** Persists a new default restore action when the user picks it from a pinned tile dropdown. */
  onDefaultRestoreActionChange: (value: DefaultRestoreActionValue) => void;
  /** Locale used by mini-stats for thousand-separator formatting. */
  locale?: string;
}

const PINNED_LIMIT = 6;
const QUICK_COUNT_DEFAULT = 5;

function comparePinnedSessions(a: Session, b: Session): number {
  // Most-recently updated pinned sessions first.
  return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
}

export function HomePage({
  syncSettings,
  statisticsAggregates,
  onNavigate,
  onOpenSnapshotWizard,
  onOpenRuleWizard,
  onOpenShortcutsAside,
  onRestore,
  onDefaultRestoreActionChange,
  locale,
}: HomePageProps) {
  const { openImportRules } = useImportExportWizards();
  const { sessions, isLoaded: sessionsLoaded } = useSessions();

  const pinnedSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.isPinned)
        .sort(comparePinnedSessions)
        .slice(0, PINNED_LIMIT),
    [sessions],
  );

  const isEmpty = (syncSettings.domainRules?.length ?? 0) === 0;
  const isLoading = !sessionsLoaded || statisticsAggregates === null;

  // Contextual onboarding suggestions (issue #433): cross open tabs with the
  // pack catalog, scoped to the active workspace's rules.
  const existingRuleIds = useMemo(
    () => new Set((syncSettings.domainRules ?? []).map((rule) => rule.id)),
    [syncSettings.domainRules],
  );
  const { suggestions } = usePackSuggestions(existingRuleIds);

  // Suggestions show as long as the workspace has no rule (no dismissal).
  const showContextualHero = isEmpty && suggestions.length > 0;

  const handleImportAndOrganize = useCallback(
    (selectedPackIds: string[]) => {
      const selectedIds = new Set(selectedPackIds);
      const selectedPacks = suggestions
        .filter((suggestion) => selectedIds.has(suggestion.pack.pack.id))
        .map((suggestion) => suggestion.pack);
      if (selectedPacks.length === 0) return;
      openImportRules({
        initialSourceMode: 'pack',
        initialPackSelections: buildPackSelections(selectedPacks),
      });
    },
    [suggestions, openImportRules],
  );

  const totalGrouping = statisticsAggregates?.totalGrouping ?? 0;
  const totalDedup = statisticsAggregates?.totalDedup ?? 0;
  const totalSessions = sessions.length;
  const showStats = totalGrouping + totalDedup + totalSessions > 0;

  const handleQuickAction = useCallback(
    (id: QuickActionId) => {
      switch (id) {
        case 'organize':
          browser.runtime.sendMessage({ type: 'ORGANIZE_ALL_TABS' }).catch(() => {
            // Ignore: extension context may have been invalidated.
          });
          return;
        case 'snapshot':
          onOpenSnapshotWizard();
          return;
        case 'rule':
          onOpenRuleWizard();
          return;
        case 'io':
          onNavigate('importexport');
          return;
        case 'stats':
          onNavigate('stats');
          return;
        case 'shortcuts':
          onOpenShortcutsAside();
          return;
        case 'workspaces':
          onNavigate('workspaces');
          return;
      }
    },
    [onOpenSnapshotWizard, onOpenRuleWizard, onNavigate, onOpenShortcutsAside],
  );

  const homeShortcutBindings = useMemo<Record<string, ShortcutAction>>(
    () => ({
      'home.action.organize': () => handleQuickAction('organize'),
      'home.action.snapshot': () => handleQuickAction('snapshot'),
      'home.action.newRule': () => handleQuickAction('rule'),
      'home.action.io': () => handleQuickAction('io'),
      'home.action.stats': () => handleQuickAction('stats'),
    }),
    [handleQuickAction],
  );

  useShortcuts(homeShortcutBindings, { scope: 'page:home', enabled: !isLoading });

  const hasFocusedOnMount = useRef(false);
  useEffect(() => {
    if (isLoading) return;
    if (hasFocusedOnMount.current) return;
    hasFocusedOnMount.current = true;

    let selector: string;
    if (isEmpty) {
      // The contextual hero may mount slightly after the first paint, so match
      // either hero CTA.
      selector =
        '[data-testid="home-hero-suggest-import"], [data-testid="home-hero-import"]';
    } else if (pinnedSessions.length === 0) {
      selector = '[data-testid="home-quick-action-organize"]';
    } else {
      selector = `[data-testid="home-pinned-tile-${pinnedSessions[0].id}"]`;
    }
    const el = document.querySelector<HTMLElement>(selector);
    el?.focus();
  }, [isLoading, isEmpty, pinnedSessions]);

  const handleMiniStatNavigate = (route: MiniStatRoute) => {
    onNavigate(route);
  };

  const handleSeeAllSessions = () => {
    onNavigate('sessions');
  };

  const handleHeroImportPack = useCallback(() => {
    openImportRules({ initialSourceMode: 'pack' });
  }, [openImportRules]);

  return (
    <PageLayout
      titleKey="homeTab"
      descriptionKey="homePageDescription"
      syncSettings={syncSettings}
    >
      {() => (
        <Box data-testid="page-home">
          {isLoading ? (
            <HomePageSkeleton />
          ) : (
            <Flex direction="column" gap="5">
              {isEmpty &&
                (showContextualHero ? (
                  <HeroOnboardingSuggestions
                    suggestions={suggestions}
                    onImportAndOrganize={handleImportAndOrganize}
                  />
                ) : (
                  <HeroOnboarding
                    onImportPack={handleHeroImportPack}
                    onCreateRule={onOpenRuleWizard}
                  />
                ))}

              <PinnedSessionsSection
                sessions={pinnedSessions}
                onSeeAll={handleSeeAllSessions}
                onRestore={onRestore}
                defaultRestoreAction={syncSettings.defaultRestoreAction}
                onDefaultRestoreActionChange={onDefaultRestoreActionChange}
              />

              <QuickActionsSection count={QUICK_COUNT_DEFAULT} onAction={handleQuickAction} />

              <TipsSection variant="cards" />

              {showStats && (
                <MiniStatsSection
                  stats={{ groups: totalGrouping, dedup: totalDedup, sessions: totalSessions }}
                  onNavigate={handleMiniStatNavigate}
                  locale={locale}
                />
              )}
            </Flex>
          )}
        </Box>
      )}
    </PageLayout>
  );
}
