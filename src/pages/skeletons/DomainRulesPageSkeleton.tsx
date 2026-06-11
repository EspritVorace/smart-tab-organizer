import { Box, Card, Flex, Skeleton } from '@radix-ui/themes';
import { PageLayoutSkeleton } from '@/components/UI/PageLayout';
import { ListToolbarSkeleton } from '@/components/UI/ListToolbar';

const ROWS = [0, 1, 2];

export function DomainRulesPageSkeleton() {
  return (
    <PageLayoutSkeleton titleKey="domainRulesTab" descriptionKey="domainRulesPageDescription">
      <Box data-testid="page-rules-skeleton">
        <ListToolbarSkeleton hasFilter hasMenu />
        <Flex direction="column" gap="3">
          {ROWS.map((i) => (
            <Card key={i} variant="surface" size="2">
              <Flex align="center" justify="between" gap="4">
                <Skeleton width="16px" height="20px" />
                <Skeleton width="20px" height="20px" />
                <Flex direction="column" gap="2" style={{ flex: 1 }}>
                  <Skeleton width="140px" height="22px" />
                  <Skeleton width="200px" height="16px" />
                </Flex>
                <Skeleton width="40px" height="22px" />
                <Skeleton width="28px" height="28px" />
              </Flex>
            </Card>
          ))}
        </Flex>
      </Box>
    </PageLayoutSkeleton>
  );
}
