import { Box, Flex, Text, Button, Card } from '@radix-ui/themes';
import { BarChart3, RotateCcw, Layers, Copy } from 'lucide-react';
import { PageLayout } from '../components/UI/PageLayout/PageLayout';
import { getMessage } from '../utils/i18n';
import type { SyncSettings } from '../types/syncSettings';
import type { Statistics } from '../types/statistics';

interface StatisticsPageProps {
  syncSettings: SyncSettings;
  stats: Statistics;
  onReset: () => void;
}

export function StatisticsPage({ syncSettings, stats, onReset }: StatisticsPageProps) {
  return (
    <PageLayout
      titleKey="statisticsTab"
      theme="STATISTICS"
      icon={BarChart3}
      syncSettings={syncSettings}
    >
      {() => (
        <Box>
          <Flex gap="4" wrap="wrap">
            <Card style={{ flex: '1', minWidth: '200px' }}>
              <Flex direction="column" gap="2" p="4">
                <Flex align="center" gap="2">
                  <Layers size={20} style={{ color: 'var(--accent-9)' }} />
                  <Text size="2" color="gray">{getMessage('groupsCreated')}</Text>
                </Flex>
                <Text size="8" weight="bold" style={{ color: 'var(--accent-11)' }}>
                  {stats?.tabGroupsCreatedCount || 0}
                </Text>
              </Flex>
            </Card>

            <Card style={{ flex: '1', minWidth: '200px' }}>
              <Flex direction="column" gap="2" p="4">
                <Flex align="center" gap="2">
                  <Copy size={20} style={{ color: 'var(--accent-9)' }} />
                  <Text size="2" color="gray">{getMessage('tabsDeduplicated')}</Text>
                </Flex>
                <Text size="8" weight="bold" style={{ color: 'var(--accent-11)' }}>
                  {stats?.tabsDeduplicatedCount || 0}
                </Text>
              </Flex>
            </Card>
          </Flex>

          <Box mt="6">
            <Button variant="soft" color="red" onClick={onReset}>
              <RotateCcw size={16} />
              {getMessage('resetStats')}
            </Button>
          </Box>
        </Box>
      )}
    </PageLayout>
  );
}
