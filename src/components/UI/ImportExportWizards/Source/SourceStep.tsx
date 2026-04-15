import React from 'react';
import { Box } from '@radix-ui/themes';
import { SourceModeSegmented } from './SourceModeSegmented';
import { FileDropZone } from './FileDropZone';
import { JsonTextArea } from './JsonTextArea';
import { ImportErrorCallout } from './ImportErrorCallout';
import { ImportSuccessCallout } from './ImportSuccessCallout';
import type { JsonSourceInputState } from './useJsonSourceInput';

interface SourceStepProps<T extends readonly unknown[]> {
  source: JsonSourceInputState<T>;
  textareaPlaceholder: string;
  successCountMessageKey: string;
}

/**
 * Step 0 of an import wizard: mode segmented control + either file drop zone
 * or JSON textarea, followed by success / error callouts.
 */
export function SourceStep<T extends readonly unknown[]>({
  source,
  textareaPlaceholder,
  successCountMessageKey,
}: SourceStepProps<T>) {
  return (
    <Box mt="4">
      <SourceModeSegmented source={source} />

      <Box mt="3">
        {source.sourceMode === 'file'
          ? <FileDropZone source={source} />
          : <JsonTextArea source={source} placeholder={textareaPlaceholder} />}
      </Box>

      <ImportErrorCallout source={source} />
      <ImportSuccessCallout
        source={source as JsonSourceInputState<readonly unknown[]>}
        countMessageKey={successCountMessageKey}
      />
    </Box>
  );
}
