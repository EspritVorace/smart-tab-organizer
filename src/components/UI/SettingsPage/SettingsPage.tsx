import { Box, Flex, Text, Switch, Card } from '@radix-ui/themes';
import { Settings, Bell, Copy } from 'lucide-react';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { getMessage } from '@/utils/i18n';
import type { SyncSettings } from '@/types/syncSettings';

interface SettingsPageProps {
  syncSettings: SyncSettings;
  updateSettings: (settings: Partial<SyncSettings>) => void;
}

export function SettingsPage({ syncSettings, updateSettings }: SettingsPageProps) {
  return (
    <PageLayout
      titleKey="settingsTab"
      theme="SETTINGS"
      icon={Settings}
      syncSettings={syncSettings}
    >
      {() => (
        <Box data-testid="page-settings">
          <Flex direction="column" gap="4">
            <Card>
              <Box p="4">
                <Flex align="center" gap="2" mb="4">
                  <Bell size={20} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />
                  <Text size="3" weight="bold">{getMessage('notificationsSection')}</Text>
                </Flex>

                <Flex direction="column" gap="4">
                  <Flex justify="between" align="center">
                    <Text size="2">{getMessage('notifyOnGrouping')}</Text>
                    <Switch
                      data-testid="page-settings-toggle-notify-group"
                      checked={syncSettings.notifyOnGrouping}
                      onCheckedChange={(checked) => updateSettings({ notifyOnGrouping: checked })}
                    />
                  </Flex>

                  <Flex justify="between" align="center">
                    <Text size="2">{getMessage('notifyOnDeduplication')}</Text>
                    <Switch
                      data-testid="page-settings-toggle-notify-dedup"
                      checked={syncSettings.notifyOnDeduplication}
                      onCheckedChange={(checked) => updateSettings({ notifyOnDeduplication: checked })}
                    />
                  </Flex>
                </Flex>
              </Box>
            </Card>

            <Card>
              <Box p="4">
                <Flex align="center" gap="2" mb="4">
                  <Copy size={20} style={{ color: 'var(--accent-9)' }} aria-hidden="true" />
                  <Text size="3" weight="bold">{getMessage('deduplicationScopeSection')}</Text>
                </Flex>

                <Flex direction="column" gap="2">
                  <Flex justify="between" align="center" gap="4">
                    <Text size="2">{getMessage('deduplicateUnmatchedDomainsLabel')}</Text>
                    <Switch
                      data-testid="page-settings-toggle-dedup-unmatched"
                      checked={syncSettings.deduplicateUnmatchedDomains}
                      onCheckedChange={(checked) => updateSettings({ deduplicateUnmatchedDomains: checked })}
                    />
                  </Flex>
                  <Text size="1" color="gray">
                    {getMessage('deduplicateUnmatchedDomainsDescription')}
                  </Text>
                </Flex>
              </Box>
            </Card>
          </Flex>
        </Box>
      )}
    </PageLayout>
  );
}
