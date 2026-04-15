import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog, Flex, Button, Text, Separator, Box,
  ScrollArea, SegmentedControl, Callout,
} from '@radix-ui/themes';
import { Upload, AlertTriangle } from 'lucide-react';
import { SessionsTheme } from '../../Form/themes';
import { getMessage } from '../../../utils/i18n';
import { showSuccessNotification } from '../../../utils/notifications';
import { sessionsArraySchema } from '../../../schemas/session';
import { importSessionsDataSchema } from '../../../schemas/importExport';
import {
  classifyImportedSessions,
  type SessionClassification,
} from '../../../utils/sessionClassification';
import { generateUUID } from '../../../utils/utils';
import { loadSessions, saveSessions } from '../../../utils/sessionStorage';
import { SessionRow, ConflictSessionRow } from './SessionImportRows';
import type { Session } from '../../../types/session';
import { WizardDialogTitle, useDialogReset, useToggleSet } from './Shared';
import { SourceStep, ImportedNoteCallout, useJsonSourceInput } from './Source';

type ConflictMode = 'overwrite' | 'duplicate' | 'ignore';

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

export function ImportSessionsWizard({ open, onOpenChange }: ImportSessionsWizardProps) {
  const [step, setStep] = useState(0);
  const source = useJsonSourceInput<Session[]>(validateSessionsPayload);
  const [existingSessions, setExistingSessions] = useState<Session[]>([]);

  const [classification, setClassification] = useState<SessionClassification | null>(null);
  const newSessionSelection = useToggleSet<string>();
  const [conflictMode, setConflictMode] = useState<ConflictMode>('overwrite');

  useDialogReset(open, () => {
    loadSessions().then((loaded) => setExistingSessions(loaded));
    setStep(0);
    source.reset();
    setClassification(null);
    newSessionSelection.clearAll();
    setConflictMode('overwrite');
  });

  const goToStep1 = useCallback(() => {
    if (!source.parsedData) return;
    const result = classifyImportedSessions(source.parsedData, existingSessions);
    setClassification(result);
    newSessionSelection.setAll(result.newSessions.map((s) => s.id));
    setStep(1);
  }, [source.parsedData, existingSessions, newSessionSelection]);

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
    showSuccessNotification(
      getMessage('importSessionsNotificationTitle'),
      getMessage('importSessionsNotificationMessage', [String(added), String(overwritten)]),
    );
  }, [classification, existingSessions, newSessionSelection, conflictMode, onOpenChange]);

  const hasConflicts = (classification?.conflictingSessions.length ?? 0) > 0;

  return (
    <SessionsTheme>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ maxWidth: 600 }}>
          <WizardDialogTitle
            icon={Upload}
            titleKey="importSessionsTitle"
            descriptionKey="importSessionsDescription"
          />

          {/* Step 0: Source */}
          {step === 0 && (
            <SourceStep
              source={source}
              textareaPlaceholder='{"sessions": [{"id": "...", "name": "My Session", ...}]}'
              successCountMessageKey="sessionsFoundCount"
            />
          )}

          {/* Step 1: Classification + conflict resolution */}
          {step === 1 && classification && (
            <Box mt="4">
              <ImportedNoteCallout note={source.importedNote} />
              <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: '50vh' }}>
                <Flex direction="column" gap="3" pr="3">
                  {classification.newSessions.length > 0 && (
                    <>
                      <Text size="3" weight="bold">
                        {getMessage('newSessionsGroup').replace('{count}', String(classification.newSessions.length))}
                      </Text>
                      <Flex direction="column" gap="2">
                        {classification.newSessions.map(session => (
                          <SessionRow
                            key={session.id}
                            session={session}
                            checkbox
                            checked={newSessionSelection.has(session.id)}
                            onToggle={() => newSessionSelection.toggle(session.id)}
                          />
                        ))}
                      </Flex>
                    </>
                  )}

                  {classification.conflictingSessions.length > 0 && (
                    <>
                      {classification.newSessions.length > 0 && <Separator size="4" />}
                      <Text size="3" weight="bold">
                        {getMessage('conflictingSessionsGroup').replace('{count}', String(classification.conflictingSessions.length))}
                      </Text>

                      <Flex align="center" gap="2" mb="1">
                        <Text size="2" color="gray">{getMessage('conflictResolutionMode')}</Text>
                        <SegmentedControl.Root
                          value={conflictMode}
                          onValueChange={(v: string) => setConflictMode(v as ConflictMode)}
                          size="1"
                        >
                          <SegmentedControl.Item value="overwrite">{getMessage('conflictModeOverwrite')}</SegmentedControl.Item>
                          <SegmentedControl.Item value="duplicate">{getMessage('conflictModeDuplicate')}</SegmentedControl.Item>
                          <SegmentedControl.Item value="ignore">{getMessage('conflictModeIgnore')}</SegmentedControl.Item>
                        </SegmentedControl.Root>
                      </Flex>

                      <Flex direction="column" gap="2">
                        {classification.conflictingSessions.map(conflict => (
                          <ConflictSessionRow key={conflict.imported.id} conflict={conflict} />
                        ))}
                      </Flex>
                    </>
                  )}

                  {classification.identicalSessions.length > 0 && (
                    <>
                      {(classification.newSessions.length > 0 || classification.conflictingSessions.length > 0) && (
                        <Separator size="4" />
                      )}
                      <Text size="3" weight="bold">
                        {getMessage('identicalSessionsGroup').replace('{count}', String(classification.identicalSessions.length))}
                      </Text>
                      <Flex direction="column" gap="2">
                        {classification.identicalSessions.map(session => (
                          <SessionRow
                            key={session.id}
                            session={session}
                            dimmed
                            statusBadge={getMessage('alreadyExists')}
                          />
                        ))}
                      </Flex>
                    </>
                  )}
                </Flex>
              </ScrollArea>

              <Text size="2" color="gray" mt="3">
                {getMessage('sessionsToImportCount').replace('{count}', String(importCount))}
              </Text>

              {hasConflicts && conflictMode === 'overwrite' && (
                <Callout.Root color="orange" variant="soft" mt="3">
                  <Callout.Icon><AlertTriangle size={16} /></Callout.Icon>
                  <Callout.Text>{getMessage('sessionImportOverwriteWarning')}</Callout.Text>
                </Callout.Root>
              )}
            </Box>
          )}

          <Separator size="4" mt="4" style={{ opacity: 0.3 }} />

          <Flex gap="3" justify="end" mt="3">
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
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </SessionsTheme>
  );
}
