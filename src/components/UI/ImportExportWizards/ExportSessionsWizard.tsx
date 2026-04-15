import React, { useCallback, useMemo, useState } from 'react';
import { Box, Dialog, Separator } from '@radix-ui/themes';
import { Archive, FileDown, Pin } from 'lucide-react';
import { SessionsTheme } from '../../Form/themes';
import { getMessage } from '../../../utils/i18n';
import { loadSessions } from '../../../utils/sessionStorage';
import { splitByPinned } from '../../../utils/sessionUtils';
import type { Session } from '../../../types/session';
import { CountLabel, WizardDialogTitle, useDialogReset, useToggleSet } from './Shared';
import {
  ExportDialogFooter,
  ExportNoteField,
  ExportSplitButton,
  SelectableListContainer,
  SelectionToolbar,
  SessionExportGroupSection,
  useExportActions,
} from './Export';

interface ExportSessionsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportSessionsWizard({ open, onOpenChange }: ExportSessionsWizardProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const selection = useToggleSet<string>();
  const [exportNote, setExportNote] = useState('');

  useDialogReset(open, () => {
    loadSessions().then((loaded) => {
      setSessions(loaded);
      selection.setAll(loaded.map((s) => s.id));
    });
    setExportNote('');
  });

  const selectAll = useCallback(() => {
    selection.setAll(sessions.map((s) => s.id));
  }, [sessions, selection]);

  const { pinned: pinnedSessions, unpinned: unpinnedSessions } = useMemo(
    () => splitByPinned(sessions),
    [sessions],
  );

  const toggleGroupSelection = useCallback((group: Session[]) => {
    const allSelected = group.every((s) => selection.has(s.id));
    const nextIds = new Set(selection.ids);
    if (allSelected) {
      group.forEach((s) => nextIds.delete(s.id));
    } else {
      group.forEach((s) => nextIds.add(s.id));
    }
    selection.setAll(nextIds);
  }, [selection]);

  const getGroupCheckedState = useCallback((group: Session[]): boolean | 'indeterminate' => {
    if (group.length === 0) return false;
    const selectedCount = group.filter((s) => selection.has(s.id)).length;
    if (selectedCount === 0) return false;
    if (selectedCount === group.length) return true;
    return 'indeterminate';
  }, [selection]);

  const selectedSessions = sessions.filter((s) => selection.has(s.id));

  const buildJson = useCallback(() => {
    const exportData: { note?: string; sessions: Session[] } = { sessions: selectedSessions };
    if (exportNote.trim()) exportData.note = exportNote.trim();
    return JSON.stringify(exportData, null, 2);
  }, [selectedSessions, exportNote]);

  const actions = useExportActions({
    filename: 'smarttab_organizer_sessions.json',
    notifyTitleKey: 'exportSessionsNotificationTitle',
    notifyMessage: (count) =>
      getMessage('exportSessionsNotificationMessage').replace('$1', String(count)),
    selected: selectedSessions,
    note: exportNote,
    buildJson,
    onFinish: () => onOpenChange(false),
  });

  return (
    <SessionsTheme>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ maxWidth: 550 }}>
          <WizardDialogTitle
            icon={FileDown}
            titleKey="exportSessionsTitle"
            descriptionKey="exportSessionsDescription"
          />

          <Box mt="4">
            <ExportNoteField value={exportNote} onChange={setExportNote} />
            <SelectionToolbar onSelectAll={selectAll} onDeselectAll={selection.clearAll} />

            <SelectableListContainer>
              <SessionExportGroupSection
                sessions={pinnedSessions}
                titleKey="pinnedSessionsSection"
                icon={Pin}
                selection={selection}
                groupCheckedState={getGroupCheckedState(pinnedSessions)}
                onToggleGroup={() => toggleGroupSelection(pinnedSessions)}
              />

              {pinnedSessions.length > 0 && unpinnedSessions.length > 0 && (
                <Separator size="4" my="1" />
              )}

              <SessionExportGroupSection
                sessions={unpinnedSessions}
                titleKey="sessionsSection"
                icon={Archive}
                selection={selection}
                groupCheckedState={getGroupCheckedState(unpinnedSessions)}
                onToggleGroup={() => toggleGroupSelection(unpinnedSessions)}
              />
            </SelectableListContainer>

            <CountLabel messageKey="sessionsSelectedCount" count={selection.size} />
          </Box>

          <ExportDialogFooter>
            <ExportSplitButton
              labelKey="exportSessionsButton"
              actions={actions}
              disabled={selection.size === 0}
            />
          </ExportDialogFooter>
        </Dialog.Content>
      </Dialog.Root>
    </SessionsTheme>
  );
}
