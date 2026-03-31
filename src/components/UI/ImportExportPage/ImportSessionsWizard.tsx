import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Dialog, Flex, Button, Checkbox, Text, Separator, Badge, Box,
  ScrollArea, TextArea, SegmentedControl, Popover, Callout
} from '@radix-ui/themes';
import { Upload, FileUp, CheckCircle, AlertTriangle, XCircle, Eye } from 'lucide-react';
import { z } from 'zod';
import { SessionsTheme } from '../../Form/themes';
import { getMessage } from '../../../utils/i18n';
import { showSuccessNotification } from '../../../utils/notifications';
import { sessionsArraySchema } from '../../../schemas/session';
import {
  classifyImportedSessions,
  type SessionClassification,
  type ConflictingSession,
  type SessionDiff,
  type GroupDiff,
} from '../../../utils/sessionClassification';
import { generateUUID } from '../../../utils/utils';
import { loadSessions, saveSessions } from '../../../utils/sessionStorage';
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

  // Step 0 state
  const [classification, setClassification] = useState<SessionClassification | null>(null);
  const [newSessionSelectedIds, setNewSessionSelectedIds] = useState<Set<string>>(new Set());

  // Step 1 state
  const [conflictMode, setConflictMode] = useState<ConflictMode>('overwrite');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing sessions and reset state when dialog opens
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

  // Re-classify when parsed sessions or existing sessions change
  useEffect(() => {
    if (parsedSessions && existingSessions.length >= 0) {
      const result = classifyImportedSessions(parsedSessions, existingSessions);
      setClassification(result);
      setNewSessionSelectedIds(new Set(result.newSessions.map(s => s.id)));
    } else {
      setClassification(null);
      setNewSessionSelectedIds(new Set());
    }
  }, [parsedSessions, existingSessions]);

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
        const messages = error.issues.map(issue => {
          const path = issue.path.join('.');
          return `${path}: ${issue.message}`;
        });
        setParseError(messages.join('\n'));
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
    if (file && file.name.endsWith('.json')) {
      handleFileRead(file);
    }
  }, [handleFileRead]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  }, [handleFileRead]);

  const toggleNewSession = useCallback((id: string) => {
    setNewSessionSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Import count (step 0: all conflicting counted; step 1: depends on mode)
  const importCountStep0 = useMemo(() => {
    if (!classification) return 0;
    return (
      classification.newSessions.filter(s => newSessionSelectedIds.has(s.id)).length +
      classification.conflictingSessions.length
    );
  }, [classification, newSessionSelectedIds]);

  const importCountStep1 = useMemo(() => {
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

    // Add selected new sessions
    for (const session of classification.newSessions) {
      if (newSessionSelectedIds.has(session.id)) {
        updatedSessions.push(session);
        takenNames.add(session.name.toLowerCase());
        added++;
      }
    }

    // Handle conflicts
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
      // 'ignore': do nothing
    }

    await saveSessions(updatedSessions);
    onOpenChange(false);
    showSuccessNotification(
      getMessage('importSessionsNotificationTitle'),
      getMessage('importSessionsNotificationMessage', [String(added), String(overwritten)]),
    );
  }, [classification, existingSessions, newSessionSelectedIds, conflictMode, onOpenChange]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
      return iso;
    }
  };

  const getTabCount = (session: Session) =>
    session.groups.reduce((sum, g) => sum + g.tabs.length, 0) + session.ungroupedTabs.length;

  const getGroupLabel = (count: number) =>
    count === 1 ? getMessage('sessionGroupOne') : getMessage('sessionGroupCount').replace('$1', String(count));

  const getTabLabel = (count: number) =>
    count === 1 ? getMessage('sessionTabOne') : getMessage('sessionTabCount').replace('$1', String(count));

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

          {/* Step 0: Source + inline classification */}
          {step === 0 && (
            <Box mt="4">
              <SegmentedControl.Root
                value={sourceMode}
                onValueChange={(v: string) => setSourceMode(v as 'file' | 'text')}
                size="2"
              >
                <SegmentedControl.Item value="file">
                  {getMessage('sourceFile')}
                </SegmentedControl.Item>
                <SegmentedControl.Item value="text">
                  {getMessage('sourceText')}
                </SegmentedControl.Item>
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
                      <Text size="2" color="gray">
                        {getMessage('dragDropZone')}
                      </Text>
                      <Button variant="soft" size="1" onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleBrowse(); }}>
                        {getMessage('browse')}
                      </Button>
                      {fileName && (
                        <Text size="1" color="gray" mt="1">{fileName}</Text>
                      )}
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

              {/* Validation feedback */}
              {parseError && (
                <Callout.Root color="red" variant="soft" mt="3">
                  <Callout.Icon>
                    <XCircle size={16} />
                  </Callout.Icon>
                  <Callout.Text style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                    {parseError}
                  </Callout.Text>
                </Callout.Root>
              )}

              {parsedSessions && !classification && (
                <Callout.Root color="green" variant="soft" mt="3">
                  <Callout.Icon>
                    <CheckCircle size={16} />
                  </Callout.Icon>
                  <Callout.Text>
                    {getMessage('sessionsFoundCount').replace('{count}', String(parsedSessions.length))}
                  </Callout.Text>
                </Callout.Root>
              )}

              {/* Inline classification */}
              {classification && (
                <Box mt="4">
                  <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: '40vh' }}>
                    <Flex direction="column" gap="3" pr="3">
                      {/* New sessions */}
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
                                formatDate={formatDate}
                                getGroupLabel={getGroupLabel}
                                getTabLabel={getTabLabel}
                                getTabCount={getTabCount}
                              />
                            ))}
                          </Flex>
                        </>
                      )}

                      {/* Conflicting sessions */}
                      {classification.conflictingSessions.length > 0 && (
                        <>
                          {classification.newSessions.length > 0 && <Separator size="4" />}
                          <Text size="3" weight="bold">
                            {getMessage('conflictingSessionsGroup').replace('{count}', String(classification.conflictingSessions.length))}
                          </Text>
                          <Flex direction="column" gap="2">
                            {classification.conflictingSessions.map(conflict => (
                              <ConflictSessionRow
                                key={conflict.imported.id}
                                conflict={conflict}
                                formatDate={formatDate}
                                getGroupLabel={getGroupLabel}
                                getTabLabel={getTabLabel}
                                getTabCount={getTabCount}
                              />
                            ))}
                          </Flex>
                        </>
                      )}

                      {/* Identical sessions */}
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
                                formatDate={formatDate}
                                getGroupLabel={getGroupLabel}
                                getTabLabel={getTabLabel}
                                getTabCount={getTabCount}
                              />
                            ))}
                          </Flex>
                        </>
                      )}
                    </Flex>
                  </ScrollArea>

                  <Text size="2" color="gray" mt="3">
                    {getMessage('sessionsToImportCount').replace('{count}', String(importCountStep0))}
                  </Text>
                </Box>
              )}
            </Box>
          )}

          {/* Step 1: Conflict resolution + confirmation */}
          {step === 1 && classification && (
            <Box mt="4">
              {hasConflicts && (
                <Box mb="4">
                  <Flex align="center" gap="2" mb="3">
                    <Text size="2" color="gray">{getMessage('conflictResolutionMode')}</Text>
                    <SegmentedControl.Root
                      value={conflictMode}
                      onValueChange={(v: string) => setConflictMode(v as ConflictMode)}
                      size="1"
                    >
                      <SegmentedControl.Item value="overwrite">
                        {getMessage('conflictModeOverwrite')}
                      </SegmentedControl.Item>
                      <SegmentedControl.Item value="duplicate">
                        {getMessage('conflictModeDuplicate')}
                      </SegmentedControl.Item>
                      <SegmentedControl.Item value="ignore">
                        {getMessage('conflictModeIgnore')}
                      </SegmentedControl.Item>
                    </SegmentedControl.Root>
                  </Flex>

                  {conflictMode === 'overwrite' && (
                    <Callout.Root color="orange" variant="soft" mt="3">
                      <Callout.Icon>
                        <AlertTriangle size={16} />
                      </Callout.Icon>
                      <Callout.Text>
                        {getMessage('sessionImportOverwriteWarning')}
                      </Callout.Text>
                    </Callout.Root>
                  )}
                </Box>
              )}

              <Text size="2" color="gray">
                {getMessage('sessionsToImportCount').replace('{count}', String(importCountStep1))}
              </Text>
            </Box>
          )}

          <Separator size="4" mt="4" style={{ opacity: 0.3 }} />

          {/* Footer */}
          <Flex gap="3" justify="end" mt="3">
            {step === 0 && (
              <>
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    {getMessage('cancel')}
                  </Button>
                </Dialog.Close>
                <Button
                  onClick={() => setStep(1)}
                  disabled={!parsedSessions || importCountStep0 === 0}
                >
                  {getMessage('next')}
                </Button>
              </>
            )}
            {step === 1 && (
              <>
                <Button variant="soft" color="gray" onClick={() => setStep(0)}>
                  {getMessage('previous')}
                </Button>
                <Button onClick={executeImport} disabled={importCountStep1 === 0}>
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

// --- Sub-components ---

interface SessionRowProps {
  session: Session;
  checkbox?: boolean;
  checked?: boolean;
  onToggle?: () => void;
  dimmed?: boolean;
  statusBadge?: string;
  formatDate: (iso: string) => string;
  getGroupLabel: (count: number) => string;
  getTabLabel: (count: number) => string;
  getTabCount: (session: Session) => number;
}

function SessionRow({
  session,
  checkbox,
  checked,
  onToggle,
  dimmed,
  statusBadge,
  formatDate,
  getGroupLabel,
  getTabLabel,
  getTabCount,
}: SessionRowProps) {
  const tabCount = getTabCount(session);
  const groupCount = session.groups.length;

  return (
    <Flex
      align="center"
      gap="3"
      p="2"
      style={{
        borderRadius: 'var(--radius-2)',
        backgroundColor: 'var(--gray-a2)',
        opacity: dimmed ? 0.6 : 1,
      }}
    >
      {checkbox && (
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          aria-label={session.name}
        />
      )}
      <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Text size="2" weight="medium">{session.name}</Text>
        <Text size="1" color="gray">
          {formatDate(session.createdAt)} · {getGroupLabel(groupCount)} · {getTabLabel(tabCount)}
        </Text>
      </Flex>
      {session.isPinned && (
        <Badge color="indigo" variant="soft" size="1">
          {getMessage('pinnedBadge')}
        </Badge>
      )}
      {statusBadge && (
        <Badge color="gray" variant="outline" size="1">
          {statusBadge}
        </Badge>
      )}
    </Flex>
  );
}

interface ConflictSessionRowProps {
  conflict: ConflictingSession;
  formatDate: (iso: string) => string;
  getGroupLabel: (count: number) => string;
  getTabLabel: (count: number) => string;
  getTabCount: (session: Session) => number;
}

function ConflictSessionRow({
  conflict,
  formatDate,
  getGroupLabel,
  getTabLabel,
  getTabCount,
}: ConflictSessionRowProps) {
  const session = conflict.imported;
  const tabCount = getTabCount(session);
  const groupCount = session.groups.length;

  return (
    <Flex
      align="center"
      gap="3"
      p="2"
      style={{
        borderRadius: 'var(--radius-2)',
        backgroundColor: 'var(--orange-a2)',
      }}
    >
      <AlertTriangle size={16} style={{ color: 'var(--orange-9)', flexShrink: 0 }} aria-hidden="true" />
      <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Text size="2" weight="medium">{session.name}</Text>
        <Text size="1" color="gray">
          {formatDate(session.createdAt)} · {getGroupLabel(groupCount)} · {getTabLabel(tabCount)}
        </Text>
      </Flex>
      {session.isPinned && (
        <Badge color="indigo" variant="soft" size="1">
          {getMessage('pinnedBadge')}
        </Badge>
      )}
      <Popover.Root>
        <Popover.Trigger>
          <Button variant="ghost" size="1" aria-label={getMessage('viewDiff')} title={getMessage('viewDiff')}>
            <Eye size={14} aria-hidden="true" />
          </Button>
        </Popover.Trigger>
        <Popover.Content style={{ maxWidth: 380 }}>
          <Text size="3" weight="bold" mb="2">
            {getMessage('differences')} — {session.name}
          </Text>
          <SessionDiffView diff={conflict.diff} />
        </Popover.Content>
      </Popover.Root>
    </Flex>
  );
}

interface SessionDiffViewProps {
  diff: SessionDiff;
}

function SessionDiffView({ diff }: SessionDiffViewProps) {
  const hasContent =
    diff.isPinned !== undefined ||
    diff.categoryId !== undefined ||
    diff.groupsAdded.length > 0 ||
    diff.groupsRemoved.length > 0 ||
    diff.groupsChanged.length > 0 ||
    diff.ungroupedTabsAdded.length > 0 ||
    diff.ungroupedTabsRemoved.length > 0;

  if (!hasContent) return null;

  return (
    <Flex direction="column" gap="3">
      {diff.isPinned !== undefined && (
        <Box>
          <Text size="2" weight="medium" mb="1">isPinned</Text>
          <Flex direction="column" gap="1">
            <Flex align="center" gap="2">
              <Badge color="red" variant="soft" size="1">{getMessage('currentValue')}</Badge>
              <Text size="1">{String(diff.isPinned.current)}</Text>
            </Flex>
            <Flex align="center" gap="2">
              <Badge color="green" variant="soft" size="1">{getMessage('importedValue')}</Badge>
              <Text size="1">{String(diff.isPinned.imported)}</Text>
            </Flex>
          </Flex>
        </Box>
      )}

      {diff.categoryId !== undefined && (
        <Box>
          <Text size="2" weight="medium" mb="1">categoryId</Text>
          <Flex direction="column" gap="1">
            <Flex align="center" gap="2">
              <Badge color="red" variant="soft" size="1">{getMessage('currentValue')}</Badge>
              <Text size="1">{String(diff.categoryId.current ?? 'null')}</Text>
            </Flex>
            <Flex align="center" gap="2">
              <Badge color="green" variant="soft" size="1">{getMessage('importedValue')}</Badge>
              <Text size="1">{String(diff.categoryId.imported ?? 'null')}</Text>
            </Flex>
          </Flex>
        </Box>
      )}

      {diff.groupsAdded.length > 0 && (
        <Box>
          <Text size="2" weight="medium" mb="1">Groups added</Text>
          {diff.groupsAdded.map(title => (
            <Text key={title} size="1" color="green" as="p">{title}</Text>
          ))}
        </Box>
      )}

      {diff.groupsRemoved.length > 0 && (
        <Box>
          <Text size="2" weight="medium" mb="1">Groups removed</Text>
          {diff.groupsRemoved.map(title => (
            <Text key={title} size="1" color="red" as="p">{title}</Text>
          ))}
        </Box>
      )}

      {diff.groupsChanged.map(groupDiff => (
        <GroupDiffView key={groupDiff.title} groupDiff={groupDiff} />
      ))}

      {(diff.ungroupedTabsAdded.length > 0 || diff.ungroupedTabsRemoved.length > 0) && (
        <Box>
          <Text size="2" weight="medium" mb="1">Ungrouped tabs</Text>
          {diff.ungroupedTabsAdded.map(url => (
            <Text key={url} size="1" color="green" as="p" style={{ wordBreak: 'break-all' }}>+ {url}</Text>
          ))}
          {diff.ungroupedTabsRemoved.map(url => (
            <Text key={url} size="1" color="red" as="p" style={{ wordBreak: 'break-all' }}>- {url}</Text>
          ))}
        </Box>
      )}
    </Flex>
  );
}

interface GroupDiffViewProps {
  groupDiff: GroupDiff;
}

function GroupDiffView({ groupDiff }: GroupDiffViewProps) {
  return (
    <Box>
      <Text size="2" weight="medium" mb="1">Group: {groupDiff.title}</Text>
      {groupDiff.colorChanged && (
        <Flex direction="column" gap="1" mb="1">
          <Flex align="center" gap="2">
            <Badge color="red" variant="soft" size="1">{getMessage('currentValue')}</Badge>
            <Text size="1">{groupDiff.colorChanged.current}</Text>
          </Flex>
          <Flex align="center" gap="2">
            <Badge color="green" variant="soft" size="1">{getMessage('importedValue')}</Badge>
            <Text size="1">{groupDiff.colorChanged.imported}</Text>
          </Flex>
        </Flex>
      )}
      {groupDiff.tabsAdded.map(url => (
        <Text key={url} size="1" color="green" as="p" style={{ wordBreak: 'break-all' }}>+ {url}</Text>
      ))}
      {groupDiff.tabsRemoved.map(url => (
        <Text key={url} size="1" color="red" as="p" style={{ wordBreak: 'break-all' }}>- {url}</Text>
      ))}
    </Box>
  );
}
