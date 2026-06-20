import type { ReactNode } from 'react';
import { Box, Flex } from '@radix-ui/themes';
import { PageLayoutSkeleton } from '@/components/UI/PageLayout';
import { ListToolbarSkeleton } from '@/components/UI/ListToolbar';

interface PageListSkeletonProps {
  titleKey: string;
  descriptionKey: string;
  testId: string;
  /** Pass `true` to render a filter placeholder in the toolbar. */
  hasFilter?: boolean;
  /** Pass `true` to render an overflow-menu placeholder in the toolbar. */
  hasMenu?: boolean;
  /** Number of skeleton card rows to render. */
  rowCount: number;
  /** Gap between rows (Radix spacing token). Defaults to "3". */
  rowGap?: '2' | '3' | '4';
  /**
   * Render the interior of each skeleton row Card.
   * Receives the row index so dimensions can vary per row if needed.
   */
  renderRow: (index: number) => ReactNode;
}

/**
 * Generic skeleton shell for list pages: PageLayoutSkeleton wrapper + toolbar
 * placeholder + N card rows whose content is provided via a render prop.
 */
export function PageListSkeleton({
  titleKey,
  descriptionKey,
  testId,
  hasFilter,
  hasMenu,
  rowCount,
  rowGap = '3',
  renderRow,
}: PageListSkeletonProps) {
  return (
    <PageLayoutSkeleton titleKey={titleKey} descriptionKey={descriptionKey}>
      <Box data-testid={testId}>
        <ListToolbarSkeleton hasFilter={hasFilter} hasMenu={hasMenu} />
        <Flex direction="column" gap={rowGap}>
          {Array.from({ length: rowCount }, (_, i) => renderRow(i))}
        </Flex>
      </Box>
    </PageLayoutSkeleton>
  );
}
