import { Box, Card, Flex, Grid, Skeleton } from '@radix-ui/themes';
import { PageLayoutSkeleton } from '@/components/UI/PageLayout';

const CARDS = [0, 1, 2, 3, 4, 5];

export function ImportExportPageSkeleton() {
  return (
    <PageLayoutSkeleton titleKey="importExportTab" descriptionKey="importExportPageDescription">
      <Box data-testid="page-import-export-skeleton">
        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
          {CARDS.map((i) => (
            <Card key={i}>
              <Flex direction="column" gap="3" p="3">
                <Flex align="center" gap="2">
                  <Skeleton width="20px" height="20px" />
                  <Skeleton width="140px" height="20px" />
                </Flex>
                <Skeleton width="100%" height="14px" />
                <Skeleton width="80%" height="14px" />
                <Skeleton width="96px" height="32px" />
              </Flex>
            </Card>
          ))}
        </Grid>
      </Box>
    </PageLayoutSkeleton>
  );
}
