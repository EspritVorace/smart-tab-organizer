import React, { useState, useCallback, useMemo } from 'react';
import { Box, Button, Dialog } from '@radix-ui/themes';
import { Upload } from 'lucide-react';
import { SessionsTheme } from '@/components/Form/themes';
import { getMessage } from '@/utils/i18n';
import { showSuccessToast } from '@/utils/toast';
import { sessionsArraySchema } from '@/schemas/session';
import { importSessionsDataSchema } from '@/schemas/importExport';
import {
  classifyImportedSessions,
  type SessionClassification,
} from '@/utils/sessionClassification';
import { generateUUID } from '@/utils/utils';
import { loadSessions, saveSessions } from '@/utils/sessionStorage';
import { SessionRow, ConflictSessionRow } from './SessionImportRows';
import type { Session } from '@/types/session';
import { WizardModal } from '@/components/UI/WizardModal';
import { useDialogReset } from './Shared';
import { SourceStep, ImportedNoteCallout, useJsonSourceInput } from './Source';
import {
  useImportClassification,
  ClassificationGroup,
  ClassificationScrollArea,
  ConflictModeSelector,
  ConflictWarningCallout,
  ImportCountLabel,
} from './Classification';

interface ImportSessionsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEP_DESCRIPTION_KEYS = [
  'importSessionsStepSourceDescription',
  'importSessionsStepReviewDescription',
] as const;

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

export function ImportSessionsWizard({ open, onOpenChange }: ImportSessionsWizardProps) {
  const [step, setStep] = useState(0);
  const source = useJsonSourceInput<Session[]>(validateSessionsPayload);
  const [existingSessions, setExistingSessions] = useState<Session[]>([]);

  const classificationState = useImportClassification<SessionClassification>();
  const { classification, conflictMode, newSelection: newSessionSelection } = classificationState;

  useDialogReset(open, () => {
    loadSessions().then((loaded) => setExistingSessions(loaded));
    setStep(0);
    source.reset();
    classificationState.reset();
  });

  const goToStep1 = useCallback(() => {
    if (!source.parsedData) return;
    const result = classifyImportedSessions(source.parsedData, existingSessions);
    classificationState.setClassification(result);
    newSessionSelection.setAll(result.newSessions.map((s) => s.id));
    setStep(1);
  }, [source.parsedData, existingSessions, classificationState, newSessionSelection]);

  const importCount = useMemo(() => {
    if (!classification) return 0;
    const newCount = classification.newSessions.filter(s => newSessionSelection.has(s.id)).length;
    const conflictCount = conflictMode === 'ignore' ? 0 : classification.conflictingSessions.length;
    return newCount + conflictCount;
  }, [classification, newSessionSelection, conflictMode]);

  const executeImport = useCallback(async () => {
    if (!classification) return;

    const updatedSessions = [...existingSessions];
    let added = 0;
    let overwritten = 0;

    const takenNames = new Set<string>(existingSessions.map(s => s.name.toLowerCase()));

    for (const session of classification.newSessions) {
      if (newSessionSelection.has(session.id)) {
        updatedSessions.push(session);
        takenNames.add(session.name.toLowerCase());
        added++;
      }
    }

    for (const conflict of classification.conflictingSessions) {
      if (conflictMode === 'overwrite') {
        const idx = updatedSessions.findIndex(
          s => s.name.toLowerCase() === conflict.existing.name.toLowerCase()
        );
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
  }, [classification, existingSessions, newSessionSelection, conflictMode, onOpenChange]);

  const hasConflicts = (classification?.conflictingSessions.length ?? 0) > 0;

  return (
    <SessionsTheme>
      <WizardModal
        open={open}
        onOpenChange={onOpenChange}
        icon={Upload}
        title={getMessage('importSessionsTitle')}
        description={getMessage(STEP_DESCRIPTION_KEYS[step])}
      >
        <WizardModal.Body>
          {step === 0 && (
            <SourceStep
              source={source}
              textareaPlaceholder='{"sessions": [{"id": "...", "name": "My Session", ...}]}'
              successCountMessageKey="sessionsFoundCount"
            />
          )}

          {step === 1 && classification && (
            <Box>
              <ImportedNoteCallout note={source.importedNote} />
              <ClassificationScrollArea>
                <ClassificationGroup
                  titleKey="newSessionsGroup"
                  items={classification.newSessions}
                  renderItem={(session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      checkbox
                      checked={newSessionSelection.has(session.id)}
                      onToggle={() => newSessionSelection.toggle(session.id)}
                    />
                  )}
                />
                <ClassificationGroup
                  titleKey="conflictingSessionsGroup"
                  items={classification.conflictingSessions}
                  showSeparator={classification.newSessions.length > 0}
                  beforeList={
                    <ConflictModeSelector
                      value={conflictMode}
                      onChange={classificationState.setConflictMode}
                    />
                  }
                  renderItem={(conflict) => (
                    <ConflictSessionRow key={conflict.imported.id} conflict={conflict} />
                  )}
                />
                <ClassificationGroup
                  titleKey="identicalSessionsGroup"
                  items={classification.identicalSessions}
                  showSeparator={
                    classification.newSessions.length > 0
                    || classification.conflictingSessions.length > 0
                  }
                  renderItem={(session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      dimmed
                      statusBadge={getMessage('alreadyExists')}
                    />
                  )}
                />
              </ClassificationScrollArea>

              <ImportCountLabel messageKey="sessionsToImportCount" count={importCount} />
              <ConflictWarningCallout
                when={hasConflicts && conflictMode === 'overwrite'}
                messageKey="sessionImportOverwriteWarning"
              />
            </Box>
          )}
        </WizardModal.Body>

        <WizardModal.Footer>
          {step === 0 && (
            <>
              <Dialog.Close>
                <Button variant="soft" color="gray">{getMessage('cancel')}</Button>
              </Dialog.Close>
              <Button onClick={goToStep1} disabled={!source.parsedData}>
                {getMessage('next')}
              </Button>
            </>
          )}
          {step === 1 && (
            <>
              <Button variant="soft" color="gray" onClick={() => setStep(0)}>
                {getMessage('previous')}
              </Button>
              <Button onClick={executeImport} disabled={importCount === 0}>
                {getMessage('confirmImport')}
              </Button>
            </>
          )}
        </WizardModal.Footer>
      </WizardModal>
    </SessionsTheme>
  );
}
