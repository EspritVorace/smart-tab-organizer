import { Card, Flex, Heading, Separator } from '@radix-ui/themes';
import type { MarginProps } from '@radix-ui/themes/dist/esm/props/margin.props.js';
import { getMessage } from '@/utils/i18n';
import { MetricRow } from '@/components/Core/Statistics/primitives';
import type { StatisticsAggregates } from '@/types/statistics';

interface ThisWeekStatsCardProps extends MarginProps {
  data: Pick<StatisticsAggregates, 'thisWeek' | 'lastWeek'>;
  /** Optional data-testid forwarded to the Card root. */
  testId?: string;
}

/**
 * Compact "this week" card showing grouping and deduplication counts with
 * week-over-week trend badges. Shared between StatisticsSummary and
 * StatisticsRulesDetail.
 */
export function ThisWeekStatsCard({ data, testId, ...marginProps }: ThisWeekStatsCardProps) {
  return (
    <Card data-testid={testId} {...marginProps}>
      <Flex direction="column" gap="3" p="2">
        <Heading size="3">{getMessage('statsThisWeekTitle')}</Heading>
        <Flex direction="column" gap="2">
          <MetricRow
            label={getMessage('statsGroupings')}
            value={data.thisWeek.grouping}
            current={data.thisWeek.grouping}
            previous={data.lastWeek.grouping}
          />
          <Separator size="4" />
          <MetricRow
            label={getMessage('statsDeduplications')}
            value={data.thisWeek.dedup}
            current={data.thisWeek.dedup}
            previous={data.lastWeek.dedup}
          />
        </Flex>
      </Flex>
    </Card>
  );
}
