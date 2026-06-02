import { useMemo } from 'react';
import { Box, Flex, Text, Button, Card, Separator, Heading, Grid, Tooltip, Badge } from '@radix-ui/themes';
import {
  RotateCcw, Layers, Copy, Archive, Pin, FolderOpen, ListTree,
  Globe, Palette, Clock, Calendar, Info, Tag, HardDrive,
} from 'lucide-react';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { getMessage } from '@/utils/i18n';
import { formatSessionDate } from '@/utils/sessionUtils';
import { formatBytes } from '@/utils/formatBytes';
import { getRuleCategory, getCategoryLabel } from '@/utils/categoriesStore';
import { TrendBadge } from '@/components/Core/Statistics/TrendBadge';
import type { AppSettings } from '@/types/syncSettings';
import type { StatisticsAggregates } from '@/types/statistics';
import type {
  SessionStatisticsSnapshot,
  GroupColorStat,
} from '@/hooks/useSessionStatistics';
import type { StorageUsageSnapshot } from '@/hooks/useStorageUsage';
import type { ChromeGroupColor } from '@/types/tabTree';

interface StatisticsPageProps {
  syncSettings: AppSettings;
  statisticsData: StatisticsAggregates | null;
  sessionStats: SessionStatisticsSnapshot | null;
  storageUsage: StorageUsageSnapshot;
  onReset: () => void;
}

const GROUP_COLOR_CSS: Record<ChromeGroupColor, string> = {
  grey: 'var(--gray-9)',
  blue: 'var(--blue-9)',
  red: 'var(--red-9)',
  yellow: 'var(--yellow-9)',
  green: 'var(--green-9)',
  pink: 'var(--pink-9)',
  purple: 'var(--purple-9)',
  cyan: 'var(--cyan-9)',
  orange: 'var(--orange-9)',
};

const GROUP_COLOR_LABEL_KEY: Record<ChromeGroupColor, string> = {
  grey: 'statsGroupColorGrey',
  blue: 'statsGroupColorBlue',
  red: 'statsGroupColorRed',
  yellow: 'statsGroupColorYellow',
  green: 'statsGroupColorGreen',
  pink: 'statsGroupColorPink',
  purple: 'statsGroupColorPurple',
  cyan: 'statsGroupColorCyan',
  orange: 'statsGroupColorOrange',
};

function KpiTile({ icon, label, value, testId }: { icon: React.ReactNode; label: string; value: React.ReactNode; testId?: string }) {
  return (
    <Card data-testid={testId} style={{ flex: '1', minWidth: '150px' }}>
      <Flex direction="column" gap="2" p="3">
        <Flex align="center" gap="2">
          {icon}
          <Text size="2" color="gray" highContrast>{label}</Text>
        </Flex>
        <Text size="8" weight="bold" style={{ color: 'var(--accent-11)' }}>
          {value}
        </Text>
      </Flex>
    </Card>
  );
}

function SmallKpiTile({ icon, label, value, testId, minWidth = '110px' }: { icon: React.ReactNode; label: string; value: React.ReactNode; testId?: string; minWidth?: string | number }) {
  return (
    <Card data-testid={testId} style={{ flex: '1', minWidth }}>
      <Flex direction="column" gap="1" p="2">
        <Flex align="center" gap="1">
          {icon}
          <Text size="1" color="gray" highContrast>{label}</Text>
        </Flex>
        <Text size="6" weight="bold" style={{ color: 'var(--accent-11)' }}>
          {value}
        </Text>
      </Flex>
    </Card>
  );
}

interface BarRowProps {
  label: string;
  value: number;
  maxValue: number;
  index: number;
  testId?: string;
  rightDetail?: string;
  /** Overrides the displayed value (e.g. a formatted size). The bar width still uses `value`. */
  valueLabel?: string;
}

