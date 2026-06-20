import { Box, Grid } from '@radix-ui/themes';
import { Pin, FolderOpen, Archive, HardDrive } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { formatBytes } from '@/utils/formatBytes';
import { KpiTile, GroupingDeduplicationKpiPair } from '@/components/Core/Statistics/primitives';
import { ThisWeekStatsCard } from './ThisWeekStatsCard';
import type { StatisticsAggregates } from '@/types/statistics';
import type { SessionStatisticsSnapshot } from '@/hooks/useSessionStatistics';
import type { StorageUsageSnapshot } from '@/hooks/useStorageUsage';

interface StatisticsSummaryProps {
  data: StatisticsAggregates;
  snapshot: SessionStatisticsSnapshot;
  storageUsage: StorageUsageSnapshot;
}

/**
 * Overview sub-page: the headline KPIs (grouped tabs, deduplicated tabs,
 * pinned/active/archived session counts, total local storage size) plus a
 * compact look at this week's grouping and deduplication trends.
 */
export function StatisticsSummary({ data, snapshot, storageUsage }: StatisticsSummaryProps) {
  const { volumes } = snapshot;

  return (
    <Box data-testid="page-stats-summary">
      <Grid columns={{ initial: '2', sm: '3' }} gap="3">
        <GroupingDeduplicationKpiPair data={data} />
        <KpiTile
          testId="page-stats-summary-storage"
          icon={<HardDrive size={18} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />}
          label={getMessage('statsSummaryStorageTotal')}
          value={formatBytes(storageUsage.globalTotalBytes)}
        />
        <KpiTile
          testId="page-stats-summary-sessions-pinned"
          icon={<Pin size={18} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />}
          label={getMessage('statsSessionsPinned')}
          value={volumes.pinned}
        />
        <KpiTile
          testId="page-stats-summary-sessions-active"
          icon={<FolderOpen size={18} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />}
          label={getMessage('statsSessionsActive')}
          value={volumes.active}
        />
        <KpiTile
          testId="page-stats-summary-sessions-archived"
          icon={<Archive size={18} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />}
          label={getMessage('statsSessionsArchived')}
          value={volumes.archived}
        />
      </Grid>

      <ThisWeekStatsCard data={data} testId="page-stats-summary-week" mt="4" />
    </Box>
  );
}
