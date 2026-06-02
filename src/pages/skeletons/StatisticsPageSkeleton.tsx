import { Box, Card, Flex, Grid, Skeleton } from '@radix-ui/themes';
import { PageLayoutSkeleton } from '@/components/UI/PageLayout';

const CARDS: Array<{ heading: string; body: number }> = [
  { heading: '160px', body: 120 },
  { heading: '160px', body: 180 },
  { heading: '140px', body: 100 },
  { heading: '140px', body: 100 },
  { heading: '120px', body: 150 },
  { heading: '160px', body: 200 },
  { heading: '150px', body: 160 },
];

export function StatisticsPageSkeleton() {
  return (
    <PageLayoutSkeleton titleKey="statisticsTab" descriptionKey="statisticsPageDescription">
      <Box data-testid="page-stats-skeleton">
        <Grid columns={{ initial: '1', md: '2' }} gap="4">
          {CARDS.map((card, i) => (
            <Card key={i}>
              <Flex direction="column" gap="3" p="2">
                <Skeleton width={card.heading} height="20px" />
                <Skeleton height={`${card.body}px`} />
              </Flex>
            </Card>
          ))}
        </Grid>
        <Box mt="4">
          <Skeleton width="120px" height="32px" />
        </Box>
      </Box>
    </PageLayoutSkeleton>
  );
}
