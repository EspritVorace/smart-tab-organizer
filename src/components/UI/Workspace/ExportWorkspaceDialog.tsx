import React, { useCallback, useEffect, useState } from 'react';
import { Box, Checkbox, Flex, Text } from '@radix-ui/themes';
import { FileDown } from 'lucide-react';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext.js';
import { collectWorkspaceExport } from '@/utils/workspaceImportExport.js';
import { WizardModal } from '@/components/UI/WizardModal';
import {
  ExportNoteField,
  ExportWizardFooter,
  useExportActions,
} from '@/components/UI/ImportExportWizards/Export';
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
    defaultRestoreAction: 'current',
    notifyOnGrouping: true,
    notifyOnDeduplication: true,
    notifyOnOrganize: true,
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
    <WizardModal
      open={open}
      onOpenChange={onOpenChange}
      icon={FileDown}
      title={getMessage('workspaceExportTitle')}
      description={getMessage('workspaceExportDescription', [active?.name ?? ''])}
      data-testid="workspace-export-dialog"
      maxWidth={520}
    >
      <WizardModal.Body>
        <Box>
          <ExportNoteField
            value={note}
            onChange={setNote}
            data-testid="workspace-export-note"
          />

          <Flex direction="column" gap="1" mb="3">
            <Text size="2" weight="medium">{getMessage('workspaceExportSummary')}</Text>
            <Text size="2" color="gray">
              {getMessage('workspaceExportSummaryRules', [String(ruleCount)])}
              {' · '}
              {getMessage('workspaceExportSummarySessions', [String(sessionCount)])}
            </Text>
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
        </Box>
      </WizardModal.Body>

      <WizardModal.Footer>
        <ExportWizardFooter
          labelKey="workspaceExportTitle"
          actions={actions}
          disabled={false}
          cancelTestId="workspace-export-btn-cancel"
          primaryTestId="workspace-export-btn-file"
          clipboardTestId="workspace-export-btn-clipboard"
        />
      </WizardModal.Footer>
    </WizardModal>
  );
}
