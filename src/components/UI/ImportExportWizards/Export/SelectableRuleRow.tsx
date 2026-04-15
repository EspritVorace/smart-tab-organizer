import React from 'react';
import { Badge, Checkbox, Flex, Text } from '@radix-ui/themes';
import type { BadgeProps } from '@radix-ui/themes';
import { getMessage } from '../../../../utils/i18n';
import { getRuleCategory } from '../../../../schemas/enums';
import { getRadixColor } from '../../../../utils/utils';
import type { DomainRuleSetting } from '../../../../types/syncSettings';

type RadixAccentColor = NonNullable<BadgeProps['color']>;

interface SelectableRuleRowProps {
  rule: DomainRuleSetting;
  checked: boolean;
  onToggle: () => void;
}

export function SelectableRuleRow({ rule, checked, onToggle }: SelectableRuleRowProps) {
  const category = getRuleCategory(rule.categoryId);
  return (
    <Flex
      align="center"
      gap="3"
      p="2"
      style={{
        borderRadius: 'var(--radius-2)',
        backgroundColor: 'var(--gray-a2)',
      }}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        aria-label={rule.label}
      />
      <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Text size="2" weight="medium">{rule.label}</Text>
        <Text size="1" color="gray">{rule.domainFilter}</Text>
      </Flex>
      {category && (
        <Badge color={getRadixColor(category.color) as RadixAccentColor} variant="soft" size="1">
          {category.emoji} {getMessage(category.labelKey)}
        </Badge>
      )}
      {!rule.enabled && (
        <Badge color="gray" variant="outline" size="1">
          {getMessage('disabled')}
        </Badge>
      )}
    </Flex>
  );
}
