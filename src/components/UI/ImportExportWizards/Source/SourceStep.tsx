import React from 'react';
import { Box } from '@radix-ui/themes';
import { SourceModeSegmented } from './SourceModeSegmented';
import { FileDropZone } from './FileDropZone';
import { JsonTextArea } from './JsonTextArea';
import { ImportErrorCallout } from './ImportErrorCallout';
import { ImportSuccessCallout } from './ImportSuccessCallout';
import type { JsonSourceInputState, SourceMode } from './useJsonSourceInput';

interface SourceStepProps<T extends readonly unknown[]> {
  source: JsonSourceInputState<T>;
  textareaPlaceholder: string;
  successCountMessageKey: string;
  availableModes?: readonly SourceMode[];
  packGalleryNode?: React.ReactNode;
}

/**
 * Step 0 of an import wizard: mode segmented control + either file drop zone,
 * JSON textarea, or pack gallery, followed by success / error callouts.
 */
export function SourceStep<T extends readonly unknown[]>({
  source,
  textareaPlaceholder,
  successCountMessageKey,
  availableModes,
  packGalleryNode,
}: SourceStepProps<T>) {
  return (
    <Box mt="4">
      <SourceModeSegmented source={source} availableModes={availableModes} />

      <Box mt="3">
        {source.sourceMode === 'file' && <FileDropZone source={source} />}
        {source.sourceMode === 'text' && (
          <JsonTextArea source={source} placeholder={textareaPlaceholder} />
        )}
        {source.sourceMode === 'pack' && packGalleryNode}
      </Box>

      <ImportErrorCallout source={source} />
      <ImportSuccessCallout
        source={source as JsonSourceInputState<readonly unknown[]>}
        countMessageKey={successCountMessageKey}
      />
    </Box>
  );
}
