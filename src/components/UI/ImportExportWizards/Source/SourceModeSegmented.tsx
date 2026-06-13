import React from 'react';
import { SegmentedControl } from '@radix-ui/themes';
import { getMessage, type MessageKey } from '@/utils/i18n';
import { markDiscovered } from '@/exploration/progressStore';
import type { JsonSourceInputState, SourceMode } from './useJsonSourceInput';

/** Maps a source mode to its exploration capability id (pack has no entry). */
const SOURCE_MODE_CAPABILITY: Partial<Record<SourceMode, string>> = {
  file: 'io.sourceFile',
  text: 'io.sourceText',
};

const DEFAULT_AVAILABLE_MODES: readonly SourceMode[] = ['file', 'text'];

const MODE_LABEL_KEYS: Record<SourceMode, string> = {
  file: 'sourceFile',
  text: 'sourceText',
  pack: 'sourcePack',
};

interface SourceModeSegmentedProps<T> {
  source: JsonSourceInputState<T>;
  availableModes?: readonly SourceMode[];
}

export function SourceModeSegmented<T>({
  source,
  availableModes = DEFAULT_AVAILABLE_MODES,
}: SourceModeSegmentedProps<T>) {
  return (
    <SegmentedControl.Root
      value={source.sourceMode}
      onValueChange={(v: string) => {
        const cap = SOURCE_MODE_CAPABILITY[v as SourceMode];
        if (cap) void markDiscovered(cap);
        source.setSourceMode(v as SourceMode);
      }}
      size="2"
    >
      {availableModes.map((mode) => (
        <SegmentedControl.Item
          key={mode}
          value={mode}
          data-testid={`source-mode-${mode}`}
        >
          {getMessage(MODE_LABEL_KEYS[mode] as MessageKey)}
        </SegmentedControl.Item>
      ))}
    </SegmentedControl.Root>
  );
}
