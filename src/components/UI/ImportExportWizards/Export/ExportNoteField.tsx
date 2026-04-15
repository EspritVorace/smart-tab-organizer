import React from 'react';
import { Box, Text, TextArea } from '@radix-ui/themes';
import { getMessage } from '../../../../utils/i18n';

interface ExportNoteFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExportNoteField({ value, onChange }: ExportNoteFieldProps) {
  return (
    <Box mb="4">
      <Text as="label" size="2" weight="medium">
        {getMessage('exportNoteLabel')}
      </Text>
      <TextArea
        mt="1"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={getMessage('exportNotePlaceholder')}
        rows={2}
      />
    </Box>
  );
}
