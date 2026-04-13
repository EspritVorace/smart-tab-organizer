import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, Flex, Button, Checkbox, Text, Separator, Badge, Box, ScrollArea, TextArea } from '@radix-ui/themes';
import { FileDown, ClipboardCopy } from 'lucide-react';
import { SessionsTheme } from '../../Form/themes';
import { SplitButton } from '../SplitButton/SplitButton';
import { getMessage } from '../../../utils/i18n';
import { showSuccessNotification } from '../../../utils/notifications';
import { loadSessions } from '../../../utils/sessionStorage';
import {
  formatSessionDateShort,
  getSessionGroupLabel,
  getSessionTabLabel,
  countSessionTabs,
} from '../../../utils/sessionUtils';
import type { Session } from '../../../types/session';

interface ExportSessionsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportSessionsWizard({ open, onOpenChange }: ExportSessionsWizardProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportNote, setExportNote] = useState('');

  // Load sessions and reset state when dialog opens
  useEffect(() => {
    if (open) {
      loadSessions().then(loaded => {
        setSessions(loaded);
        setSelectedIds(new Set(loaded.map(s => s.id)));
      });
      setExportNote('');
    }
  }, [open]);

  const toggleSession = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(sessions.map(s => s.id)));
  }, [sessions]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedSessions = sessions.filter(s => selectedIds.has(s.id));

  const getExportJson = useCallback(() => {
    const exportData: { note?: string; sessions: Session[] } = { sessions: selectedSessions };
    if (exportNote.trim()) exportData.note = exportNote.trim();
    return JSON.stringify(exportData, null, 2);
  }, [selectedSessions, exportNote]);

  const handleExportToFile = useCallback(async () => {
    const json = getExportJson();
    const count = selectedSessions.length;

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: 'smarttab_organizer_sessions.json',
          types: [{
            description: 'JSON',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        onOpenChange(false);
        showSuccessNotification(
          getMessage('exportSessionsNotificationTitle'),
          getMessage('exportSessionsNotificationMessage').replace('$1', String(count)),
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        throw err;
      }
      return;
    }

    // Fallback for Firefox / older browsers
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smarttab_organizer_sessions.json';
    a.click();
    URL.revokeObjectURL(url);
    onOpenChange(false);
    showSuccessNotification(
      getMessage('exportSessionsNotificationTitle'),
      getMessage('exportSessionsNotificationMessage').replace('$1', String(count)),
    );
  }, [getExportJson, selectedSessions.length, onOpenChange]);

  const handleExportToClipboard = useCallback(async () => {
    const json = getExportJson();
    const count = selectedSessions.length;
    await navigator.clipboard.writeText(json);
    onOpenChange(false);
    showSuccessNotification(
      getMessage('exportSessionsNotificationTitle'),
      getMessage('exportSessionsNotificationMessage').replace('$1', String(count)),
    );
  }, [getExportJson, selectedSessions.length, onOpenChange]);

  return (
    <SessionsTheme>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ maxWidth: 550 }}>
          <Dialog.Title>
            <Flex align="center" gap="2">
              <FileDown size={18} aria-hidden="true" />
              {getMessage('exportSessionsTitle')}
            </Flex>
          </Dialog.Title>
          <Dialog.Description size="2" color="gray">
            {getMessage('exportSessionsDescription')}
          </Dialog.Description>

          <Separator size="4" mt="3" style={{ opacity: 0.3 }} />

          <Box mt="4">
            <Box mb="4">
              <Text as="label" size="2" weight="medium">
                {getMessage('exportNoteLabel')}
              </Text>
              <TextArea
                mt="1"
                value={exportNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExportNote(e.target.value)}
                placeholder={getMessage('exportNotePlaceholder')}
                rows={2}
              />
            </Box>

            <Flex gap="2" mb="3">
              <Button variant="soft" size="1" onClick={selectAll}>
                {getMessage('selectAll')}
              </Button>
              <Button variant="soft" size="1" color="gray" onClick={deselectAll}>
                {getMessage('deselectAll')}
              </Button>
            </Flex>

            <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: '40vh' }}>
              <Flex direction="column" gap="2" pr="3">
                {sessions.map(session => {
                  const tabCount = countSessionTabs(session);
                  const groupCount = session.groups.length;
                  return (
                    <Flex
                      key={session.id}
                      align="center"
                      gap="3"
                      p="2"
                      style={{
                        borderRadius: 'var(--radius-2)',
                        backgroundColor: 'var(--gray-a2)',
                      }}
                    >
                      <Checkbox
                        checked={selectedIds.has(session.id)}
                        onCheckedChange={() => toggleSession(session.id)}
                        aria-label={session.name}
                      />
                      <Flex direction="column" gap="1" style={{ flex: 1 }}>
                        <Text size="2" weight="medium">{session.name}</Text>
                        <Text size="1" color="gray">
                          {formatSessionDateShort(session.createdAt)} · {getSessionGroupLabel(groupCount)} · {getSessionTabLabel(tabCount)}
                        </Text>
                      </Flex>
                      {session.isPinned && (
                        <Badge color="indigo" variant="soft" size="1">
                          {getMessage('pinnedBadge')}
                        </Badge>
                      )}
                    </Flex>
                  );
                })}
              </Flex>
            </ScrollArea>

            <Text size="2" color="gray" mt="3">
              {getMessage('sessionsSelectedCount').replace('{count}', String(selectedIds.size))}
            </Text>
          </Box>

          <Separator size="4" mt="4" style={{ opacity: 0.3 }} />

          <Flex gap="3" justify="end" mt="3">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                {getMessage('cancel')}
              </Button>
            </Dialog.Close>
            <SplitButton
              label={getMessage('exportSessionsButton')}
              onClick={handleExportToFile}
              ariaLabel={getMessage('exportOptions')}
              disabled={selectedIds.size === 0}
              menuItems={[
                {
                  label: getMessage('exportToFile'),
                  icon: <FileDown size={14} aria-hidden="true" />,
                  onClick: handleExportToFile,
                },
                {
                  label: getMessage('exportToClipboard'),
                  icon: <ClipboardCopy size={14} aria-hidden="true" />,
                  onClick: handleExportToClipboard,
                },
              ]}
            />
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </SessionsTheme>
  );
}
