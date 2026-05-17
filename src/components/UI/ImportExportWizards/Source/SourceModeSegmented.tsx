import React from 'react';
import { SegmentedControl } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import type { JsonSourceInputState, SourceMode } from './useJsonSourceInput';

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
      onValueChange={(v: string) => source.setSourceMode(v as SourceMode)}
      size="2"
    >
      {availableModes.map((mode) => (
        <SegmentedControl.Item
          key={mode}
          value={mode}
          data-testid={`source-mode-${mode}`}
        >
          {getMessage(MODE_LABEL_KEYS[mode])}
        </SegmentedControl.Item>
      ))}
    </SegmentedControl.Root>
  );
}
