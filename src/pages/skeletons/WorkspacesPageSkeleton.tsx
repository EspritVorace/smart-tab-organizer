import { Card, Flex, Skeleton } from '@radix-ui/themes';
import { PageListSkeleton } from './PageListSkeleton';

export function WorkspacesPageSkeleton() {
  return (
    <PageListSkeleton
      titleKey="workspacesTab"
      descriptionKey="workspacesDescription"
      testId="page-workspaces-skeleton"
      hasMenu
      rowCount={2}
      rowGap="2"
      renderRow={(i) => (
        <Card key={i} variant="surface">
          <Flex align="center" gap="3">
            <Skeleton width="40px" height="40px" />
            <Flex direction="column" gap="2" style={{ flex: 1 }}>
              <Skeleton width="200px" height="22px" />
              <Skeleton width="140px" height="14px" />
            </Flex>
            <Skeleton width="72px" height="32px" />
            <Skeleton width="32px" height="32px" />
            <Skeleton width="32px" height="32px" />
          </Flex>
        </Card>
      )}
    />
  );
}
