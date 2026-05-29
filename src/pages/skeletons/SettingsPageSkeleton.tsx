import { Box, Card, Flex, Skeleton } from '@radix-ui/themes';
import { PageLayoutSkeleton } from '@/components/UI/PageLayout';

const SECTIONS = [
  { rows: 3 },
  { rows: 2 },
  { rows: 3 },
];

export function SettingsPageSkeleton() {
  return (
    <PageLayoutSkeleton titleKey="settingsTab" descriptionKey="settingsPageDescription">
      <Box data-testid="page-settings-skeleton">
        <Flex direction="column" gap="4">
          {SECTIONS.map((section, i) => (
            <Card key={i}>
              <Box p="4">
                <Flex align="center" gap="2" mb="4">
                  <Skeleton width="20px" height="20px" />
                  <Skeleton width="160px" height="20px" />
                </Flex>
                <Flex direction="column" gap="4">
                  {Array.from({ length: section.rows }).map((_, j) => (
                    <Flex key={j} align="center" justify="between">
                      <Skeleton width="200px" height="18px" />
                      <Skeleton width="44px" height="24px" />
                    </Flex>
                  ))}
                </Flex>
              </Box>
            </Card>
          ))}
        </Flex>
      </Box>
    </PageLayoutSkeleton>
  );
}
