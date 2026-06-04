import { Card, Flex, Heading, Separator, Text } from '@radix-ui/themes';
import type { MarginProps } from '@radix-ui/themes/dist/esm/props/margin.props.js';
import { getMessage } from '@/utils/i18n';
import { TrendBadge } from '@/components/Core/Statistics/TrendBadge';
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
  );
}
