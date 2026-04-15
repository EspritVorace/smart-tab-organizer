import React from 'react';
import { Flex, SegmentedControl, Text } from '@radix-ui/themes';
import { getMessage } from '../../../../utils/i18n';
import type { ConflictMode } from './useImportClassification';

interface ConflictModeSelectorProps {
  value: ConflictMode;
  onChange: (mode: ConflictMode) => void;
}

export function ConflictModeSelector({ value, onChange }: ConflictModeSelectorProps) {
  return (
    <Flex align="center" gap="2" mb="1">
      <Text size="2" color="gray">{getMessage('conflictResolutionMode')}</Text>
      <SegmentedControl.Root
        value={value}
        onValueChange={(v: string) => onChange(v as ConflictMode)}
        size="1"
      >
        <SegmentedControl.Item value="overwrite">{getMessage('conflictModeOverwrite')}</SegmentedControl.Item>
        <SegmentedControl.Item value="duplicate">{getMessage('conflictModeDuplicate')}</SegmentedControl.Item>
        <SegmentedControl.Item value="ignore">{getMessage('conflictModeIgnore')}</SegmentedControl.Item>
      </SegmentedControl.Root>
    </Flex>
  );
}
