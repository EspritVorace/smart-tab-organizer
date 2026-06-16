import React, { useEffect } from 'react';
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
  // Exploration: mark the currently selected source (mount + every change), so
  // the default mode is discovered just by reaching the selector, mirroring how
  // the rule wizard marks `grouping.mode.*`. `pack` has no capability entry.
  const sourceMode = source.sourceMode;
  useEffect(() => {
    const cap = SOURCE_MODE_CAPABILITY[sourceMode];
    if (cap) void markDiscovered(cap);
  }, [sourceMode]);

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
          {getMessage(MODE_LABEL_KEYS[mode] as MessageKey)}
        </SegmentedControl.Item>
      ))}
    </SegmentedControl.Root>
  );
}
