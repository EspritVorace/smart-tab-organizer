import React, { useState, useCallback, useMemo } from 'react';
import { Dialog, Flex, Button, Checkbox, Text, Separator, Box, ScrollArea, TextArea } from '@radix-ui/themes';
import { FileDown, ClipboardCopy, Pin, Archive } from 'lucide-react';
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
  splitByPinned,
} from '../../../utils/sessionUtils';
import type { Session } from '../../../types/session';
import { WizardDialogTitle, useDialogReset, useToggleSet } from './Shared';

interface ExportSessionsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportSessionsWizard({ open, onOpenChange }: ExportSessionsWizardProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const selection = useToggleSet<string>();
  const [exportNote, setExportNote] = useState('');

  useDialogReset(open, () => {
    loadSessions().then(loaded => {
      setSessions(loaded);
      selection.setAll(loaded.map(s => s.id));
    });
    setExportNote('');
  });

  const selectAll = useCallback(() => {
    selection.setAll(sessions.map(s => s.id));
  }, [sessions, selection]);

  const { pinned: pinnedSessions, unpinned: unpinnedSessions } = useMemo(
    () => splitByPinned(sessions),
    [sessions],
  );

  const toggleGroupSelection = useCallback((group: Session[]) => {
    const allSelected = group.every(s => selection.has(s.id));
    const nextIds = new Set(selection.ids);
    if (allSelected) {
      group.forEach(s => nextIds.delete(s.id));
    } else {
      group.forEach(s => nextIds.add(s.id));
    }
    selection.setAll(nextIds);
  }, [selection]);

  const getGroupCheckedState = useCallback((group: Session[]): boolean | 'indeterminate' => {
    if (group.length === 0) return false;
    const selectedCount = group.filter(s => selection.has(s.id)).length;
    if (selectedCount === 0) return false;
    if (selectedCount === group.length) return true;
    return 'indeterminate';
  }, [selection]);

  const selectedSessions = sessions.filter(s => selection.has(s.id));

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
          <WizardDialogTitle
            icon={FileDown}
            titleKey="exportSessionsTitle"
            descriptionKey="exportSessionsDescription"
          />

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
              <Button variant="soft" size="1" color="gray" onClick={selection.clearAll}>
                {getMessage('deselectAll')}
              </Button>
            </Flex>

            <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: '40vh' }}>
              <Flex direction="column" gap="2" pr="3">
                {pinnedSessions.length > 0 && (
                  <Box>
                    <Flex align="center" justify="between" mb="2">
                      <Flex align="center" gap="1">
                        <Pin size={14} aria-hidden="true" style={{ color: 'var(--accent-9)' }} />
                        <Text size="2" weight="bold">{getMessage('pinnedSessionsSection')}</Text>
                      </Flex>
                      <Checkbox
                        checked={getGroupCheckedState(pinnedSessions)}
                        onCheckedChange={() => toggleGroupSelection(pinnedSessions)}
                        aria-label={getMessage('pinnedSessionsSection')}
                      />
                    </Flex>
                    <Flex direction="column" gap="2">
                      {pinnedSessions.map(session => (
                        <ExportSessionRow
                          key={session.id}
                          session={session}
                          checked={selection.has(session.id)}
                          onToggle={() => selection.toggle(session.id)}
                        />
                      ))}
                    </Flex>
                  </Box>
                )}

                {pinnedSessions.length > 0 && unpinnedSessions.length > 0 && (
                  <Separator size="4" my="1" />
                )}

                {unpinnedSessions.length > 0 && (
                  <Box>
                    <Flex align="center" justify="between" mb="2">
                      <Flex align="center" gap="1">
                        <Archive size={14} aria-hidden="true" style={{ color: 'var(--accent-9)' }} />
                        <Text size="2" weight="bold">{getMessage('sessionsSection')}</Text>
                      </Flex>
                      <Checkbox
                        checked={getGroupCheckedState(unpinnedSessions)}
                        onCheckedChange={() => toggleGroupSelection(unpinnedSessions)}
                        aria-label={getMessage('sessionsSection')}
                      />
                    </Flex>
                    <Flex direction="column" gap="2">
                      {unpinnedSessions.map(session => (
                        <ExportSessionRow
                          key={session.id}
                          session={session}
                          checked={selection.has(session.id)}
                          onToggle={() => selection.toggle(session.id)}
                        />
                      ))}
                    </Flex>
                  </Box>
                )}
              </Flex>
            </ScrollArea>

            <Text size="2" color="gray" mt="3">
              {getMessage('sessionsSelectedCount').replace('{count}', String(selection.size))}
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
              disabled={selection.size === 0}
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

function ExportSessionRow({ session, checked, onToggle }: { session: Session; checked: boolean; onToggle: () => void }) {
  const tabCount = countSessionTabs(session);
  const groupCount = session.groups.length;
  return (
    <Flex
      align="center"
      gap="3"
      p="2"
      style={{
        borderRadius: 'var(--radius-2)',
        backgroundColor: 'var(--gray-a2)',
      }}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        aria-label={session.name}
      />
      <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Text size="2" weight="medium">{session.name}</Text>
        <Text size="1" color="gray">
          {formatSessionDateShort(session.createdAt)} · {getSessionGroupLabel(groupCount)} · {getSessionTabLabel(tabCount)}
        </Text>
      </Flex>
    </Flex>
  );
}
