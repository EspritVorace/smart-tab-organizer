import React from 'react';
import { Flex, Text, TextField } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { EditRowShell } from './EditRowShell';
import styles from './TabTreeEditor.module.css';

export interface TabEditRowProps {
  url: string;
  error: string | null;
  level: number;
  onChange: (url: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function TabEditRow({ url, error, level, onChange, onSave, onCancel }: TabEditRowProps) {
  return (
    <EditRowShell level={level} onSave={onSave} onCancel={onCancel}>
      {(inputRef) => (
        <>
          <Flex align="center" gap="2">
            <Text size="1" color="gray" style={{ flexShrink: 0 }}>
              {getMessage('tabEditorUrlLabel')}:
            </Text>
            <TextField.Root
              ref={inputRef}
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') onSave();
                if (e.key === 'Escape') onCancel();
              }}
              size="1"
              style={{ flex: 1 }}
              placeholder="https://example.com"
              aria-label={getMessage('tabEditorUrlLabel')}
            />
          </Flex>
          {error && (
            <Text size="1" className={styles.urlError}>
              {error}
            </Text>
          )}
        </>
      )}
    </EditRowShell>
  );
}
