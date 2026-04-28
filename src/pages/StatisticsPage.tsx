import { Box, Flex, Text, Button, Card, Separator, Heading } from '@radix-ui/themes';
import { BarChart3, RotateCcw, Layers, Copy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { getMessage } from '@/utils/i18n';
import type { AppSettings } from '@/types/syncSettings';
import type { StatisticsAggregates } from '@/types/statistics';

interface StatisticsPageProps {
  syncSettings: AppSettings;
  statisticsData: StatisticsAggregates | null;
  onReset: () => void;
}

type TrendDirection = 'new' | 'up' | 'down' | 'stable';

function getTrend(current: number, previous: number): TrendDirection {
  if (current === 0 && previous === 0) return 'stable';
  if (previous === 0 && current > 0) return 'new';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
}

interface TrendBadgeProps {
  current: number;
  previous: number;
}

function TrendBadge({ current, previous }: TrendBadgeProps) {
  const trend = getTrend(current, previous);
  const diff = Math.abs(current - previous);

  if (trend === 'stable') {
    return (
      <Flex align="center" gap="1">
        <Minus size={14} aria-hidden="true" style={{ color: 'var(--gray-9)' }} />
        <Text size="1" color="gray">{getMessage('statsTrendStable')}</Text>
      </Flex>
    );
  }

  if (trend === 'new') {
    return (
      <Flex align="center" gap="1">
        <TrendingUp size={14} aria-hidden="true" style={{ color: 'var(--accent-9)' }} />
        <Text size="1" style={{ color: 'var(--accent-11)' }}>{getMessage('statsTrendNewActivity')}</Text>
      </Flex>
    );
  }

  if (trend === 'up') {
    return (
      <Flex align="center" gap="1">
        <TrendingUp size={14} aria-label={getMessage('statsTrendUpAria')} style={{ color: 'var(--green-9)' }} />
        <Text size="1" style={{ color: 'var(--green-11)' }}>
          {getMessage('statsTrendUp').replace('{count}', String(diff))}
        </Text>
      </Flex>
    );
  }

  return (
    <Flex align="center" gap="1">
      <TrendingDown size={14} aria-label={getMessage('statsTrendDownAria')} style={{ color: 'var(--orange-9)' }} />
      <Text size="1" style={{ color: 'var(--orange-11)' }}>
        {getMessage('statsTrendDown').replace('{count}', String(diff))}
      </Text>
    </Flex>
  );
}

export function StatisticsPage({ syncSettings, statisticsData, onReset }: StatisticsPageProps) {
  const activeRulesCount = syncSettings.domainRules.filter(r => r.enabled).length;

  const firstUsedAtFormatted = statisticsData?.firstUsedAt
    ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(statisticsData.firstUsedAt)
    : null;

  const data = statisticsData ?? {
    totalGrouping: 0,
    totalDedup: 0,
    firstUsedAt: null,
    thisWeek: { grouping: 0, dedup: 0 },
    lastWeek: { grouping: 0, dedup: 0 },
    thisMonth: { grouping: 0, dedup: 0 },
    topRules: [],
  };

  return (
    <PageLayout
      titleKey="statisticsTab"
      descriptionKey="statisticsPageDescription"
      icon={BarChart3}
      syncSettings={syncSettings}
    >
      {() => (
        <Box data-testid="page-stats">

          {/* Section 1 : Totaux historiques */}
          <Card mb="4">
            <Flex direction="column" gap="3" p="2">
              <Heading size="3">{getMessage('statsHistoricalTotals')}</Heading>
              <Flex gap="4" wrap="wrap">
                <Card data-testid="page-stats-card-groups" style={{ flex: '1', minWidth: '180px' }}>
                  <Flex direction="column" gap="2" p="3">
                    <Flex align="center" gap="2">
                      <Layers size={18} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />
                      <Text size="2" color="gray" highContrast>{getMessage('groupsCreated')}</Text>
                    </Flex>
                    <Text size="8" weight="bold" style={{ color: 'var(--accent-11)' }}>
                      {data.totalGrouping}
                    </Text>
                  </Flex>
                </Card>

                <Card data-testid="page-stats-card-dedup" style={{ flex: '1', minWidth: '180px' }}>
                  <Flex direction="column" gap="2" p="3">
                    <Flex align="center" gap="2">
                      <Copy size={18} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />
                      <Text size="2" color="gray" highContrast>{getMessage('tabsDeduplicated')}</Text>
                    </Flex>
                    <Text size="8" weight="bold" style={{ color: 'var(--accent-11)' }}>
                      {data.totalDedup}
                    </Text>
                  </Flex>
                </Card>
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

          {/* Section 2 : Cette semaine */}
          <Card mb="4">
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

          {/* Section 3 : Top règles */}
          {data.topRules.length > 0 && (
            <Card mb="4">
              <Flex direction="column" gap="3" p="2">
                <Heading size="3">{getMessage('statsTopRulesTitle')}</Heading>

                <Flex direction="column" gap="3">
                  {data.topRules.map((rule, index) => {
                    const maxTotal = data.topRules[0].total;
                    const widthPct = maxTotal > 0 ? Math.round((rule.total / maxTotal) * 100) : 0;
                    const showDetail = rule.grouping > 0 && rule.dedup > 0;

                    return (
                      <Box key={rule.ruleId}>
                        <Flex justify="between" align="baseline" mb="1">
                          <Text size="2" weight="medium" style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {index + 1}. {rule.label}
                          </Text>
                          <Flex direction="column" align="end" gap="1">
                            <Text size="2" weight="bold">{rule.total}</Text>
                            {showDetail && (
                              <Text size="1" color="gray">
                                {getMessage('statsGroupingsAndDedup')
                                  .replace('{grouping}', String(rule.grouping))
                                  .replace('{dedup}', String(rule.dedup))}
                              </Text>
                            )}
                          </Flex>
                        </Flex>
                        <Box style={{
                          height: '6px',
                          borderRadius: 'var(--radius-1)',
                          backgroundColor: 'var(--gray-a3)',
                          overflow: 'hidden',
                        }}>
                          <Box style={{
                            height: '100%',
                            width: `${widthPct}%`,
                            backgroundColor: 'var(--accent-9)',
                            borderRadius: 'var(--radius-1)',
                          }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Flex>
              </Flex>
            </Card>
          )}

          <Box mt="4">
            <Button data-testid="page-stats-btn-reset" variant="soft" color="red" highContrast onClick={onReset}>
              <RotateCcw size={16} aria-hidden="true" />
              {getMessage('resetStats')}
            </Button>
          </Box>
        </Box>
      )}
    </PageLayout>
  );
}
