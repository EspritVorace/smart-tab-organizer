import React from 'react';
import { Switch, Text, HoverCard, Flex, Badge, Card, Checkbox, IconButton, DropdownMenu, Box } from '@radix-ui/themes';
import { Pencil, Trash2, MoreHorizontal, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/react/sortable';
import { RuleDetailPopover } from './RuleDetailPopover';
import { AccessibleHighlight } from '@/components/UI/AccessibleHighlight/AccessibleHighlight';
import { getMessage } from '@/utils/i18n';
import { getRadixColor } from '@/utils/utils';
import { getRuleCategory } from '@/schemas/enums';
import type { DomainRuleSetting } from '@/types/syncSettings';

export interface DomainRuleCardProps {
  rule: DomainRuleSetting;
  index: number;
  isSelected: boolean;
  searchTerm: string;
  isDragDisabled: boolean;
  isDomainActionDisabled: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onEdit: (rule: DomainRuleSetting) => void;
  onDeleteRequest: (ruleId: string, focusIndex: number) => void;
  onMoveToFirst: (id: string) => void;
  onMoveToLast: (id: string) => void;
  onMoveToFirstOfDomain: (id: string) => void;
  onMoveToLastOfDomain: (id: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function DomainRuleCard({
  rule,
  index,
  isSelected,
  searchTerm,
  isDragDisabled,
  isDomainActionDisabled,
  onSelect,
  onToggleEnabled,
  onEdit,
  onDeleteRequest,
  onMoveToFirst,
  onMoveToLast,
  onMoveToFirstOfDomain,
  onMoveToLastOfDomain,
  onKeyDown,
}: DomainRuleCardProps) {
  const { ref, handleRef, isDragging } = useSortable({ id: rule.id, index, disabled: isDragDisabled });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.4 : rule.enabled ? 1 : 0.6,
    zIndex: isDragging ? 10 : undefined,
    position: isDragging ? 'relative' : undefined,
  };

  const category = getRuleCategory(rule.categoryId);

  return (
    <Card
      ref={ref}
      data-testid={`rule-card-${rule.id}`}
      variant="surface"
      size="2"
      role="row"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`${rule.label} — ${rule.domainFilter}`}
      onKeyDown={onKeyDown}
      style={style}
    >
      <Flex align="center" justify="between" gap="4">
        {/* Drag handle */}
        <Box
          ref={handleRef}
          data-testid={`rule-card-${rule.id}-drag-handle`}
          aria-disabled={isDragDisabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragDisabled ? 'not-allowed' : 'grab',
            touchAction: 'none',
            color: isDragDisabled ? 'var(--gray-6)' : 'var(--gray-9)',
            flexShrink: 0,
          }}
        >
          <GripVertical size={16} aria-hidden="true" />
        </Box>

        {/* Left: Selection + Toggle */}
        <Flex align="center" gap="3" role="gridcell">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(rule.id, checked as boolean)}
          />
          <Switch
            size="1"
            checked={rule.enabled}
            onCheckedChange={(checked) => onToggleEnabled(rule.id, checked)}
          />
        </Flex>

        {/* Center: Badge + Domain */}
        <Flex align="center" gap="3" role="gridcell" style={{ flex: 1, minWidth: 0 }}>
          <HoverCard.Root>
            <HoverCard.Trigger>
              <Badge
                color={category ? getRadixColor(category.color) : 'gray'}
                variant="solid"
                size="2"
                style={{ cursor: 'pointer', flexShrink: 0 }}
              >
                {category ? `${category.emoji} ` : ''}
                <AccessibleHighlight text={rule.label} searchTerm={searchTerm} />
              </Badge>
            </HoverCard.Trigger>
            <HoverCard.Content size="2" style={{ maxWidth: 400 }}>
              <RuleDetailPopover rule={rule} searchTerm={searchTerm} />
            </HoverCard.Content>
          </HoverCard.Root>

          <Text size="2" color="gray" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <AccessibleHighlight text={rule.domainFilter} searchTerm={searchTerm} />
          </Text>
        </Flex>

        {/* Right: Actions */}
        <Flex align="center" role="gridcell" style={{ flexShrink: 0 }}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <IconButton
                data-testid={`rule-card-${rule.id}-btn-dropdown`}
                size="2"
                variant="ghost"
                color="gray"
                aria-label={getMessage('ruleMoreActions')}
              >
                <MoreHorizontal size={16} aria-hidden="true" />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item
                data-testid={`rule-card-${rule.id}-menu-edit`}
                onClick={() => onEdit(rule)}
              >
                <Pencil size={14} aria-hidden="true" />
                {getMessage('edit')}
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                data-testid={`rule-card-${rule.id}-menu-move-first`}
                onClick={() => onMoveToFirst(rule.id)}
              >
                {getMessage('ruleMoveToFirst')}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                data-testid={`rule-card-${rule.id}-menu-move-last`}
                onClick={() => onMoveToLast(rule.id)}
              >
                {getMessage('ruleMoveToLast')}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                data-testid={`rule-card-${rule.id}-menu-move-first-domain`}
                disabled={isDomainActionDisabled}
                onClick={() => !isDomainActionDisabled && onMoveToFirstOfDomain(rule.id)}
              >
                {getMessage('ruleMoveToFirstOfDomain')}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                data-testid={`rule-card-${rule.id}-menu-move-last-domain`}
                disabled={isDomainActionDisabled}
                onClick={() => !isDomainActionDisabled && onMoveToLastOfDomain(rule.id)}
              >
                {getMessage('ruleMoveToLastOfDomain')}
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                data-testid={`rule-card-${rule.id}-menu-delete`}
                color="red"
                onClick={() => onDeleteRequest(rule.id, index)}
              >
                <Trash2 size={14} aria-hidden="true" />
                {getMessage('delete')}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
      </Flex>
    </Card>
  );
}
