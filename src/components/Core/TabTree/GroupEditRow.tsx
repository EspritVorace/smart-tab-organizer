import React, { useEffect, useRef } from 'react';
import { Flex, Box, TextField, Button } from '@radix-ui/themes';
import { getMessage } from '../../../utils/i18n';
import { ChromeColorPicker } from './ChromeColorPicker';
import type { ChromeGroupColor } from '../../../types/tabTree';

export interface GroupEditRowProps {
  name: string;
  color: ChromeGroupColor;
  level: number;
  onNameChange: (name: string) => void;
  onColorChange: (color: ChromeGroupColor) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function GroupEditRow({
  name,
  color,
  level,
  onNameChange,
  onColorChange,
  onSave,
  onCancel,
}: GroupEditRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the group name input on mount (replaces autoFocus).
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
        <Flex align="center" gap="2">
          <TextField.Root
            ref={inputRef}
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') onCancel();
            }}
            size="1"
            style={{ flex: 1 }}
            placeholder={getMessage('tabEditorGroupNameLabel')}
            aria-label={getMessage('tabEditorGroupNameLabel')}
          />
          <ChromeColorPicker value={color} onChange={onColorChange} />
        </Flex>
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
