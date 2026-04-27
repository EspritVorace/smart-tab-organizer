import React from 'react';
import { Flex, TextField } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { EditRowShell } from './EditRowShell';
import { ChromeColorPicker } from './ChromeColorPicker';
import type { ChromeGroupColor } from '@/types/tabTree';

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
  return (
    <EditRowShell level={level} onSave={onSave} onCancel={onCancel}>
      {(inputRef) => (
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
      )}
    </EditRowShell>
  );
}
