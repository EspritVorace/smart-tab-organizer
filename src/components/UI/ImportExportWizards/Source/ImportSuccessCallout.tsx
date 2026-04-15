import React from 'react';
import { Callout } from '@radix-ui/themes';
import { CheckCircle } from 'lucide-react';
import { getMessage } from '../../../../utils/i18n';
import type { JsonSourceInputState } from './useJsonSourceInput';

interface ImportSuccessCalloutProps {
  source: JsonSourceInputState<readonly unknown[]>;
  /** i18n key of the message containing the `{count}` placeholder. */
  countMessageKey: string;
}

/**
 * Green "X items found" callout rendered once the payload parses cleanly.
 * Any wizard whose parsed payload is an array can plug into this.
 */
export function ImportSuccessCallout({ source, countMessageKey }: ImportSuccessCalloutProps) {
  if (!source.parsedData) return null;
  return (
    <Callout.Root color="green" variant="soft" mt="3">
      <Callout.Icon>
        <CheckCircle size={16} />
      </Callout.Icon>
      <Callout.Text>
        {getMessage(countMessageKey).replace('{count}', String(source.parsedData.length))}
      </Callout.Text>
    </Callout.Root>
  );
}
