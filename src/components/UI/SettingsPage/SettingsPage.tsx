import { Box, Flex, Text, Switch, Card, RadioGroup } from '@radix-ui/themes';
import { Bell, Copy, RotateCcw } from 'lucide-react';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { getMessage } from '@/utils/i18n';
import { markDiscovered } from '@/exploration/progressStore';
import type { AppSettings } from '@/types/syncSettings';
import {
  deduplicationKeepStrategyOptions,
  defaultRestoreActionOptions,
  type DeduplicationKeepStrategyValue,
  type DefaultRestoreActionValue,
} from '@/schemas/enums';

/** Maps a deduplication keep-strategy value to its exploration capability id. */
const KEEP_STRATEGY_CAPABILITY: Record<DeduplicationKeepStrategyValue, string> = {
  'keep-old': 'dedup.keep.old',
  'keep-new': 'dedup.keep.new',
  'keep-grouped': 'dedup.keep.grouped',
  'keep-grouped-or-new': 'dedup.keep.groupedOrNew',
};

interface SettingsPageProps {
  syncSettings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export function SettingsPage({ syncSettings, updateSettings }: SettingsPageProps) {
  return (
    <PageLayout
      titleKey="settingsTab"
      descriptionKey="settingsPageDescription"
      syncSettings={syncSettings}
    >
      {() => (
        <Box data-testid="page-settings">
          <Flex direction="column" gap="4">
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
                      aria-label={getMessage('notifyOnGrouping')}
                      checked={syncSettings.notifyOnGrouping}
                      onCheckedChange={(checked) => { void markDiscovered('settings.notif.grouping'); updateSettings({ notifyOnGrouping: checked }); }}
                    />
                  </Flex>

                  <Flex justify="between" align="center">
                    <Text size="2">{getMessage('notifyOnDeduplication')}</Text>
                    <Switch
                      data-testid="page-settings-toggle-notify-dedup"
                      aria-label={getMessage('notifyOnDeduplication')}
                      checked={syncSettings.notifyOnDeduplication}
                      onCheckedChange={(checked) => { void markDiscovered('settings.notif.dedup'); updateSettings({ notifyOnDeduplication: checked }); }}
                    />
                  </Flex>

                  <Flex justify="between" align="center">
                    <Text size="2">{getMessage('notifyOnOrganize')}</Text>
                    <Switch
                      data-testid="page-settings-toggle-notify-organize"
                      aria-label={getMessage('notifyOnOrganize')}
                      checked={syncSettings.notifyOnOrganize}
                      onCheckedChange={(checked) => { void markDiscovered('settings.notif.organize'); updateSettings({ notifyOnOrganize: checked }); }}
                    />
                  </Flex>
                </Flex>
              </Box>
            </Card>

            <Card>
              <Box p="4">
                <Flex align="center" gap="2" mb="4">
                  <RotateCcw size={20} style={{ color: 'var(--accent-9)' }} />
                  <Text size="3" weight="bold">{getMessage('sessionRestore')}</Text>
                </Flex>

                <Flex direction="column" gap="2">
                  <Text size="2" id="page-settings-default-restore-action-label">
                    {getMessage('defaultRestoreActionLabel')}
                  </Text>
                  <RadioGroup.Root
                    id="page-settings-default-restore-action"
                    data-testid="page-settings-default-restore-action"
                    aria-labelledby="page-settings-default-restore-action-label"
                    value={syncSettings.defaultRestoreAction}
                    onValueChange={(value) => {
                      void markDiscovered('sessions.defaultRestore');
                      updateSettings({ defaultRestoreAction: value as DefaultRestoreActionValue });
                    }}
                  >
                    <Flex direction="column" gap="2">
                      {defaultRestoreActionOptions.map((option) => (
                        <Text as="label" size="2" key={option.value}>
                          <Flex gap="2" align="center">
                            <RadioGroup.Item
                              value={option.value}
                              data-testid={`page-settings-default-restore-action-${option.value}`}
                            />
                            {getMessage(option.keyLabel)}
                          </Flex>
                        </Text>
                      ))}
                    </Flex>
                  </RadioGroup.Root>
                  <Text size="1" color="gray">
                    {getMessage('defaultRestoreActionDescription')}
                  </Text>
                </Flex>
              </Box>
            </Card>

            <Card>
              <Box p="4">
                <Flex align="center" gap="2" mb="4">
                  <Copy size={20} style={{ color: 'var(--accent-9)' }} />
                  <Text size="3" weight="bold">{getMessage('deduplicationScopeSection')}</Text>
                </Flex>

                <Flex direction="column" gap="4">
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="center" gap="4">
                      <Text size="2">{getMessage('deduplicateUnmatchedDomainsLabel')}</Text>
                      <Switch
                        data-testid="page-settings-toggle-dedup-unmatched"
                        aria-label={getMessage('deduplicateUnmatchedDomainsLabel')}
                        checked={syncSettings.deduplicateUnmatchedDomains}
                        onCheckedChange={(checked) => { void markDiscovered('dedup.uncoveredScope'); updateSettings({ deduplicateUnmatchedDomains: checked }); }}
                      />
                    </Flex>
                    <Text size="1" color="gray">
                      {getMessage('deduplicateUnmatchedDomainsDescription')}
                    </Text>
                  </Flex>

                  <Flex direction="column" gap="2">
                    <Text size="2" id="page-settings-dedup-keep-strategy-label">
                      {getMessage('deduplicationKeepStrategyLabel')}
                    </Text>
                    <RadioGroup.Root
                      id="page-settings-dedup-keep-strategy"
                      data-testid="page-settings-dedup-keep-strategy"
                      aria-labelledby="page-settings-dedup-keep-strategy-label"
                      value={syncSettings.deduplicationKeepStrategy}
                      onValueChange={(value) => {
                        void markDiscovered(KEEP_STRATEGY_CAPABILITY[value as DeduplicationKeepStrategyValue]);
                        updateSettings({ deduplicationKeepStrategy: value as DeduplicationKeepStrategyValue });
                      }}
                      disabled={!syncSettings.globalDeduplicationEnabled}
                    >
                      <Flex direction="column" gap="2">
                        {deduplicationKeepStrategyOptions.map((option) => (
                          <Text as="label" size="2" key={option.value}>
                            <Flex gap="2" align="center">
                              <RadioGroup.Item
                                value={option.value}
                                data-testid={`page-settings-dedup-keep-${option.value}`}
                              />
                              {getMessage(option.keyLabel)}
                            </Flex>
                          </Text>
                        ))}
                      </Flex>
                    </RadioGroup.Root>
                    <Text size="1" color="gray">
                      {getMessage('deduplicationKeepStrategyDescription')}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            </Card>
          </Flex>
        </Box>
      )}
    </PageLayout>
  );
}
