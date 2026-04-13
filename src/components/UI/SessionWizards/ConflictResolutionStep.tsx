import React from 'react';
import { Flex, Text, Box, Badge, RadioGroup, ScrollArea, Callout, Select, Separator } from '@radix-ui/themes';
import { AlertTriangle } from 'lucide-react';
import { getMessage, getPluralMessage } from '../../../utils/i18n';
import { chromeGroupColors } from '../../../utils/tabTreeUtils';
import type {
  ConflictAnalysis,
  DuplicateTabAction,
  GroupConflictAction,
} from '../../../utils/conflictDetection';

interface ConflictResolutionStepProps {
  analysis: ConflictAnalysis;
  duplicateTabAction: DuplicateTabAction;
  onDuplicateTabActionChange: (action: DuplicateTabAction) => void;
  groupActions: Map<string, GroupConflictAction>;
  onGroupActionChange: (groupId: string, action: GroupConflictAction) => void;
}

export function ConflictResolutionStep({
  analysis,
  duplicateTabAction,
  onDuplicateTabActionChange,
  groupActions,
  onGroupActionChange,
}: ConflictResolutionStepProps) {
  return (
    <Flex direction="column" gap="4">
      {/* Duplicate tabs section */}
      {analysis.duplicateTabs.length > 0 && (
        <Flex direction="column" gap="3">
          <Text size="3" weight="bold">
            {getMessage('restoreDuplicateTabs', [String(analysis.duplicateTabs.length)])}
          </Text>

          <RadioGroup.Root
            value={duplicateTabAction}
            onValueChange={v => onDuplicateTabActionChange(v as DuplicateTabAction)}
          >
            <Flex direction="column" gap="2">
              <Text size="2" asChild>
                <label>
                  <Flex align="center" gap="2">
                    <RadioGroup.Item value="skip" />
                    {getMessage('restoreDuplicateSkip')}
                  </Flex>
                </label>
              </Text>
              <Text size="2" asChild>
                <label>
                  <Flex align="center" gap="2">
                    <RadioGroup.Item value="open_anyway" />
                    {getMessage('restoreDuplicateOpenAnyway')}
                  </Flex>
                </label>
              </Text>
            </Flex>
          </RadioGroup.Root>

          <ScrollArea style={{ maxHeight: 160 }} scrollbars="vertical">
            <Flex direction="column" gap="2" pr="2">
              {analysis.duplicateTabs.map(conflict => (
                <Flex
                  key={conflict.savedTab.id}
                  gap="2"
                  align="center"
                  p="2"
                  style={{
                    borderRadius: 'var(--radius-2)',
                    backgroundColor: 'var(--orange-a2)',
                  }}
                >
                  <AlertTriangle
                    size={14}
                    style={{ color: 'var(--orange-9)', flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <Flex
                    direction="column"
                    gap="0"
                    style={{ overflow: 'hidden', flex: 1 }}
                  >
                    <Text
                      size="2"
                      weight="medium"
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conflict.savedTab.title}
                    </Text>
                    <Text
                      size="1"
                      color="gray"
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conflict.savedTab.url}
                    </Text>
                  </Flex>
                  <Badge color="orange" variant="soft" size="1">
                    {getMessage('restoreAlreadyOpen')}
                  </Badge>
                </Flex>
              ))}
            </Flex>
          </ScrollArea>
        </Flex>
      )}

      {/* Separator between sections */}
      {analysis.duplicateTabs.length > 0 && analysis.conflictingGroups.length > 0 && (
        <Separator size="4" />
      )}

      {/* Conflicting groups section */}
      {analysis.conflictingGroups.length > 0 && (
        <Flex direction="column" gap="3">
          <Text size="3" weight="bold">
            {getMessage('restoreConflictingGroups', [
              String(analysis.conflictingGroups.length),
            ])}
          </Text>

          <Flex direction="column" gap="2">
            {analysis.conflictingGroups.map(conflict => {
              const action = groupActions.get(conflict.savedGroup.id) ?? 'merge';
              const colorHex =
                chromeGroupColors[conflict.savedGroup.color] ?? chromeGroupColors.grey;

              return (
                <Flex
                  key={conflict.savedGroup.id}
                  gap="3"
                  align="center"
                  p="2"
                  style={{
                    borderRadius: 'var(--radius-2)',
                    backgroundColor: 'var(--orange-a2)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: colorHex,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                  <Flex direction="column" gap="0" style={{ flex: 1 }}>
                    <Text size="2" weight="medium">
                      {conflict.savedGroup.title || getMessage('restoreUntitledGroup')}
                    </Text>
                    <Text size="1" color="gray">
                      {getPluralMessage(conflict.savedGroup.tabs.length, 'sessionTabOne', 'sessionTabCount')}
                    </Text>
                  </Flex>
                  <Select.Root
                    value={action}
                    onValueChange={v =>
                      onGroupActionChange(conflict.savedGroup.id, v as GroupConflictAction)
                    }
                    size="1"
                  >
                    <Select.Trigger aria-label={getMessage('restoreGroupAction')} />
                    <Select.Content>
                      <Select.Item value="merge">{getMessage('restoreGroupMerge')}</Select.Item>
                      <Select.Item value="create_new">
                        {getMessage('restoreGroupCreateNew')}
                      </Select.Item>
                      <Select.Item value="skip">{getMessage('restoreGroupSkip')}</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Flex>
              );
            })}
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}
