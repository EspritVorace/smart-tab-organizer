import React from 'react';
import { Badge, Box, Checkbox, Flex, Text } from '@radix-ui/themes';
import { Eye, EyeOff, Globe } from 'lucide-react';
import { getRadixColor } from '@/utils/utils';
import { getMessage } from '@/utils/i18n';
import type { RuleViewGroup } from '@/utils/ruleViewUtils';

function deriveCheckedState(selectedCount: number, total: number): boolean | 'indeterminate' {
  if (selectedCount === 0) return false;
  if (selectedCount >= total) return true;
  return 'indeterminate';
}

export interface RuleGroupHeaderProps {
  group: RuleViewGroup;
  /** Number of this group's rules currently selected (drives the checkbox tri-state). */
  selectedCount: number;
  onSelectGroup: (ruleIds: string[], checked: boolean) => void;
  testId?: string;
}

export function RuleGroupHeader({
  group,
  selectedCount,
  onSelectGroup,
  testId,
}: RuleGroupHeaderProps) {
  const total = group.ruleIds.length;
  const checkedState = deriveCheckedState(selectedCount, total);

  const ariaLabel = getMessage('ruleViewSelectGroupAriaLabel').replace('{group}', group.label);

  return (
    <Flex align="center" gap="2" mt="3" mb="1" data-testid={testId}>
      <Checkbox
        checked={checkedState}
        onCheckedChange={checked => onSelectGroup(group.ruleIds, checked === true)}
        aria-label={ariaLabel}
      />

      {group.kind === 'category' && group.emoji && (
        <span aria-hidden="true">{group.emoji}</span>
      )}
      {group.kind === 'color' && group.color && (
        <Box
          aria-hidden="true"
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            flexShrink: 0,
            backgroundColor: `var(--${getRadixColor(group.color)}-9)`,
          }}
        />
      )}
      {group.kind === 'status' &&
        (group.status === 'enabled' ? (
          <Eye size={14} aria-hidden="true" />
        ) : (
          <EyeOff size={14} aria-hidden="true" />
        ))}
      {group.kind === 'domain' && <Globe size={14} aria-hidden="true" />}

      <Text size="2" weight="medium" style={{ minWidth: 0 }} truncate>
        {group.label}
      </Text>
      <Badge size="1" color="gray" radius="full">
        {total}
      </Badge>
    </Flex>
  );
}
