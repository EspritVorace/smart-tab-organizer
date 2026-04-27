import React, { useEffect, useRef } from 'react';
import { Flex, Box, Button } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';

export interface EditRowShellProps {
  level: number;
  onSave: () => void;
  onCancel: () => void;
  /** Render prop receiving the inputRef to attach to the focusable field */
  children: (inputRef: React.RefObject<HTMLInputElement>) => React.ReactNode;
}

/**
 * Shell shared by GroupEditRow and TabEditRow.
 *
 * Handles:
 * - Indentation box (paddingLeft = (level - 1) * 20 + 8)
 * - Auto-focus of the primary input on mount
 * - Cancel / Save button row
 *
 * The `children` render prop receives the inputRef so each row can attach it
 * to its specific focusable field.
 */
export function EditRowShell({ level, onSave, onCancel, children }: EditRowShellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Box
      style={{
        paddingLeft: (level - 1) * 20 + 8,
        paddingRight: 'var(--space-2)',
        paddingTop: 'var(--space-2)',
        paddingBottom: 'var(--space-2)',
      }}
    >
      <Flex direction="column" gap="2">
        {children(inputRef)}
        <Flex gap="2" justify="end">
          <Button size="1" variant="soft" color="gray" onClick={onCancel}>
            {getMessage('cancel')}
          </Button>
          <Button size="1" onClick={onSave}>
            {getMessage('save')}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
