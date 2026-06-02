import { Box, Card, Flex, Grid, Skeleton } from '@radix-ui/themes';
import { PageLayoutSkeleton } from '@/components/UI/PageLayout';
import type { StatsSubTab } from '@/hooks/useDeepLinking';

interface StatisticsPageSkeletonProps {
  statsTab?: StatsSubTab;
}

/** Faux TabNav row matching the four statistics sub-tabs. */
function TabsRowSkeleton() {
  return (
    <Flex gap="4" mb="4" pb="2" style={{ borderBottom: '1px solid var(--gray-a4)' }}>
      <Skeleton width="70px" height="20px" />
      <Skeleton width="60px" height="20px" />
      <Skeleton width="80px" height="20px" />
      <Skeleton width="80px" height="20px" />
    </Flex>
  );
}

function CardSkeleton({ heading, body }: { heading: string; body: number }) {
  return (
    <Card>
      <Flex direction="column" gap="3" p="2">
        <Skeleton width={heading} height="20px" />
        <Skeleton height={`${body}px`} />
      </Flex>
    </Card>
  );
}

function SummarySkeleton() {
  return (
    <Box>
      <Grid columns={{ initial: '2', sm: '3' }} gap="3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <Flex direction="column" gap="2" p="3">
              <Skeleton width="90px" height="16px" />
              <Skeleton width="60px" height="32px" />
            </Flex>
          </Card>
        ))}
      </Grid>
      <Box mt="4">
        <CardSkeleton heading="120px" body={90} />
      </Box>
    </Box>
  );
}

function RulesSkeleton() {
  return (
    <Box>
      <Grid columns={{ initial: '1', md: '2' }} gap="4">
        <CardSkeleton heading="160px" body={120} />
        <CardSkeleton heading="120px" body={120} />
      </Grid>
      <Box mt="4">
        <CardSkeleton heading="150px" body={160} />
      </Box>
      <Box mt="4">
        <Skeleton width="120px" height="32px" />
      </Box>
    </Box>
  );
}

function SessionsSkeleton() {
  return (
    <Grid columns={{ initial: '1', md: '2' }} gap="4">
      <CardSkeleton heading="160px" body={180} />
      <CardSkeleton heading="140px" body={140} />
      <CardSkeleton heading="150px" body={200} />
      <CardSkeleton heading="160px" body={200} />
    </Grid>
  );
}

function StorageSkeleton() {
  return <CardSkeleton heading="160px" body={240} />;
}

export function StatisticsPageSkeleton({ statsTab = 'summary' }: StatisticsPageSkeletonProps) {
  return (
    <PageLayoutSkeleton titleKey="statisticsTab" descriptionKey="statisticsPageDescription">
      <Box data-testid="page-stats-skeleton">
        <TabsRowSkeleton />
        {statsTab === 'summary' && <SummarySkeleton />}
        {statsTab === 'rules' && <RulesSkeleton />}
        {statsTab === 'sessions' && <SessionsSkeleton />}
        {statsTab === 'storage' && <StorageSkeleton />}
      </Box>
    </PageLayoutSkeleton>
  );
}
