import { useCallback, useMemo } from 'react';
import { browser } from 'wxt/browser';
import { Box, Flex } from '@radix-ui/themes';
import { Home } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import type { AppSettings } from '@/types/syncSettings';
import type { Session } from '@/types/session';
import type { StatisticsAggregates } from '@/types/statistics';
import type { SourceMode } from '@/components/UI/ImportExportWizards/Source';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { HeroOnboarding } from '@/components/HomePage/HeroOnboarding';
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

export interface HomePageProps {
  syncSettings: AppSettings;
  statisticsAggregates: StatisticsAggregates | null;
  onNavigate: (tab: string) => void;
  onOpenSnapshotWizard: () => void;
  onOpenRuleWizard: () => void;
  /** Opens the rules import wizard via deep-link with from=home. */
  onOpenImportRules: (initialSourceMode?: SourceMode) => void;
  onOpenShortcutsAside: () => void;
  onRestore: (session: Session, target: HomeRestoreTarget) => void;
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
  onOpenImportRules,
  onOpenShortcutsAside,
  onRestore,
  locale,
}: HomePageProps) {
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

  const totalGrouping = statisticsAggregates?.totalGrouping ?? 0;
  const totalDedup = statisticsAggregates?.totalDedup ?? 0;
  const totalSessions = sessions.length;
  const showStats = totalGrouping + totalDedup + totalSessions > 0;

  const handleQuickAction = (id: QuickActionId) => {
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
  };

  const handleMiniStatNavigate = (route: MiniStatRoute) => {
    onNavigate(route);
  };

  const handleSeeAllSessions = () => {
    onNavigate('sessions');
  };

  const handleHeroImportPack = useCallback(() => {
    onOpenImportRules('pack');
  }, [onOpenImportRules]);

  return (
    <PageLayout
      titleKey="homeTab"
      descriptionKey="homePageDescription"
      icon={Home}
      syncSettings={syncSettings}
    >
      {() => (
        <Box data-testid="page-home">
          {isLoading ? (
            <HomePageSkeleton />
          ) : (
            <Flex direction="column" gap="5">
              {isEmpty && (
                <HeroOnboarding
                  onImportPack={handleHeroImportPack}
                  onCreateRule={onOpenRuleWizard}
                />
              )}

              <PinnedSessionsSection
                sessions={pinnedSessions}
                onSeeAll={handleSeeAllSessions}
                onRestore={onRestore}
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
