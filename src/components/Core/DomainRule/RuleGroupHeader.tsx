import React from 'react';
import { Badge, Box, Checkbox, Flex, Text } from '@radix-ui/themes';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown, ChevronRight, Eye, EyeOff, Globe } from 'lucide-react';
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
  /** Whether the group is currently collapsed (drives the chevron and the trigger label). */
  collapsed: boolean;
  onSelectGroup: (ruleIds: string[], checked: boolean) => void;
  /**
   * Keyboard handler for the toggle button, built by the page so it can reach
   * the live navigation index, the collapse state and the group selection.
   * Handles Up/Down/Home/End (list navigation), Left/Right (collapse/expand)
   * and Space (toggle the whole group's selection).
   */
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  testId?: string;
}

export function RuleGroupHeader({
  group,
  selectedCount,
  collapsed,
  onSelectGroup,
  onKeyDown,
  testId,
}: RuleGroupHeaderProps) {
  const total = group.ruleIds.length;
  const checkedState = deriveCheckedState(selectedCount, total);

  const ariaLabel = getMessage('ruleViewSelectGroupAriaLabel').replace('{group}', group.label);
  const toggleLabel = collapsed
    ? getMessage('tabTreeExpandGroup', [group.label])
    : getMessage('tabTreeCollapseGroup', [group.label]);

  return (
    <Flex align="center" gap="2" mt="3" mb="1" data-testid={testId}>
      <Checkbox
        checked={checkedState}
        onCheckedChange={checked => onSelectGroup(group.ruleIds, checked === true)}
        aria-label={ariaLabel}
      />

      <Collapsible.Trigger asChild>
        <button
          type="button"
          aria-label={toggleLabel}
          title={toggleLabel}
          data-testid={testId ? `${testId}-toggle` : undefined}
          data-rules-nav-item=""
          data-shortcut-scope="widget:rule-group"
          onKeyDown={onKeyDown}
          style={{
            all: 'unset',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flex: 1,
            minWidth: 0,
            cursor: 'pointer',
            color: 'var(--gray-12)',
          }}
        >
          {collapsed ? (
            <ChevronRight size={14} aria-hidden="true" style={{ color: 'var(--gray-11)', flexShrink: 0 }} />
          ) : (
            <ChevronDown size={14} aria-hidden="true" style={{ color: 'var(--gray-11)', flexShrink: 0 }} />
          )}

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
        </button>
      </Collapsible.Trigger>
    </Flex>
  );
}
