import React from 'react';
import { Callout, Text } from '@radix-ui/themes';
import { Info } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

interface ImportedNoteCalloutProps {
  note: string | null;
}

/**
 * Gray info callout rendered on step 1 when the imported payload carries a
 * user-supplied note from the export side.
 */
export function ImportedNoteCallout({ note }: ImportedNoteCalloutProps) {
  if (!note) return null;
  return (
    <Callout.Root color="gray" variant="soft" mb="3">
      <Callout.Icon>
        <Info size={16} aria-hidden="true" />
      </Callout.Icon>
      <Callout.Text>
        <Text as="p" size="1" weight="medium" mb="1">{getMessage('importExportNote')}</Text>
        {note}
      </Callout.Text>
    </Callout.Root>
  );
}
