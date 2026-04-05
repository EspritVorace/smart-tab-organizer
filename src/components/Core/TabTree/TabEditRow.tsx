import React from 'react';
import { Flex, Text, Box, TextField, Button } from '@radix-ui/themes';
import { getMessage } from '../../../utils/i18n';
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
          <Text size="1" color="gray" style={{ flexShrink: 0 }}>
            {getMessage('tabEditorUrlLabel')}:
          </Text>
          <TextField.Root
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
            autoFocus
          />
        </Flex>
        {error && (
          <Text size="1" className={styles.urlError}>
            {error}
          </Text>
        )}
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
