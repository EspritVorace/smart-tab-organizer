import React from 'react';
import { Callout } from '@radix-ui/themes';
import { AlertTriangle } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

interface ConflictWarningCalloutProps {
  /** Whether the warning should actually be shown. */
  when: boolean;
  /** i18n key of the warning message. */
  messageKey: string;
}

export function ConflictWarningCallout({ when, messageKey }: ConflictWarningCalloutProps) {
  if (!when) return null;
  return (
    <Callout.Root color="orange" variant="soft" mt="3">
      <Callout.Icon>
        <AlertTriangle size={16} />
      </Callout.Icon>
      <Callout.Text>{getMessage(messageKey)}</Callout.Text>
    </Callout.Root>
  );
}
