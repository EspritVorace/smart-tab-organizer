import React from 'react';
import { Text } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';

interface CountLabelProps {
  /** i18n key with a `{count}` placeholder. */
  messageKey: string;
  count: number;
}

/**
 * Small gray footer label used by both import (`rulesToImportCount`,
 * `sessionsToImportCount`) and export (`rulesSelectedCount`,
 * `sessionsSelectedCount`) steps to summarise a count.
 */
export function CountLabel({ messageKey, count }: CountLabelProps) {
  return (
    <Text size="2" color="gray" mt="3">
      {getMessage(messageKey).replace('{count}', String(count))}
    </Text>
  );
}
