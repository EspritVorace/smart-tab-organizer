import { Box, Flex, Text, Switch, Card } from '@radix-ui/themes';
import { Settings, Bell } from 'lucide-react';
import { PageLayout } from '../PageLayout/PageLayout';
import { getMessage } from '../../../utils/i18n';
import type { SyncSettings } from '../../../types/syncSettings';

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
          <Card>
            <Box p="4">
              <Flex align="center" gap="2" mb="4">
                <Bell size={20} style={{ color: 'var(--accent-9)' }} />
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
        </Box>
      )}
    </PageLayout>
  );
}
