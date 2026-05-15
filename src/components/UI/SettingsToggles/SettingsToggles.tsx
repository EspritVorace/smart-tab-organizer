import React from 'react';
import { Button, Card, Flex, Skeleton, Switch, Text } from '@radix-ui/themes';
import { Copy, Layers, Plus, Shield, Upload } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

interface SettingsTogglesProps {
  globalGroupingEnabled?: boolean;
  globalDeduplicationEnabled?: boolean;
  onGroupingChange?: (checked: boolean) => void;
  onDeduplicationChange?: (checked: boolean) => void;
  isLoading?: boolean;
  hasRules?: boolean;
  onCreateRule?: () => void;
  onImportRules?: () => void;
}

export function SettingsToggles({
  globalGroupingEnabled,
  globalDeduplicationEnabled,
  onGroupingChange,
  onDeduplicationChange,
  isLoading = false,
  hasRules = true,
  onCreateRule,
  onImportRules,
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
          <Shield size={28} style={{ color: 'var(--gray-8)' }} />
          <Text size="2" color="gray" align="center">
            {getMessage('popupNoRulesTitle')}
          </Text>
          <Flex gap="2">
            <Button variant="soft" size="2" onClick={onCreateRule}>
              <Plus size={14} />
              {getMessage('popupCreateRule')}
            </Button>
            <Button variant="soft" size="2" onClick={onImportRules}>
              <Upload size={14} />
              {getMessage('popupImportRules')}
            </Button>
          </Flex>
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
          <Layers size={14} style={{ color: 'var(--gray-11)' }} />
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
          <Copy size={14} style={{ color: 'var(--gray-11)' }} />
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
