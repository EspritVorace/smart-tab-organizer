import React from 'react';
import { Flex, SegmentedControl, Text } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { markDiscovered } from '@/exploration/progressStore';
import type { ConflictMode } from './useImportClassification';

interface ConflictModeSelectorProps {
  value: ConflictMode;
  onChange: (mode: ConflictMode) => void;
}

/** Maps a conflict resolution mode to its exploration capability id. */
const CONFLICT_MODE_CAPABILITY: Record<ConflictMode, string> = {
  overwrite: 'io.conflict.overwrite',
  duplicate: 'io.conflict.new',
  ignore: 'io.conflict.skip',
};

export function ConflictModeSelector({ value, onChange }: ConflictModeSelectorProps) {
  return (
    <Flex align="center" gap="2" mb="1">
      <Text size="2" color="gray">{getMessage('conflictResolutionMode')}</Text>
      <SegmentedControl.Root
        value={value}
        onValueChange={(v: string) => {
          void markDiscovered(CONFLICT_MODE_CAPABILITY[v as ConflictMode]);
          onChange(v as ConflictMode);
        }}
        size="1"
      >
        <SegmentedControl.Item value="overwrite" data-testid="conflict-mode-overwrite">{getMessage('conflictModeOverwrite')}</SegmentedControl.Item>
        <SegmentedControl.Item value="duplicate" data-testid="conflict-mode-duplicate">{getMessage('conflictModeDuplicate')}</SegmentedControl.Item>
        <SegmentedControl.Item value="ignore" data-testid="conflict-mode-ignore">{getMessage('conflictModeIgnore')}</SegmentedControl.Item>
      </SegmentedControl.Root>
    </Flex>
  );
}
