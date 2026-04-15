import React from 'react';
import { Badge, Checkbox, Flex, Text } from '@radix-ui/themes';
import type { BadgeProps } from '@radix-ui/themes';
import { getMessage } from '../../../utils/i18n';
import { getRuleCategory } from '../../../schemas/enums';
import { getRadixColor } from '../../../utils/utils';
import type { DomainRuleSetting } from '../../../types/syncSettings';
import type { ConflictingRule } from '../../../utils/importClassification';
import {
  ConflictRowShell,
  DiffPopover,
  DiffPropertyValues,
  SelectableRowShell,
} from './Shared';

type RadixAccentColor = NonNullable<BadgeProps['color']>;

/* ─── RuleRow ───────────────────────────────────────────────────────────── */

export interface RuleRowProps {
  rule: DomainRuleSetting;
  checkbox?: boolean;
  checked?: boolean;
  onToggle?: () => void;
  dimmed?: boolean;
  statusBadge?: string;
}

export function RuleRow({ rule, checkbox, checked, onToggle, dimmed, statusBadge }: RuleRowProps) {
  const category = getRuleCategory(rule.categoryId);
  return (
    <SelectableRowShell dimmed={dimmed}>
      {checkbox && (
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          aria-label={rule.label}
        />
      )}
      <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Text size="2" weight="medium">{rule.label}</Text>
        <Text size="1" color="gray">{rule.domainFilter}</Text>
      </Flex>
      {category && (
        <Badge color={getRadixColor(category.color) as RadixAccentColor} variant="soft" size="1">
          {category.emoji} {getMessage(category.labelKey)}
        </Badge>
      )}
      {statusBadge && (
        <Badge color="gray" variant="outline" size="1">{statusBadge}</Badge>
      )}
    </SelectableRowShell>
  );
}

/* ─── ConflictRuleRow ───────────────────────────────────────────────────── */

export interface ConflictRuleRowProps {
  conflict: ConflictingRule;
}

export function ConflictRuleRow({ conflict }: ConflictRuleRowProps) {
  return (
    <ConflictRowShell>
      <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Text size="2" weight="medium">{conflict.imported.label}</Text>
        <Text size="1" color="gray">{conflict.imported.domainFilter}</Text>
      </Flex>
      <Badge color={conflict.imported.color as RadixAccentColor} variant="soft" size="1">
        {getMessage(`color_${conflict.imported.color}`)}
      </Badge>
      <DiffPopover entityLabel={conflict.imported.label}>
        <Flex direction="column" gap="3">
          {conflict.differences.map((diff) => (
            <DiffPropertyValues
              key={diff.property}
              label={getMessage(diff.property) || diff.property}
              current={String(diff.currentValue)}
              imported={String(diff.importedValue)}
            />
          ))}
        </Flex>
      </DiffPopover>
    </ConflictRowShell>
  );
}
