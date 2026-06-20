import { Card, Flex, Skeleton } from '@radix-ui/themes';
import { PageListSkeleton } from './PageListSkeleton';

export function DomainRulesPageSkeleton() {
  return (
    <PageListSkeleton
      titleKey="domainRulesTab"
      descriptionKey="domainRulesPageDescription"
      testId="page-rules-skeleton"
      hasFilter
      hasMenu
      rowCount={3}
      rowGap="3"
      renderRow={(i) => (
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
      )}
    />
  );
}
