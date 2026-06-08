import { Box, Card, Flex, Separator, Skeleton } from '@radix-ui/themes';
import { PageLayoutSkeleton } from '@/components/UI/PageLayout';
import { ListToolbarSkeleton } from '@/components/UI/ListToolbar';

const PINNED = [0, 1];
const UNPINNED = [0, 1, 2];

function SessionCardSkeleton() {
  return (
    <Card size="2">
      <Flex direction="column" gap="2">
        <Flex align="center" gap="2">
          <Skeleton width="16px" height="20px" />
          <Skeleton width="28px" height="28px" />
          <Flex align="center" gap="2" style={{ flex: 1 }}>
            <Skeleton width="180px" height="22px" />
            <Skeleton width="32px" height="20px" />
          </Flex>
          <Skeleton width="96px" height="32px" />
          <Skeleton width="32px" height="32px" />
        </Flex>
        <Box style={{ borderTop: '1px solid var(--gray-a4)' }} />
        <Flex align="center" gap="2">
          <Skeleton width="14px" height="14px" />
          <Skeleton width="120px" height="14px" />
          <Box style={{ flex: 1 }} />
          <Skeleton width="80px" height="14px" />
        </Flex>
      </Flex>
    </Card>
  );
}

function SectionHeaderSkeleton({ withViewMenu = false }: { withViewMenu?: boolean }) {
  return (
    <Flex align="center" gap="2">
      <Skeleton width="16px" height="16px" />
      <Skeleton width="120px" height="20px" />
      <Skeleton width="24px" height="20px" />
      {withViewMenu && (
        <Box style={{ marginLeft: 'auto' }}>
          <Skeleton width="32px" height="32px" />
        </Box>
      )}
    </Flex>
  );
}

/** Mirrors the Active / Archived TabNav rendered above the toolbar. */
function SubTabsSkeleton() {
  return (
    <Box mb="3">
      <Flex
        gap="4"
        align="center"
        style={{ borderBottom: '1px solid var(--gray-a5)', paddingBottom: '8px' }}
      >
        <Skeleton width="64px" height="20px" />
        <Skeleton width="80px" height="20px" />
      </Flex>
    </Box>
  );
}

export function SessionsPageSkeleton() {
  return (
    <PageLayoutSkeleton titleKey="sessionsTab" descriptionKey="sessionsPageDescription">
      <Box data-testid="page-sessions-skeleton">
        <SubTabsSkeleton />
        <ListToolbarSkeleton hasMenu />
        <Flex direction="column" gap="3">
          <Box>
            <SectionHeaderSkeleton />
            <Flex direction="column" gap="3" pl="6" mt="3">
              {PINNED.map((i) => (
                <SessionCardSkeleton key={`pinned-${i}`} />
              ))}
            </Flex>
          </Box>
          <Separator size="4" />
          <Box>
            <SectionHeaderSkeleton withViewMenu />
            <Flex direction="column" gap="3" pl="6" mt="3">
              {UNPINNED.map((i) => (
                <SessionCardSkeleton key={`unpinned-${i}`} />
              ))}
            </Flex>
          </Box>
        </Flex>
      </Box>
    </PageLayoutSkeleton>
  );
}
