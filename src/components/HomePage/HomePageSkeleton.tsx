import { Box, Card, Flex, Grid, Skeleton } from '@radix-ui/themes';

export function HomePageSkeleton() {
  return (
    <Box aria-busy="true" data-testid="home-skeleton">
      <Flex direction="column" gap="5">
        <Card>
          <Flex align="center" gap="3">
            <Skeleton width="28px" height="28px" />
            <Skeleton width="240px" height="20px" />
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Skeleton width="160px" height="16px" />
            <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height="116px" />
              ))}
            </Grid>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Skeleton width="140px" height="16px" />
            <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} height="88px" />
              ))}
            </Grid>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Skeleton width="100px" height="16px" />
            <Skeleton height="96px" />
          </Flex>
        </Card>
      </Flex>
    </Box>
  );
}
