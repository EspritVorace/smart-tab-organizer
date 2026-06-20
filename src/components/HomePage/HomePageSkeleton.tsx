import { Box, Card, Flex, Grid, Skeleton } from '@radix-ui/themes';

interface GridSectionConfig {
  titleWidth: string;
  columns: { initial: string; sm: string; md: string };
  itemCount: number;
  itemHeight: string;
}

const GRID_SECTIONS: GridSectionConfig[] = [
  { titleWidth: '160px', columns: { initial: '1', sm: '2', md: '3' }, itemCount: 3, itemHeight: '116px' },
  { titleWidth: '140px', columns: { initial: '1', sm: '2', md: '3' }, itemCount: 5, itemHeight: '88px' },
];

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

        {GRID_SECTIONS.map((section, i) => (
          <Card key={i}>
            <Flex direction="column" gap="3">
              <Skeleton width={section.titleWidth} height="16px" />
              <Grid columns={section.columns} gap="3">
                {Array.from({ length: section.itemCount }, (_, j) => (
                  <Skeleton key={j} height={section.itemHeight} />
                ))}
              </Grid>
            </Flex>
          </Card>
        ))}

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
