import { Box, Flex, Skeleton } from '@radix-ui/themes';

export function ListToolbarSkeleton() {
  return (
    <Flex data-testid="list-toolbar-skeleton" gap="3" mb="4" align="center">
      <Box style={{ flex: 1 }}>
        <Skeleton height="32px" />
      </Box>
      <Skeleton width="120px" height="32px" />
    </Flex>
  );
}
