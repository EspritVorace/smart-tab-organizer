import React from 'react';
import { DropdownMenu, Flex, Kbd } from '@radix-ui/themes';
import { Trash2 } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

export interface DeleteMenuItemProps {
  onClick: () => void;
  /** Optional data-testid attribute for E2E targeting. */
  'data-testid'?: string;
}

/**
 * Reusable "Delete" item for DropdownMenu contexts.
 * Renders a red DropdownMenu.Item with a Trash2 icon, the i18n "delete" label,
 * and a Del keyboard shortcut hint.
 */
export function DeleteMenuItem({ onClick, 'data-testid': testId }: DeleteMenuItemProps) {
  return (
    <DropdownMenu.Item
      color="red"
      data-testid={testId}
      onClick={onClick}
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
