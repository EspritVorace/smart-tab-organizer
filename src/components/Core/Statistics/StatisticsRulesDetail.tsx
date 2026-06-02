import { Box, Button, Card, Flex, Grid, Heading, Separator, Text } from '@radix-ui/themes';
import { Layers, Copy, RotateCcw } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { TrendBadge } from '@/components/Core/Statistics/TrendBadge';
import { KpiTile, BarRow } from '@/components/Core/Statistics/primitives';
import type { StatisticsAggregates } from '@/types/statistics';

interface StatisticsRulesDetailProps {
  data: StatisticsAggregates;
  activeRulesCount: number;
  firstUsedAtFormatted: string | null;
  onReset: () => void;
}

function TopRulesCard({ data }: { data: StatisticsAggregates }) {
  return (
    <Card data-testid="page-stats-card-top-rules">
      <Flex direction="column" gap="3" p="2">
        <Heading size="3">{getMessage('statsTopRulesTitle')}</Heading>
        {data.topRules.length > 0 ? (
          <Flex direction="column" gap="3">
            {data.topRules.map((rule, index) => {
              const maxTotal = data.topRules[0].total;
              const showDetail = rule.grouping > 0 && rule.dedup > 0;
              const detail = showDetail
                ? getMessage('statsGroupingsAndDedup')
                    .replace('{grouping}', String(rule.grouping))
                    .replace('{dedup}', String(rule.dedup))
                : undefined;
              return (
                <BarRow
                  key={rule.ruleId}
                  index={index}
                  label={rule.label}
                  value={rule.total}
                  maxValue={maxTotal}
                  rightDetail={detail}
                />
              );
            })}
          </Flex>
        ) : (
          <Text size="2" color="gray">—</Text>
        )}
      </Flex>
    </Card>
  );
}

/**
 * Rules sub-page: grouping/deduplication detail (lifetime totals, this week's
 * trend, most active rules) plus the global statistics reset button.
 */
export function StatisticsRulesDetail({ data, activeRulesCount, firstUsedAtFormatted, onReset }: StatisticsRulesDetailProps) {
  return (
    <Box data-testid="page-stats-rules">
      <Grid columns={{ initial: '1', md: '2' }} gap="4">
        <Card data-testid="page-stats-card-historical">
          <Flex direction="column" gap="3" p="2">
            <Heading size="3">{getMessage('statsHistoricalTotals')}</Heading>
            <Flex gap="3" wrap="wrap">
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
            </Flex>
            <Flex gap="4" wrap="wrap">
              <Text size="2" color="gray">
                {getMessage('statsActiveRulesCount').replace('{count}', String(activeRulesCount))}
              </Text>
              {firstUsedAtFormatted && (
                <Text size="2" color="gray">
                  {getMessage('statsUsageSince').replace('{date}', firstUsedAtFormatted)}
                </Text>
              )}
            </Flex>
          </Flex>
        </Card>

        <Card data-testid="page-stats-card-this-week">
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

        <Box style={{ gridColumn: '1 / -1' }}>
          <TopRulesCard data={data} />
        </Box>
      </Grid>

      <Box mt="4">
        <Button data-testid="page-stats-btn-reset" variant="soft" color="red" highContrast onClick={onReset}>
          <RotateCcw size={16} />
          {getMessage('resetStats')}
        </Button>
      </Box>
    </Box>
  );
}
