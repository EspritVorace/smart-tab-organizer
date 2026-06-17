import { useRef, type KeyboardEvent } from 'react';
import { Box, Flex, Text, Switch, Card, RadioGroup } from '@radix-ui/themes';
import { Bell, Copy, RotateCcw } from 'lucide-react';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { useListNavigation } from '@/hooks/useListNavigation';
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

/** CSS selector for the controls that take part in Up/Down navigation. */
const NAV_SELECTOR = '[data-settings-nav]';

export function SettingsPage({ syncSettings, updateSettings }: SettingsPageProps) {
  const listRef = useRef<HTMLDivElement>(null);
  // Up/Down moves focus between settings; the first item (first Switch) is
  // focused on arrival via `autoFocus`. Radio groups keep Radix's native arrow
  // handling and only delegate to this helper at their boundaries (see below).
  const { handleNavigationKey } = useListNavigation(listRef, NAV_SELECTOR, {
    autoFocus: { ready: true },
  });

  /** Position of `el` among the navigable controls, in DOM order. */
  const navIndex = (el: HTMLElement): number =>
    listRef.current
      ? [...listRef.current.querySelectorAll<HTMLElement>(NAV_SELECTOR)].indexOf(el)
      : -1;

  /** Up/Down handler for a Switch: move to the previous/next setting. */
  const handleSwitchKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    handleNavigationKey(e, navIndex(e.currentTarget));
  };

  /**
   * Up/Down handler for a radio option. Inside the group Radix keeps its native
   * behavior (moves focus and selects). Only at the group's boundaries do we
   * jump out to the neighbouring setting so the Up/Down journey stays
   * continuous across the whole page.
   */
  const handleRadioKeyDown = (
    e: KeyboardEvent<HTMLElement>,
    index: number,
    optionsCount: number,
  ) => {
    const atFirst = index === 0;
    const atLast = index === optionsCount - 1;
    if ((e.key === 'ArrowDown' && atLast) || (e.key === 'ArrowUp' && atFirst)) {
      handleNavigationKey(e, navIndex(e.currentTarget));
    }
    // Otherwise: let Radix handle the arrow natively (move + select).
  };

  return (
    <PageLayout
      titleKey="settingsTab"
      descriptionKey="settingsPageDescription"
      syncSettings={syncSettings}
    >
      {() => (
        <Box data-testid="page-settings">
          <Flex direction="column" gap="4" ref={listRef}>
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
                      data-settings-nav=""
                      aria-label={getMessage('notifyOnGrouping')}
                      checked={syncSettings.notifyOnGrouping}
                      onCheckedChange={(checked) => { void markDiscovered('settings.notif.grouping'); updateSettings({ notifyOnGrouping: checked }); }}
                      onKeyDown={handleSwitchKeyDown}
                    />
                  </Flex>

                  <Flex justify="between" align="center">
                    <Text size="2">{getMessage('notifyOnDeduplication')}</Text>
                    <Switch
                      data-testid="page-settings-toggle-notify-dedup"
                      data-settings-nav=""
                      aria-label={getMessage('notifyOnDeduplication')}
                      checked={syncSettings.notifyOnDeduplication}
                      onCheckedChange={(checked) => { void markDiscovered('settings.notif.dedup'); updateSettings({ notifyOnDeduplication: checked }); }}
                      onKeyDown={handleSwitchKeyDown}
                    />
                  </Flex>

                  <Flex justify="between" align="center">
                    <Text size="2">{getMessage('notifyOnOrganize')}</Text>
                    <Switch
                      data-testid="page-settings-toggle-notify-organize"
                      data-settings-nav=""
                      aria-label={getMessage('notifyOnOrganize')}
                      checked={syncSettings.notifyOnOrganize}
                      onCheckedChange={(checked) => { void markDiscovered('settings.notif.organize'); updateSettings({ notifyOnOrganize: checked }); }}
                      onKeyDown={handleSwitchKeyDown}
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
                    loop={false}
                    value={syncSettings.defaultRestoreAction}
                    onValueChange={(value) => {
                      void markDiscovered('sessions.defaultRestore');
                      updateSettings({ defaultRestoreAction: value as DefaultRestoreActionValue });
                    }}
                  >
                    <Flex direction="column" gap="2">
                      {defaultRestoreActionOptions.map((option, index) => (
                        <Text as="label" size="2" key={option.value}>
                          <Flex gap="2" align="center">
                            <RadioGroup.Item
                              value={option.value}
                              data-settings-nav=""
                              data-testid={`page-settings-default-restore-action-${option.value}`}
                              onKeyDown={(e) => handleRadioKeyDown(e, index, defaultRestoreActionOptions.length)}
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
                        data-settings-nav=""
                        aria-label={getMessage('deduplicateUnmatchedDomainsLabel')}
                        checked={syncSettings.deduplicateUnmatchedDomains}
                        onCheckedChange={(checked) => { void markDiscovered('dedup.uncoveredScope'); updateSettings({ deduplicateUnmatchedDomains: checked }); }}
                        onKeyDown={handleSwitchKeyDown}
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
                      loop={false}
                      value={syncSettings.deduplicationKeepStrategy}
                      onValueChange={(value) => {
                        void markDiscovered(KEEP_STRATEGY_CAPABILITY[value as DeduplicationKeepStrategyValue]);
                        updateSettings({ deduplicationKeepStrategy: value as DeduplicationKeepStrategyValue });
                      }}
                      disabled={!syncSettings.globalDeduplicationEnabled}
                    >
                      <Flex direction="column" gap="2">
                        {deduplicationKeepStrategyOptions.map((option, index) => (
                          <Text as="label" size="2" key={option.value}>
                            <Flex gap="2" align="center">
                              <RadioGroup.Item
                                value={option.value}
                                // Disabled radios are not focusable, so they stay out of the
                                // Up/Down flat list: only tag them when the group is active.
                                {...(syncSettings.globalDeduplicationEnabled ? { 'data-settings-nav': '' } : {})}
                                data-testid={`page-settings-dedup-keep-${option.value}`}
                                onKeyDown={(e) => handleRadioKeyDown(e, index, deduplicationKeepStrategyOptions.length)}
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
