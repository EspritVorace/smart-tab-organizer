import React, { useCallback, useMemo } from 'react';
import { Separator } from '@radix-ui/themes';
import { Archive, FileDown, Pin } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { loadSessions } from '@/utils/sessionStorage';
import { splitByPinned } from '@/utils/sessionUtils';
import type { Session } from '@/types/session';
import { ExportWizardShell } from './ExportWizardShell';
import { useExportWizardState } from './useExportWizardState';
import { SessionExportGroupSection } from './Export';

interface ExportSessionsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportSessionsWizard({ open, onOpenChange }: ExportSessionsWizardProps) {
  const state = useExportWizardState<Session>({
    open,
    loadItems: loadSessions,
    payloadKey: 'sessions',
    filename: 'smarttab_organizer_sessions.json',
    notifyTitleKey: 'exportSessionsNotificationTitle',
    notifyMessage: (count) =>
      getMessage('exportSessionsNotificationMessage').replace('$1', String(count)),
    onFinish: () => onOpenChange(false),
  });

  const { items: sessions, selection } = state;

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

  return (
    <ExportWizardShell<Session>
      open={open}
      onOpenChange={onOpenChange}
      icon={FileDown}
      title={getMessage('exportSessionsTitle')}
      description={getMessage('exportSessionsDescription')}
      state={state}
      countLabelKey="sessionsSelectedCount"
      buttonLabelKey="exportSessionsButton"
    >
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
    </ExportWizardShell>
  );
}
