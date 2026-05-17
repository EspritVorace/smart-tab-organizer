import React from 'react';
import { Flex, Text, Checkbox, Separator } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';

interface BulkActionsBarProps {
  /** Test id appliqué au conteneur (chaque appelant fournit le sien). */
  testId?: string;
  /** Nombre d'éléments actuellement sélectionnés (drive le libellé). */
  selectedCount: number;
  /** True ssi tous les éléments visibles sont sélectionnés. */
  isAllSelected: boolean;
  /** True si au moins un mais pas tous sont sélectionnés. */
  isIndeterminate: boolean;
  /** Master checkbox handler. */
  onSelectAll: (checked: boolean) => void;
  /** Slot des boutons d'action (Export, Delete, ...). Affiché après le séparateur. */
  children: React.ReactNode;
}

export function BulkActionsBar({
  testId,
  selectedCount,
  isAllSelected,
  isIndeterminate,
  onSelectAll,
  children,
}: BulkActionsBarProps) {
  return (
    <Flex
      data-testid={testId}
      align="center"
      gap="3"
      p="2"
      mb="4"
      style={{ backgroundColor: 'var(--accent-a3)', borderRadius: 'var(--radius-2)' }}
    >
      <Checkbox
        checked={isAllSelected}
        onCheckedChange={(checked) => onSelectAll(checked as boolean)}
        aria-label={getMessage('selectAll')}
        {...(isIndeterminate && { 'data-indeterminate': true })}
      />
      <Text size="2" weight="medium">
        {selectedCount === 1
          ? getMessage('dataTableSelectedCountSingular')
          : getMessage('dataTableSelectedCountPlural').replace('{count}', selectedCount.toString())}
      </Text>
      <Separator orientation="vertical" />
      <Flex gap="2">{children}</Flex>
    </Flex>
  );
}
