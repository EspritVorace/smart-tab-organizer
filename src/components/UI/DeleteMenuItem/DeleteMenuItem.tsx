import React from 'react';
import { DropdownMenu, Flex, Kbd } from '@radix-ui/themes';
import { Trash2 } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

export interface DeleteMenuItemProps {
  onClick: () => void;
  /** When true, the item is disabled and its onClick is short-circuited. */
  disabled?: boolean;
  /** Optional data-testid attribute for E2E targeting. */
  'data-testid'?: string;
}

/**
 * Reusable "Delete" item for DropdownMenu contexts.
 * Renders a red DropdownMenu.Item with a Trash2 icon, the i18n "delete" label,
 * and a Del keyboard shortcut hint.
 */
export function DeleteMenuItem({ onClick, disabled = false, 'data-testid': testId }: DeleteMenuItemProps) {
  return (
    <DropdownMenu.Item
      color="red"
      disabled={disabled}
      data-testid={testId}
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
    >
      <Flex align="center" justify="between" gap="3" width="100%">
        <Flex align="center" gap="2">
          <Trash2 size={14} aria-hidden="true" />
          {getMessage('delete')}
        </Flex>
        <Kbd size="1">Del</Kbd>
      </Flex>
    </DropdownMenu.Item>
  );
}
