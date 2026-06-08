import { Box, Card, Flex, Skeleton } from '@radix-ui/themes';
import { PageLayoutSkeleton } from '@/components/UI/PageLayout';
import { ListToolbarSkeleton } from '@/components/UI/ListToolbar';

const ROWS = [0, 1];

export function WorkspacesPageSkeleton() {
  return (
    <PageLayoutSkeleton titleKey="workspacesTab" descriptionKey="workspacesDescription">
      <Box data-testid="page-workspaces-skeleton">
        <ListToolbarSkeleton hasMenu />
        <Flex direction="column" gap="2">
          {ROWS.map((i) => (
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
          ))}
        </Flex>
      </Box>
    </PageLayoutSkeleton>
  );
}
