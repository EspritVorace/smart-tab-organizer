import React, { useCallback, useEffect, useState } from 'react';
import { Button, Checkbox, Dialog, Flex, Text, TextArea } from '@radix-ui/themes';
import { Download } from 'lucide-react';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext.js';
import { collectWorkspaceExport } from '@/utils/workspaceImportExport.js';
import { useExportActions } from '@/components/UI/ImportExportWizards/Export';
import { getMessage } from '@/utils/i18n.js';
import { logger } from '@/utils/logger.js';
import type { WorkspaceExportPayload } from '@/utils/workspaceImportExport.js';

interface ExportWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_PAYLOAD: WorkspaceExportPayload = {
  workspace: { name: '', accentColor: 'indigo' },
  settings: {
    globalGroupingEnabled: true,
    globalDeduplicationEnabled: true,
    deduplicateUnmatchedDomains: false,
    deduplicationKeepStrategy: 'keep-grouped-or-new',
    notifyOnGrouping: true,
    notifyOnDeduplication: true,
  },
  domainRules: [],
  categories: [],
  sessions: [],
};

function defaultFilename(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'workspace';
  return `smarttab_organizer_workspace_${slug}.json`;
}

export function ExportWorkspaceDialog({ open, onOpenChange }: ExportWorkspaceDialogProps) {
  const { active } = useActiveWorkspaceContext();
  const [note, setNote] = useState('');
  const [includeStatistics, setIncludeStatistics] = useState(false);
  const [payload, setPayload] = useState<WorkspaceExportPayload>(EMPTY_PAYLOAD);

  useEffect(() => {
    if (!open) return;
    setNote('');
    setIncludeStatistics(false);
    setPayload(EMPTY_PAYLOAD);
  }, [open]);

  useEffect(() => {
    if (!open || !active) return;
    let cancelled = false;
    collectWorkspaceExport(active, { includeStatistics, note })
      .then((next) => { if (!cancelled) setPayload(next); })
      .catch((error) => logger.error('[ExportWorkspaceDialog] collect failed:', error));
    return () => { cancelled = true; };
  }, [open, active, includeStatistics, note]);

  const buildJson = useCallback(() => JSON.stringify(payload, null, 2), [payload]);

  const actions = useExportActions({
    filename: defaultFilename(active?.name ?? 'workspace'),
    notifyTitleKey: 'workspaceExportSuccessTitle',
    notifyMessage: 'workspaceExportSuccessMessage',
    selected: [payload],
    note,
    buildJson,
    onFinish: () => onOpenChange(false),
  });

  const ruleCount = payload.domainRules.length;
  const sessionCount = payload.sessions.length;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content data-testid="workspace-export-dialog" maxWidth="520px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Download size={18} />
            {getMessage('workspaceExportTitle')}
          </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" mb="3">
          {getMessage('workspaceExportDescription', [active?.name ?? ''])}
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">{getMessage('workspaceExportSummary')}</Text>
            <Text size="2" color="gray">
              {getMessage('workspaceExportSummaryRules', [String(ruleCount)])}
              {' · '}
              {getMessage('workspaceExportSummarySessions', [String(sessionCount)])}
            </Text>
          </Flex>

          <Flex direction="column" gap="1">
            <Text as="label" size="2" htmlFor="workspace-export-note">
              {getMessage('workspaceExportNoteLabel')}
            </Text>
            <TextArea
              id="workspace-export-note"
              data-testid="workspace-export-note"
              value={note}
              onChange={(e) => setNote(e.currentTarget.value)}
              placeholder={getMessage('workspaceExportNotePlaceholder')}
              rows={2}
            />
          </Flex>

          <Flex align="center" gap="2" asChild>
            <Text as="label" size="2">
              <Checkbox
                data-testid="workspace-export-stats"
                checked={includeStatistics}
                onCheckedChange={(checked) => setIncludeStatistics(checked === true)}
              />
              {getMessage('workspaceExportIncludeStats')}
            </Text>
          </Flex>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" data-testid="workspace-export-btn-cancel">
              {getMessage('cancel')}
            </Button>
          </Dialog.Close>
          <Button
            variant="soft"
            data-testid="workspace-export-btn-clipboard"
            onClick={() => { actions.exportToClipboard().catch((e) => logger.error('[ExportWorkspaceDialog] clipboard:', e)); }}
          >
            {getMessage('workspaceExportBtnClipboard')}
          </Button>
          <Button
            data-testid="workspace-export-btn-file"
            onClick={() => { actions.exportToFile().catch((e) => logger.error('[ExportWorkspaceDialog] file:', e)); }}
          >
            {getMessage('workspaceExportBtnFile')}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
