import React from 'react';
import { Callout } from '@radix-ui/themes';
import { XCircle } from 'lucide-react';
import type { JsonSourceInputState } from './useJsonSourceInput';

interface ImportErrorCalloutProps<T> {
  source: JsonSourceInputState<T>;
}

export function ImportErrorCallout<T>({ source }: ImportErrorCalloutProps<T>) {
  if (!source.parseError) return null;
  return (
    <Callout.Root color="red" variant="soft" mt="3">
      <Callout.Icon>
        <XCircle size={16} />
      </Callout.Icon>
      <Callout.Text style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
        {source.parseError}
      </Callout.Text>
    </Callout.Root>
  );
}
