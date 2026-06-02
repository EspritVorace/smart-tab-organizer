import { useMemo } from 'react';
import { Box, TabNav } from '@radix-ui/themes';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { getMessage } from '@/utils/i18n';
import { StatisticsSummary } from '@/components/Core/Statistics/StatisticsSummary';
import { StatisticsRulesDetail } from '@/components/Core/Statistics/StatisticsRulesDetail';
import { StatisticsSessionsDetail } from '@/components/Core/Statistics/StatisticsSessionsDetail';
import { StatisticsStorageDetail } from '@/components/Core/Statistics/StatisticsStorageDetail';
import type { StatsSubTab } from '@/hooks/useDeepLinking';
import type { AppSettings } from '@/types/syncSettings';
import type { StatisticsAggregates } from '@/types/statistics';
import type { SessionStatisticsSnapshot } from '@/hooks/useSessionStatistics';
import type { StorageUsageSnapshot } from '@/hooks/useStorageUsage';

interface StatisticsPageProps {
  syncSettings: AppSettings;
  statisticsData: StatisticsAggregates | null;
  sessionStats: SessionStatisticsSnapshot | null;
  storageUsage: StorageUsageSnapshot;
  onReset: () => void;
  statsTab: StatsSubTab;
  onStatsTabChange: (tab: StatsSubTab) => void;
}

const SUB_TAB_HASH: Record<StatsSubTab, string> = {
  summary: '#stats',
  rules: '#stats/rules',
  sessions: '#stats/sessions',
  storage: '#stats/storage',
};

const SUB_TAB_DESCRIPTION_KEY: Record<Exclude<StatsSubTab, 'summary'>, string> = {
  rules: 'statsRulesPageDescription',
  sessions: 'statsSessionsPageDescription',
  storage: 'statsStoragePageDescription',
};

export function StatisticsPage({ syncSettings, statisticsData, sessionStats, storageUsage, onReset, statsTab, onStatsTabChange }: StatisticsPageProps) {
  const activeRulesCount = syncSettings.domainRules.filter(r => r.enabled).length;

  const firstUsedAtFormatted = statisticsData?.firstUsedAt
    ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(statisticsData.firstUsedAt)
    : null;

  const data = useMemo<StatisticsAggregates>(() => statisticsData ?? {
    totalGrouping: 0,
    totalDedup: 0,
    firstUsedAt: null,
    thisWeek: { grouping: 0, dedup: 0 },
    lastWeek: { grouping: 0, dedup: 0 },
    thisMonth: { grouping: 0, dedup: 0 },
    topRules: [],
    sessionEvents: {
      totals: { created: 0, restored: 0, tabsRestored: 0, archived: 0 },
      thisWeek: { created: 0, restored: 0, tabsRestored: 0 },
      lastWeek: { created: 0, restored: 0, tabsRestored: 0 },
    },
  }, [statisticsData]);

  const emptySessionStats: SessionStatisticsSnapshot = useMemo(() => ({
    volumes: {
      total: 0, pinned: 0, active: 0, archived: 0,
      totalTabs: 0, totalGroups: 0,
      averageTabsPerSession: 0,
      largest: null,
      percentWithNote: 0, percentWithCategory: 0,
    },
    composition: {
      topCategories: [],
      topDomains: [],
      groupColorDistribution: [],
      topSessionsByTabs: [],
    },
    temporal: {
      oldest: null,
      mostRecentlyUpdated: null,
      createdThisWeek: 0,
      createdLastWeek: 0,
      updatedThisWeek: 0,
    },
    isLoaded: false,
  }), []);

  const snapshot = sessionStats ?? emptySessionStats;

  const handleTabChange = (next: StatsSubTab) => {
    onStatsTabChange(next);
    // Keep the URL hash in sync so back/forward and shareable links work.
    const nextHash = SUB_TAB_HASH[next];
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  };

  const descriptionOverride = statsTab === 'summary'
    ? undefined
    : getMessage(SUB_TAB_DESCRIPTION_KEY[statsTab]);

  return (
    <PageLayout
      titleKey="statisticsTab"
      descriptionKey="statisticsPageDescription"
      descriptionOverride={descriptionOverride}
      syncSettings={syncSettings}
    >
      {() => (
        <Box data-testid="page-stats">
          <Box mb="3">
            <TabNav.Root data-testid="page-stats-tabs">
              <TabNav.Link
                href="#stats"
                active={statsTab === 'summary'}
                data-testid="page-stats-tab-summary"
                onClick={(e) => { e.preventDefault(); handleTabChange('summary'); }}
              >
                {getMessage('statsSummaryTab')}
              </TabNav.Link>
              <TabNav.Link
                href="#stats/rules"
                active={statsTab === 'rules'}
                data-testid="page-stats-tab-rules"
                onClick={(e) => { e.preventDefault(); handleTabChange('rules'); }}
              >
                {getMessage('statsRulesTab')}
              </TabNav.Link>
              <TabNav.Link
                href="#stats/sessions"
                active={statsTab === 'sessions'}
                data-testid="page-stats-tab-sessions"
                onClick={(e) => { e.preventDefault(); handleTabChange('sessions'); }}
              >
                {getMessage('statsSessionsTab')}
              </TabNav.Link>
              <TabNav.Link
                href="#stats/storage"
                active={statsTab === 'storage'}
                data-testid="page-stats-tab-storage"
                onClick={(e) => { e.preventDefault(); handleTabChange('storage'); }}
              >
                {getMessage('statsStorageTab')}
              </TabNav.Link>
            </TabNav.Root>
          </Box>

          {statsTab === 'summary' && (
            <StatisticsSummary data={data} snapshot={snapshot} storageUsage={storageUsage} />
          )}
          {statsTab === 'rules' && (
            <StatisticsRulesDetail
              data={data}
              activeRulesCount={activeRulesCount}
              firstUsedAtFormatted={firstUsedAtFormatted}
              onReset={onReset}
            />
          )}
          {statsTab === 'sessions' && (
            <StatisticsSessionsDetail snapshot={snapshot} events={data.sessionEvents} />
          )}
          {statsTab === 'storage' && (
            <StatisticsStorageDetail usage={storageUsage} />
          )}
        </Box>
      )}
    </PageLayout>
  );
}