function BarRow({ label, value, maxValue, index, testId, rightDetail, valueLabel }: BarRowProps) {
  const widthPct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  return (
    <Box data-testid={testId}>
      <Flex justify="between" align="baseline" mb="1">
        <Text size="2" weight="medium" style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {index + 1}. {label}
        </Text>
        <Flex direction="column" align="end" gap="1">
          <Text size="2" weight="bold">{valueLabel ?? value}</Text>
          {rightDetail && <Text size="1" color="gray">{rightDetail}</Text>}
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
}

function GroupColorBar({ distribution }: { distribution: GroupColorStat[] }) {
  const total = distribution.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return null;

  return (
    <Box>
      <Box
        style={{
          display: 'flex',
          width: '100%',
          height: '14px',
          borderRadius: 'var(--radius-2)',
          overflow: 'hidden',
          backgroundColor: 'var(--gray-a3)',
        }}
        data-testid="page-stats-color-distribution"
      >
        {distribution.map(d => (
          <Tooltip key={d.color} content={`${getMessage(GROUP_COLOR_LABEL_KEY[d.color])} (${d.count})`}>
            <Box
              style={{
                width: `${(d.count / total) * 100}%`,
                backgroundColor: GROUP_COLOR_CSS[d.color],
              }}
            />
          </Tooltip>
        ))}
      </Box>
      <Flex gap="3" wrap="wrap" mt="2">
        {distribution.map(d => (
          <Flex key={d.color} align="center" gap="1">
            <Box style={{
              width: '10px',
              height: '10px',
              borderRadius: 'var(--radius-1)',
              backgroundColor: GROUP_COLOR_CSS[d.color],
            }} />
            <Text size="1" color="gray">{getMessage(GROUP_COLOR_LABEL_KEY[d.color])} ({d.count})</Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}

function SessionVolumesCard({ snapshot }: { snapshot: SessionStatisticsSnapshot }) {
  const { volumes } = snapshot;
  const avg = volumes.averageTabsPerSession;
  const avgFormatted = avg.toFixed(avg < 10 ? 1 : 0);
  return (
    <Card data-testid="page-stats-card-session-volumes">
      <Flex direction="column" gap="3" p="2">
        <Flex align="center" justify="between" gap="2" wrap="wrap">
          <Heading size="3">{getMessage('statsSessionsVolumesTitle')}</Heading>
          <Tooltip content={getMessage('statsSessionsScopeActive')}>
            <Flex align="center" gap="1">
              <Info size={14} style={{ color: 'var(--gray-9)' }} aria-hidden="true" />
              <Text size="1" color="gray">{getMessage('statsSessionsScopeActive')}</Text>
            </Flex>
          </Tooltip>
        </Flex>

        <Grid columns="4" gap="2">
          <SmallKpiTile
            testId="page-stats-tile-sessions-total"
            icon={<FolderOpen size={14} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />}
            label={getMessage('statsSessionsTotal')}
            value={volumes.total}
            minWidth={0}
          />
          <SmallKpiTile
            testId="page-stats-tile-sessions-pinned"
            icon={<Pin size={14} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />}
            label={getMessage('statsSessionsPinned')}
            value={volumes.pinned}
            minWidth={0}
          />
          <SmallKpiTile
            testId="page-stats-tile-sessions-active"
            icon={<FolderOpen size={14} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />}
            label={getMessage('statsSessionsActive')}
            value={volumes.active}
            minWidth={0}
          />
          <SmallKpiTile
            testId="page-stats-tile-sessions-archived"
            icon={<Archive size={14} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />}
            label={getMessage('statsSessionsArchived')}
            value={volumes.archived}
            minWidth={0}
          />
        </Grid>

        <Flex gap="2" wrap="wrap">
          <SmallKpiTile
            testId="page-stats-tile-sessions-total-tabs"
            icon={<ListTree size={14} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />}
            label={getMessage('statsSessionsTotalTabs')}
            value={volumes.totalTabs}
          />
          <SmallKpiTile
            testId="page-stats-tile-sessions-total-groups"
            icon={<Layers size={14} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />}
            label={getMessage('statsSessionsTotalGroups')}
            value={volumes.totalGroups}
          />
        </Flex>

        {volumes.total > 0 && (
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">
              {getMessage('statsSessionsAvgTabs').replace('{count}', avgFormatted)}
            </Text>
            {volumes.largest && (
              <Text size="2" color="gray">
                {getMessage('statsSessionsLargest')
                  .replace('{name}', volumes.largest.name)
                  .replace('{count}', String(volumes.largest.tabCount))}
              </Text>
            )}
            <Flex gap="2" wrap="wrap" mt="1">
              <Badge variant="soft" color="gray">
                {getMessage('statsSessionsWithNote').replace('{percent}', String(Math.round(volumes.percentWithNote)))}
              </Badge>
              <Badge variant="soft" color="gray">
                {getMessage('statsSessionsWithCategory').replace('{percent}', String(Math.round(volumes.percentWithCategory)))}
              </Badge>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

function SessionActivityCard({ events }: { events: StatisticsAggregates['sessionEvents'] }) {
  return (
    <Card data-testid="page-stats-card-session-activity">
      <Flex direction="column" gap="3" p="2">
        <Heading size="3">{getMessage('statsSessionsActivityTitle')}</Heading>

        <Flex direction="column" gap="2">
          <Flex justify="between" align="center">
            <Text size="2" weight="medium">{getMessage('statsSessionsCreated')}</Text>
            <Flex align="center" gap="3">
              <Text size="4" weight="bold">{events.thisWeek.created}</Text>
              <TrendBadge current={events.thisWeek.created} previous={events.lastWeek.created} />
            </Flex>
          </Flex>

          <Separator size="4" />

          <Flex justify="between" align="center">
            <Text size="2" weight="medium">{getMessage('statsTabsRestored')}</Text>
            <Flex align="center" gap="3">
              <Text size="4" weight="bold">{events.thisWeek.tabsRestored}</Text>
              <TrendBadge current={events.thisWeek.tabsRestored} previous={events.lastWeek.tabsRestored} />
            </Flex>
          </Flex>
        </Flex>

        <Text size="1" color="gray">
          {getMessage('statsSessionsLifetime')
            .replace('{created}', String(events.totals.created))
            .replace('{restored}', String(events.totals.restored))
            .replace('{archived}', String(events.totals.archived))}
        </Text>
      </Flex>
    </Card>
  );
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

function TopCategoriesDomainsCard({ snapshot }: { snapshot: SessionStatisticsSnapshot }) {
  const { composition } = snapshot;
  const categoryLabel = (id: string) => {
    const cat = getRuleCategory(id);
    if (!cat) return id;
    return `${cat.emoji} ${getCategoryLabel(cat)}`;
  };

  return (
    <Card data-testid="page-stats-card-top-cat-domains">
      <Flex direction="column" gap="3" p="2">
        <Flex align="center" gap="2">
          <Tag size={16} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />
          <Heading size="3">{getMessage('statsTopCategoriesTitle')}</Heading>
        </Flex>
        {composition.topCategories.length > 0 ? (
          <Flex direction="column" gap="3">
            {composition.topCategories.map((cat, index) => (
              <BarRow
                key={cat.id}
                index={index}
                label={categoryLabel(cat.id)}
                value={cat.count}
                maxValue={composition.topCategories[0].count}
              />
            ))}
          </Flex>
        ) : (
          <Text size="2" color="gray">—</Text>
        )}

        <Separator size="4" />

        <Flex align="center" gap="2">
          <Globe size={16} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />
          <Heading size="3">{getMessage('statsTopDomainsTitle')}</Heading>
        </Flex>
        {composition.topDomains.length > 0 ? (
          <Flex direction="column" gap="3">
            {composition.topDomains.map((dom, index) => (
              <BarRow
                key={dom.host}
                index={index}
                label={dom.host}
                value={dom.count}
                maxValue={composition.topDomains[0].count}
              />
            ))}
          </Flex>
        ) : (
          <Text size="2" color="gray">—</Text>
        )}
      </Flex>
    </Card>
  );
}

function SessionsOverviewCard({ snapshot, events }: { snapshot: SessionStatisticsSnapshot; events: StatisticsAggregates['sessionEvents'] }) {
  const { temporal, composition } = snapshot;
  return (
    <Card data-testid="page-stats-card-sessions-overview">
      <Flex direction="column" gap="4" p="2">
        <Heading size="3">{getMessage('statsSessionsOverviewTitle')}</Heading>

        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <Clock size={16} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />
            <Heading size="2">{getMessage('statsTemporalTitle')}</Heading>
          </Flex>
          <Flex direction="column" gap="2">
            {temporal.oldest && (
              <Flex justify="between" align="center" gap="3" wrap="wrap">
                <Flex align="center" gap="2">
                  <Calendar size={14} style={{ color: 'var(--gray-9)' }} aria-hidden="true" />
                  <Text size="2" color="gray">{getMessage('statsOldestSession')}</Text>
                </Flex>
                <Text size="2" weight="medium">
                  {temporal.oldest.name} <Text size="1" color="gray">({formatSessionDate(temporal.oldest.createdAt)})</Text>
                </Text>
              </Flex>
            )}
            {temporal.mostRecentlyUpdated && (
              <Flex justify="between" align="center" gap="3" wrap="wrap">
                <Flex align="center" gap="2">
                  <Calendar size={14} style={{ color: 'var(--gray-9)' }} aria-hidden="true" />
                  <Text size="2" color="gray">{getMessage('statsMostRecentlyUpdated')}</Text>
                </Flex>
                <Text size="2" weight="medium">
                  {temporal.mostRecentlyUpdated.name} <Text size="1" color="gray">({formatSessionDate(temporal.mostRecentlyUpdated.updatedAt)})</Text>
                </Text>
              </Flex>
            )}
            <Flex justify="between" align="center" gap="3" wrap="wrap">
              <Text size="2" color="gray">{getMessage('statsSessionsCreatedThisWeek')}</Text>
              <Flex align="center" gap="3">
                <Text size="3" weight="bold">{temporal.createdThisWeek}</Text>
                <TrendBadge current={temporal.createdThisWeek} previous={temporal.createdLastWeek} />
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        {composition.groupColorDistribution.length > 0 && (
          <>
            <Separator size="4" />
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                <Palette size={16} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />
                <Heading size="2">{getMessage('statsGroupColorDistTitle')}</Heading>
              </Flex>
              <GroupColorBar distribution={composition.groupColorDistribution} />
            </Flex>
          </>
        )}

        {composition.topSessionsByTabs.length > 0 && (
          <>
            <Separator size="4" />
            <Flex direction="column" gap="3">
              <Flex align="center" gap="2">
                <ListTree size={16} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />
                <Heading size="2">{getMessage('statsTopSessionsTitle')}</Heading>
              </Flex>
              {composition.topSessionsByTabs.map((session, index) => (
                <BarRow
                  key={session.id}
                  index={index}
                  label={session.name}
                  value={session.tabCount}
                  maxValue={composition.topSessionsByTabs[0].tabCount}
                  rightDetail={getMessage('statsTabsCountSuffix').replace('{count}', String(session.tabCount))}
                />
              ))}
            </Flex>
          </>
        )}

        {snapshot.volumes.total === 0 && events.totals.created === 0 && (
          <Text size="2" color="gray">{getMessage('statsNoSessionsYet')}</Text>
        )}
      </Flex>
    </Card>
  );
}

function StorageUsageCard({ usage }: { usage: StorageUsageSnapshot }) {
  const maxBytes = usage.categories.length > 0 ? usage.categories[0].bytes : 0;
  const quotaPct = usage.quotaBytes > 0 ? Math.min(100, Math.round(usage.quotaPercent)) : 0;

  return (
    <Card data-testid="page-stats-card-storage">
      <Flex direction="column" gap="4" p="2">
        <Flex align="center" gap="2">
          <HardDrive size={16} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />
          <Heading size="3">{getMessage('statsStorageTitle')}</Heading>
        </Flex>

        <Box>
          <Text size="2" color="gray">
            {getMessage('statsStorageQuota')
              .replace('{used}', formatBytes(usage.globalTotalBytes))
              .replace('{quota}', formatBytes(usage.quotaBytes))
              .replace('{percent}', String(quotaPct))}
          </Text>
          <Box mt="2" style={{
            height: '14px',
            borderRadius: 'var(--radius-2)',
            backgroundColor: 'var(--gray-a3)',
            overflow: 'hidden',
          }}>
            <Box style={{
              height: '100%',
              width: `${quotaPct}%`,
              backgroundColor: 'var(--accent-9)',
              borderRadius: 'var(--radius-2)',
            }} />
          </Box>
        </Box>

        <Separator size="4" />

        {usage.categories.length > 0 ? (
          <Flex direction="column" gap="3">
            {usage.categories.map((cat, index) => (
              <BarRow
                key={cat.id}
                index={index}
                label={getMessage(cat.labelKey)}
                value={cat.bytes}
                valueLabel={formatBytes(cat.bytes)}
                maxValue={maxBytes}
                testId={`page-stats-storage-row-${cat.id}`}
              />
            ))}
          </Flex>
        ) : (
          <Text size="2" color="gray">—</Text>
        )}
      </Flex>
    </Card>
  );
}

export function StatisticsPage({ syncSettings, statisticsData, sessionStats, storageUsage, onReset }: StatisticsPageProps) {
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

  return (
    <PageLayout
      titleKey="statisticsTab"
      descriptionKey="statisticsPageDescription"
      syncSettings={syncSettings}
    >
      {() => (
        <Box data-testid="page-stats">
          <Grid columns={{ initial: '1', md: '2' }} gap="4">

            {/* Row 1: Historical totals (rules) | Session volumes */}
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

            <SessionVolumesCard snapshot={snapshot} />

            {/* Row 2: This week (rules) | Session activity */}
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

            <SessionActivityCard events={data.sessionEvents} />

            {/* Row 3: Top rules | Top categories / domains */}
            <TopRulesCard data={data} />
            <TopCategoriesDomainsCard snapshot={snapshot} />

            {/* Row 4: full-width sessions overview */}
            <Box style={{ gridColumn: '1 / -1' }}>
              <SessionsOverviewCard snapshot={snapshot} events={data.sessionEvents} />
            </Box>

            {/* Row 5: full-width local storage usage */}
            <Box style={{ gridColumn: '1 / -1' }}>
              <StorageUsageCard usage={storageUsage} />
            </Box>
          </Grid>

          <Box mt="4">
            <Button data-testid="page-stats-btn-reset" variant="soft" color="red" highContrast onClick={onReset}>
              <RotateCcw size={16} />
              {getMessage('resetStats')}
            </Button>
          </Box>
        </Box>
      )}
    </PageLayout>
  );
}
