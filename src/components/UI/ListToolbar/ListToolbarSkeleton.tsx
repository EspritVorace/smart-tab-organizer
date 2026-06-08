import { Box, Flex, Skeleton } from '@radix-ui/themes';

interface ListToolbarSkeletonProps {
  /** Render a placeholder for the view (filter/sort/group) trigger left of the action. */
  hasFilter?: boolean;
  /** Render a placeholder for the overflow ("...") menu right of the action. */
  hasMenu?: boolean;
}

export function ListToolbarSkeleton({ hasFilter = false, hasMenu = false }: ListToolbarSkeletonProps = {}) {
  return (
    <Flex data-testid="list-toolbar-skeleton" gap="3" mb="4" align="center">
      <Box style={{ flex: 1 }}>
        <Skeleton height="32px" />
      </Box>
      {hasFilter && <Skeleton width="32px" height="32px" />}
      <Skeleton width="120px" height="32px" />
      {hasMenu && <Skeleton width="32px" height="32px" />}
    </Flex>
  );
}
