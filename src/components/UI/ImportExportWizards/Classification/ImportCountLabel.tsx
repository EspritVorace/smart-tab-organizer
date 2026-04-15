import React from 'react';
import { Text } from '@radix-ui/themes';
import { getMessage } from '../../../../utils/i18n';

interface ImportCountLabelProps {
  /** i18n key with a `{count}` placeholder. */
  messageKey: string;
  count: number;
}

export function ImportCountLabel({ messageKey, count }: ImportCountLabelProps) {
  return (
    <Text size="2" color="gray" mt="3">
      {getMessage(messageKey).replace('{count}', String(count))}
    </Text>
  );
}
