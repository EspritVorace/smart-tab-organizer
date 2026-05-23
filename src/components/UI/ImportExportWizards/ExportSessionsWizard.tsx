import React, { useCallback, useMemo } from 'react';
import { Separator } from '@radix-ui/themes';
import { Archive, Boxes, FileDown, Pin } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { loadSessions } from '@/utils/sessionStorage';
import { splitByBucket } from '@/utils/sessionUtils';
import type { Session } from '@/types/session';
import { ExportWizardShell } from './ExportWizardShell';
import { useExportWizardState } from './useExportWizardState';
import { SessionExportGroupSection } from './Export';

interface ExportSessionsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional pre-selection (typically passed by a bulk action call site). */
  initialSelectedIds?: string[];
}

export function ExportSessionsWizard({ open, onOpenChange, initialSelectedIds }: ExportSessionsWizardProps) {
  const state = useExportWizardState<Session>({
    open,
    loadItems: loadSessions,
    initialSelectedIds,
    defaultExcludeIds: (items) =>
      new Set(items.filter((s) => s.isArchived).map((s) => s.id)),
    payloadKey: 'sessions',
    filename: 'smarttab_organizer_sessions.json',
    notifyTitleKey: 'exportSessionsNotificationTitle',
    notifyMessage: (count) =>
      getMessage('exportSessionsNotificationMessage').replace('$1', String(count)),
    onFinish: () => onOpenChange(false),
  });

  const { items: sessions, selection } = state;

  const { pinned: pinnedSessions, active: activeSessions, archived: archivedSessions } = useMemo(
    () => splitByBucket(sessions),
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

  const groupSeparator = (above: Session[], below: Session[]) =>
    above.length > 0 && below.length > 0 ? <Separator size="4" my="1" /> : null;

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

      {groupSeparator(pinnedSessions, activeSessions)}

      <SessionExportGroupSection
        sessions={activeSessions}
        titleKey="activeSessionsSection"
        icon={Archive}
        selection={selection}
        groupCheckedState={getGroupCheckedState(activeSessions)}
        onToggleGroup={() => toggleGroupSelection(activeSessions)}
      />

      {groupSeparator([...pinnedSessions, ...activeSessions], archivedSessions)}

      <SessionExportGroupSection
        sessions={archivedSessions}
        titleKey="exportArchivedSessionsGroupTitle"
        icon={Boxes}
        selection={selection}
        groupCheckedState={getGroupCheckedState(archivedSessions)}
        onToggleGroup={() => toggleGroupSelection(archivedSessions)}
      />
    </ExportWizardShell>
  );
}
