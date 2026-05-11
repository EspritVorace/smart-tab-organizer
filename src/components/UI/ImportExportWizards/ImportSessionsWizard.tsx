import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { showSuccessToast } from '@/utils/toast';
import { sessionsArraySchema } from '@/schemas/session';
import { importSessionsDataSchema } from '@/schemas/importExport';
import {
  classifyImportedSessions,
  type ConflictingSession,
} from '@/utils/sessionClassification';
import { generateUUID } from '@/utils/utils';
import { loadSessions, saveSessions } from '@/utils/sessionStorage';
import { SessionRow, ConflictSessionRow } from './SessionImportRows';
import type { Session } from '@/types/session';
import { ImportWizardShell } from './ImportWizardShell';
import {
  useImportWizardState,
  type NormalizedClassification,
} from './useImportWizardState';

interface ImportSessionsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getUniqueName(base: string, takenNames: Set<string>): string {
  if (!takenNames.has(base.toLowerCase())) return base;
  let n = 2;
  while (takenNames.has(`${base} (${n})`.toLowerCase())) n++;
  return `${base} (${n})`;
}

const validateSessionsPayload = (raw: unknown) => {
  if (Array.isArray(raw)) {
    // Legacy flat array format (backward compat)
    const validated = sessionsArraySchema.parse(raw);
    return { data: validated as Session[], note: null };
  }
  const validated = importSessionsDataSchema.parse(raw);
  return {
    data: validated.sessions as Session[],
    note: validated.note ?? null,
  };
};

const classifySessions = (
  imported: Session[],
  existing: Session[],
): NormalizedClassification<Session, ConflictingSession> => {
  const result = classifyImportedSessions(imported, existing);
  return {
    newItems: result.newSessions,
    conflictingItems: result.conflictingSessions,
    identicalItems: result.identicalSessions,
  };
};

export function ImportSessionsWizard({ open, onOpenChange }: ImportSessionsWizardProps) {
  const [existingSessions, setExistingSessions] = useState<Session[]>([]);

  const state = useImportWizardState<Session, ConflictingSession>({
    open,
    existingItems: existingSessions,
    validatePayload: validateSessionsPayload,
    classify: classifySessions,
    onReset: () => {
      loadSessions().then((loaded) => setExistingSessions(loaded));
    },
  });

  const { classification, conflictMode, newSelection } = state;

  const executeImport = useCallback(async () => {
    if (!classification) return;

    const updatedSessions = [...existingSessions];
    let added = 0;
    let overwritten = 0;

    const takenNames = new Set<string>(existingSessions.map(s => s.name.toLowerCase()));

    for (const session of classification.newItems) {
      if (newSelection.has(session.id)) {
        updatedSessions.push(session);
        takenNames.add(session.name.toLowerCase());
        added++;
      }
    }

    for (const conflict of classification.conflictingItems) {
      if (conflictMode === 'overwrite') {
        const idx = updatedSessions.findIndex(s => s.id === conflict.existing.id);
        if (idx !== -1) {
          updatedSessions[idx] = { ...conflict.imported, id: conflict.existing.id };
          overwritten++;
        }
      } else if (conflictMode === 'duplicate') {
        const uniqueName = getUniqueName(conflict.imported.name, takenNames);
        takenNames.add(uniqueName.toLowerCase());
        updatedSessions.push({ ...conflict.imported, id: generateUUID(), name: uniqueName });
        added++;
      }
    }

    await saveSessions(updatedSessions);
    onOpenChange(false);
    showSuccessToast(
      getMessage('importSessionsNotificationTitle'),
      getMessage('importSessionsNotificationMessage', [String(added), String(overwritten)]),
    );
  }, [classification, existingSessions, newSelection, conflictMode, onOpenChange]);

  return (
    <ImportWizardShell<Session, ConflictingSession>
      open={open}
      onOpenChange={onOpenChange}
      icon={Upload}
      title={getMessage('importSessionsTitle')}
      stepDescriptionKeys={['importSessionsStepSourceDescription', 'importSessionsStepReviewDescription']}
      textareaPlaceholder='{"sessions": [{"id": "...", "name": "My Session", ...}]}'
      successCountMessageKey="sessionsFoundCount"
      newGroupTitleKey="newSessionsGroup"
      conflictingGroupTitleKey="conflictingSessionsGroup"
      identicalGroupTitleKey="identicalSessionsGroup"
      countLabelKey="sessionsToImportCount"
      overwriteWarningKey="sessionImportOverwriteWarning"
      state={state}
      renderNewItem={(session) => (
        <SessionRow
          key={session.id}
          session={session}
          checkbox
          checked={newSelection.has(session.id)}
          onToggle={() => newSelection.toggle(session.id)}
        />
      )}
      renderConflictingItem={(conflict) => (
        <ConflictSessionRow key={conflict.imported.id} conflict={conflict} />
      )}
      renderIdenticalItem={(session) => (
        <SessionRow
          key={session.id}
          session={session}
          dimmed
          statusBadge={getMessage('alreadyExists')}
        />
      )}
      onConfirm={executeImport}
    />
  );
}
