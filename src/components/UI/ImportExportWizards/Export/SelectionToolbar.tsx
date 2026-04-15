import React from 'react';
import { Button, Flex } from '@radix-ui/themes';
import { getMessage } from '../../../../utils/i18n';

interface SelectionToolbarProps {
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

/**
 * "Select all / Deselect all" button pair rendered above any selectable list.
 */
export function SelectionToolbar({ onSelectAll, onDeselectAll }: SelectionToolbarProps) {
  return (
    <Flex gap="2" mb="3">
      <Button variant="soft" size="1" onClick={onSelectAll}>
        {getMessage('selectAll')}
      </Button>
      <Button variant="soft" size="1" color="gray" onClick={onDeselectAll}>
        {getMessage('deselectAll')}
      </Button>
    </Flex>
  );
}
