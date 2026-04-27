import React from 'react';
import { Button, Card, Flex, Skeleton, Switch, Text } from '@radix-ui/themes';
import { Copy, ExternalLink, Layers, Shield } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

interface SettingsTogglesProps {
  globalGroupingEnabled?: boolean;
  globalDeduplicationEnabled?: boolean;
  onGroupingChange?: (checked: boolean) => void;
  onDeduplicationChange?: (checked: boolean) => void;
  isLoading?: boolean;
  hasRules?: boolean;
  onOpenRules?: () => void;
}

export function SettingsToggles({
  globalGroupingEnabled,
  globalDeduplicationEnabled,
  onGroupingChange,
  onDeduplicationChange,
  isLoading = false,
  hasRules = true,
  onOpenRules,
}: SettingsTogglesProps) {
  if (isLoading) {
    return (
      <Flex gap="4" px="1" py="1" justify="between" align="center">
        <Skeleton width="120px" height="20px" />
        <Skeleton width="120px" height="20px" />
      </Flex>
    );
  }

  if (!hasRules) {
    return (
      <Card role="group" aria-label={getMessage('settingsTab')}>
        <Flex direction="column" align="center" gap="3" py="2">
          <Shield size={28} style={{ color: 'var(--gray-8)' }} aria-hidden="true" />
          <Text size="2" color="gray" align="center">
            {getMessage('popupNoRulesTitle')}
          </Text>
          <Button variant="soft" size="2" onClick={onOpenRules}>
            <ExternalLink size={14} aria-hidden="true" />
            {getMessage('popupGoToRules')}
          </Button>
        </Flex>
      </Card>
    );
  }

  return (
    <Flex
      data-testid="settings-toggles"
      role="group"
      aria-label={getMessage('settingsTab')}
      gap="4"
      px="1"
      py="1"
      justify="between"
      align="center"
    >
      <Text as="label" size="1">
        <Flex gap="2" align="center">
          <Layers size={14} aria-hidden="true" style={{ color: 'var(--gray-11)' }} />
          <Text as="span" title={getMessage('enableGrouping')}>
            {getMessage('popupAutoGroup')}
          </Text>
          <Switch
            size="1"
            data-testid="settings-toggle-grouping"
            checked={globalGroupingEnabled || false}
            onCheckedChange={onGroupingChange}
          />
        </Flex>
      </Text>
      <Text as="label" size="1">
        <Flex gap="2" align="center">
          <Copy size={14} aria-hidden="true" style={{ color: 'var(--gray-11)' }} />
          <Text as="span" title={getMessage('enableDeduplication')}>
            {getMessage('popupDedup')}
          </Text>
          <Switch
            size="1"
            data-testid="settings-toggle-dedup"
            checked={globalDeduplicationEnabled || false}
            onCheckedChange={onDeduplicationChange}
          />
        </Flex>
      </Text>
    </Flex>
  );
}
