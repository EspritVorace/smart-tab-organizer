import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Dialog, Flex, Button, Text, Separator, Box,
  ScrollArea, TextArea, SegmentedControl, Callout
} from '@radix-ui/themes';
import { Upload, FileUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { z } from 'zod';
import { SessionsTheme } from '../../Form/themes';
import { getMessage } from '../../../utils/i18n';
import { showSuccessNotification } from '../../../utils/notifications';
import { sessionsArraySchema } from '../../../schemas/session';
import {
  classifyImportedSessions,
  type SessionClassification,
} from '../../../utils/sessionClassification';
import { generateUUID } from '../../../utils/utils';
import { loadSessions, saveSessions } from '../../../utils/sessionStorage';
import { SessionRow, ConflictSessionRow } from './SessionImportRows';
import type { Session } from '../../../types/session';

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

export function ImportSessionsWizard({ open, onOpenChange }: ImportSessionsWizardProps) {
  const [step, setStep] = useState(0);
  const [sourceMode, setSourceMode] = useState<'file' | 'text'>('file');
  const [jsonText, setJsonText] = useState('');
  const [parsedSessions, setParsedSessions] = useState<Session[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [existingSessions, setExistingSessions] = useState<Session[]>([]);

  const [classification, setClassification] = useState<SessionClassification | null>(null);
  const [newSessionSelectedIds, setNewSessionSelectedIds] = useState<Set<string>>(new Set());
  const [conflictMode, setConflictMode] = useState<ConflictMode>('overwrite');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      loadSessions().then(loaded => setExistingSessions(loaded));
      setStep(0);
      setSourceMode('file');
      setJsonText('');
      setParsedSessions(null);
      setParseError(null);
      setFileName(null);
      setClassification(null);
      setNewSessionSelectedIds(new Set());
      setConflictMode('overwrite');
    }
  }, [open]);

  const validateJson = useCallback((text: string) => {
    if (!text.trim()) {
      setParsedSessions(null);
      setParseError(null);
      return;
    }
    try {
      const rawData = JSON.parse(text);
      const validated = sessionsArraySchema.parse(rawData);
      setParsedSessions(validated as Session[]);
      setParseError(null);
    } catch (error) {
      setParsedSessions(null);
      if (error instanceof SyntaxError) {
        setParseError(getMessage('invalidJson'));
      } else if (error instanceof z.ZodError) {
        setParseError(error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('\n'));
      } else {
        setParseError(getMessage('errorImportInvalidStructure'));
      }
    }
  }, []);

  const handleFileRead = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setJsonText(text);
      validateJson(text);
    };
    reader.readAsText(file);
  }, [validateJson]);

  const handleTextChange = useCallback((text: string) => {
    setJsonText(text);
    validateJson(text);
  }, [validateJson]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) handleFileRead(file);
  }, [handleFileRead]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleBrowse = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  }, [handleFileRead]);

  const goToStep1 = useCallback(() => {
    if (!parsedSessions) return;
    const result = classifyImportedSessions(parsedSessions, existingSessions);
    setClassification(result);
    setNewSessionSelectedIds(new Set(result.newSessions.map(s => s.id)));
    setStep(1);
  }, [parsedSessions, existingSessions]);

  const toggleNewSession = useCallback((id: string) => {
    setNewSessionSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const importCount = useMemo(() => {
    if (!classification) return 0;
    const newCount = classification.newSessions.filter(s => newSessionSelectedIds.has(s.id)).length;
    const conflictCount = conflictMode === 'ignore' ? 0 : classification.conflictingSessions.length;
    return newCount + conflictCount;
  }, [classification, newSessionSelectedIds, conflictMode]);

  const executeImport = useCallback(async () => {
    if (!classification) return;

    const updatedSessions = [...existingSessions];
    let added = 0;
    let overwritten = 0;

    const takenNames = new Set<string>(existingSessions.map(s => s.name.toLowerCase()));

    for (const session of classification.newSessions) {
      if (newSessionSelectedIds.has(session.id)) {
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
  }, [classification, existingSessions, newSessionSelectedIds, conflictMode, onOpenChange]);

  const hasConflicts = (classification?.conflictingSessions.length ?? 0) > 0;

  return (
    <SessionsTheme>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ maxWidth: 600 }}>
          <Dialog.Title>
            <Flex align="center" gap="2">
              <Upload size={18} aria-hidden="true" />
              {getMessage('importSessionsTitle')}
            </Flex>
          </Dialog.Title>
          <Dialog.Description size="2" color="gray">
            {getMessage('importSessionsDescription')}
          </Dialog.Description>

          <Separator size="4" mt="3" style={{ opacity: 0.3 }} />

          {/* Step 0: Source */}
          {step === 0 && (
            <Box mt="4">
              <SegmentedControl.Root
                value={sourceMode}
                onValueChange={(v: string) => setSourceMode(v as 'file' | 'text')}
                size="2"
              >
                <SegmentedControl.Item value="file">{getMessage('sourceFile')}</SegmentedControl.Item>
                <SegmentedControl.Item value="text">{getMessage('sourceText')}</SegmentedControl.Item>
              </SegmentedControl.Root>

              <Box mt="3">
                {sourceMode === 'file' && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      gap="2"
                      p="5"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      style={{
                        border: `2px dashed ${isDragOver ? 'var(--accent-9)' : 'var(--gray-a6)'}`,
                        borderRadius: 'var(--radius-3)',
                        backgroundColor: isDragOver ? 'var(--accent-a2)' : 'var(--gray-a2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        minHeight: 120,
                      }}
                      onClick={handleBrowse}
                    >
                      <FileUp size={32} style={{ color: 'var(--gray-9)' }} aria-hidden="true" />
                      <Text size="2" color="gray">{getMessage('dragDropZone')}</Text>
                      <Button variant="soft" size="1" onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleBrowse(); }}>
                        {getMessage('browse')}
                      </Button>
                      {fileName && <Text size="1" color="gray" mt="1">{fileName}</Text>}
                    </Flex>
                  </>
                )}

                {sourceMode === 'text' && (
                  <TextArea
                    value={jsonText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleTextChange(e.target.value)}
                    placeholder='[{"id": "...", "name": "My Session", ...}]'
                    rows={8}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                )}
              </Box>

              {parseError && (
                <Callout.Root color="red" variant="soft" mt="3">
                  <Callout.Icon><XCircle size={16} /></Callout.Icon>
                  <Callout.Text style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{parseError}</Callout.Text>
                </Callout.Root>
              )}

              {parsedSessions && (
                <Callout.Root color="green" variant="soft" mt="3">
                  <Callout.Icon><CheckCircle size={16} /></Callout.Icon>
                  <Callout.Text>
                    {getMessage('sessionsFoundCount').replace('{count}', String(parsedSessions.length))}
                  </Callout.Text>
                </Callout.Root>
              )}
            </Box>
          )}

          {/* Step 1: Classification + conflict resolution */}
          {step === 1 && classification && (
            <Box mt="4">
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
                            checked={newSessionSelectedIds.has(session.id)}
                            onToggle={() => toggleNewSession(session.id)}
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
                <Button onClick={goToStep1} disabled={!parsedSessions}>
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
