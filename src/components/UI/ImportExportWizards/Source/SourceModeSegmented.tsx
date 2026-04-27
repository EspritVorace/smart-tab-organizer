import React from 'react';
import { SegmentedControl } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import type { JsonSourceInputState, SourceMode } from './useJsonSourceInput';

interface SourceModeSegmentedProps<T> {
  source: JsonSourceInputState<T>;
}

export function SourceModeSegmented<T>({ source }: SourceModeSegmentedProps<T>) {
  return (
    <SegmentedControl.Root
      value={source.sourceMode}
      onValueChange={(v: string) => source.setSourceMode(v as SourceMode)}
      size="2"
    >
      <SegmentedControl.Item value="file">{getMessage('sourceFile')}</SegmentedControl.Item>
      <SegmentedControl.Item value="text">{getMessage('sourceText')}</SegmentedControl.Item>
    </SegmentedControl.Root>
  );
}
