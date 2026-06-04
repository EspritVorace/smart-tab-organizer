import { Box, Button, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { Layers, Copy, RotateCcw } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { KpiTile, BarRow } from '@/components/Core/Statistics/primitives';
import { ThisWeekStatsCard } from './ThisWeekStatsCard';
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
          <Text size="2" color="gray">-</Text>
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

        <ThisWeekStatsCard data={data} testId="page-stats-card-this-week" />

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
