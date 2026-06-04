import { Box, Badge, Card, Flex, Grid, Heading, Separator, Text, Tooltip } from '@radix-ui/themes';
import {
  Layers, Archive, Pin, FolderOpen, ListTree, Globe, Palette, Clock, Calendar, Info, Tag,
} from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { formatSessionDate } from '@/utils/sessionUtils';
import { getRuleCategory, getCategoryLabel } from '@/utils/categoriesStore';
import { SmallKpiTile, BarRow, GroupColorBar, MetricRow } from '@/components/Core/Statistics/primitives';
import type { StatisticsAggregates } from '@/types/statistics';
import type { SessionStatisticsSnapshot } from '@/hooks/useSessionStatistics';

interface StatisticsSessionsDetailProps {
  snapshot: SessionStatisticsSnapshot;
  events: StatisticsAggregates['sessionEvents'];
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
          <MetricRow
            label={getMessage('statsSessionsCreated')}
            value={events.thisWeek.created}
            current={events.thisWeek.created}
            previous={events.lastWeek.created}
          />

          <Separator size="4" />

          <MetricRow
            label={getMessage('statsTabsRestored')}
            value={events.thisWeek.tabsRestored}
            current={events.thisWeek.tabsRestored}
            previous={events.lastWeek.tabsRestored}
          />
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
            <MetricRow
              label={getMessage('statsSessionsCreatedThisWeek')}
              value={temporal.createdThisWeek}
              current={temporal.createdThisWeek}
              previous={temporal.createdLastWeek}
              valueSize="3"
              labelColor="gray"
            />
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

/**
 * Sessions sub-page: volumes, activity trend, top categories/domains and the
 * full sessions overview (timeline, group colors, largest sessions).
 */
export function StatisticsSessionsDetail({ snapshot, events }: StatisticsSessionsDetailProps) {
  return (
    <Box data-testid="page-stats-sessions">
      <Grid columns={{ initial: '1', md: '2' }} gap="4">
        <SessionVolumesCard snapshot={snapshot} />
        <SessionActivityCard events={events} />
        <TopCategoriesDomainsCard snapshot={snapshot} />
        <SessionsOverviewCard snapshot={snapshot} events={events} />
      </Grid>
    </Box>
  );
}
