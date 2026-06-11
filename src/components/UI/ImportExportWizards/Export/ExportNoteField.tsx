import React, { useId } from 'react';
import { Box, Text, TextArea } from '@radix-ui/themes';
import * as Label from '@radix-ui/react-label';
import { getMessage, type MessageKey } from '@/utils/i18n';

interface ExportNoteFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Optional i18n key for the label (defaults to `exportNoteLabel`). */
  labelKey?: string;
  /** Optional i18n key for the placeholder (defaults to `exportNotePlaceholder`). */
  placeholderKey?: string;
  /** data-testid forwarded to the textarea. */
  'data-testid'?: string;
}

export function ExportNoteField({
  value,
  onChange,
  labelKey = 'exportNoteLabel',
  placeholderKey = 'exportNotePlaceholder',
  'data-testid': testId,
}: ExportNoteFieldProps) {
  const id = useId();
  return (
    <Box mb="4">
      <Text size="2" weight="medium" asChild>
        <Label.Root htmlFor={id}>
          {getMessage(labelKey as MessageKey)}
        </Label.Root>
      </Text>
      <TextArea
        id={id}
        mt="1"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={getMessage(placeholderKey as MessageKey)}
        rows={2}
        data-testid={testId}
      />
    </Box>
  );
}
