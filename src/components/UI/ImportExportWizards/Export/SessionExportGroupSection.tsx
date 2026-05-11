import React from 'react';
import { Box, Checkbox, Flex, Text } from '@radix-ui/themes';
import type { LucideIcon } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { SelectableSessionRow } from './SelectableSessionRow';
import type { Session } from '@/types/session';
import type { ToggleSetState } from '@/components/UI/ImportExportWizards/Shared';

interface SessionExportGroupSectionProps {
  sessions: Session[];
  /** i18n key for the section header ("pinnedSessionsSection", ...). */
  titleKey: string;
  icon: LucideIcon;
  selection: ToggleSetState<string>;
  groupCheckedState: boolean | 'indeterminate';
  onToggleGroup: () => void;
}

/**
 * "Pinned / Sessions" group shown in the export sessions wizard: icon +
 * title + indeterminate group checkbox + per-session checkboxes.
 */
export function SessionExportGroupSection({
  sessions,
  titleKey,
  icon: Icon,
  selection,
  groupCheckedState,
  onToggleGroup,
}: SessionExportGroupSectionProps) {
  if (sessions.length === 0) return null;
  return (
    <Box>
      <Flex align="center" justify="between" mb="2">
        <Flex align="center" gap="1">
          <Icon size={14} aria-hidden="true" style={{ color: 'var(--accent-9)' }} />
          <Text size="2" weight="bold">{getMessage(titleKey)}</Text>
        </Flex>
        <Checkbox
          checked={groupCheckedState}
          onCheckedChange={onToggleGroup}
          aria-label={getMessage(titleKey)}
        />
      </Flex>
      <Flex direction="column" gap="2" role="list">
        {sessions.map((session) => (
          <SelectableSessionRow
            key={session.id}
            session={session}
            checked={selection.has(session.id)}
            onToggle={() => selection.toggle(session.id)}
          />
        ))}
      </Flex>
    </Box>
  );
}
