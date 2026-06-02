import { Box, Card, Flex, Grid, Heading, Separator, Text } from '@radix-ui/themes';
import { Layers, Copy, Pin, FolderOpen, Archive, HardDrive } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { formatBytes } from '@/utils/formatBytes';
import { TrendBadge } from '@/components/Core/Statistics/TrendBadge';
import { KpiTile } from '@/components/Core/Statistics/primitives';
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
        <KpiTile
          testId="page-stats-card-groups"
          icon={<Layers size={18} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />}
          label={getMessage('groupsCreated')}
          value={data.totalGrouping}
        />
        <KpiTile
          testId="page-stats-card-dedup"
          icon={<Copy size={18} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />}
          label={getMessage('tabsDeduplicated')}
          value={data.totalDedup}
        />
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

      <Card mt="4" data-testid="page-stats-summary-week">
        <Flex direction="column" gap="3" p="2">
          <Heading size="3">{getMessage('statsThisWeekTitle')}</Heading>
          <Flex direction="column" gap="2">
            <Flex justify="between" align="center">
              <Text size="2" weight="medium">{getMessage('statsGroupings')}</Text>
              <Flex align="center" gap="3">
                <Text size="4" weight="bold">{data.thisWeek.grouping}</Text>
                <TrendBadge current={data.thisWeek.grouping} previous={data.lastWeek.grouping} />
              </Flex>
            </Flex>
            <Separator size="4" />
            <Flex justify="between" align="center">
              <Text size="2" weight="medium">{getMessage('statsDeduplications')}</Text>
              <Flex align="center" gap="3">
                <Text size="4" weight="bold">{data.thisWeek.dedup}</Text>
                <TrendBadge current={data.thisWeek.dedup} previous={data.lastWeek.dedup} />
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
}
