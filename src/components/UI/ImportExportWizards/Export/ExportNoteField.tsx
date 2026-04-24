import React, { useId } from 'react';
import { Box, Text, TextArea } from '@radix-ui/themes';
import * as Label from '@radix-ui/react-label';
import { getMessage } from '@/utils/i18n';

interface ExportNoteFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExportNoteField({ value, onChange }: ExportNoteFieldProps) {
  const id = useId();
  return (
    <Box mb="4">
      <Text size="2" weight="medium" asChild>
        <Label.Root htmlFor={id}>
          {getMessage('exportNoteLabel')}
        </Label.Root>
      </Text>
      <TextArea
        id={id}
        mt="1"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={getMessage('exportNotePlaceholder')}
        rows={2}
      />
    </Box>
  );
}
