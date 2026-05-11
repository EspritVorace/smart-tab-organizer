import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, Callout, Checkbox, Dialog, Flex, RadioGroup, Text, TextField } from '@radix-ui/themes';
import { AlertCircle, Upload } from 'lucide-react';
import { importWorkspaceDataSchema, type ImportWorkspaceData } from '@/schemas/importExport.js';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext.js';
import {
  applyWorkspaceImportAsNew,
  applyWorkspaceImportToExisting,
} from '@/utils/workspaceImportExport.js';
import { WizardModal } from '@/components/UI/WizardModal';
import {
  FileDropZone,
  ImportErrorCallout,
  ImportedNoteCallout,
  JsonTextArea,
  SourceModeSegmented,
  useJsonSourceInput,
  type JsonSourceValidationResult,
} from '@/components/UI/ImportExportWizards/Source';
import { useDialogReset } from '@/components/UI/ImportExportWizards/Shared';
import { getMessage } from '@/utils/i18n.js';
import { logger } from '@/utils/logger.js';

type ImportMode = 'new' | 'merge';

interface ImportWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const validateWorkspacePayload = (raw: unknown): JsonSourceValidationResult<ImportWorkspaceData> => {
  const validated = importWorkspaceDataSchema.parse(raw);
  return { data: validated, note: validated.note ?? null };
};

export function ImportWorkspaceDialog({ open, onOpenChange }: ImportWorkspaceDialogProps) {
  const { active } = useActiveWorkspaceContext();
  const source = useJsonSourceInput<ImportWorkspaceData>(validateWorkspacePayload);
  const [mode, setMode] = useState<ImportMode>('new');
  const [includeStatistics, setIncludeStatistics] = useState(false);
  const [nameOverride, setNameOverride] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useDialogReset(open, () => {
    source.reset();
    setMode('new');
    setIncludeStatistics(false);
    setNameOverride('');
    setSubmitting(false);
    setApplyError(null);
  });

  const parsedName = source.parsedData?.workspace.name;
  useEffect(() => {
    if (parsedName) setNameOverride(parsedName);
  }, [parsedName]);

  const handleConfirm = useCallback(async () => {
    if (!source.parsedData) return;
    setSubmitting(true);
    setApplyError(null);
    try {
      if (mode === 'new') {
        await applyWorkspaceImportAsNew(source.parsedData, {
          includeStatistics,
          nameOverride: nameOverride || undefined,
        });
      } else if (active) {
        await applyWorkspaceImportToExisting(active.id, source.parsedData, { includeStatistics });
      }
      onOpenChange(false);
    } catch (error) {
      logger.error('[ImportWorkspaceDialog] apply failed:', error);
      setApplyError(getMessage('workspaceImportErrorApply'));
    } finally {
      setSubmitting(false);
    }
  }, [source.parsedData, mode, includeStatistics, nameOverride, active, onOpenChange]);

  const ready = !!source.parsedData;
  const ruleCount = source.parsedData?.domainRules.length ?? 0;
  const sessionCount = source.parsedData?.sessions.length ?? 0;
  const hasStats = !!source.parsedData?.statistics;

  return (
    <WizardModal
      open={open}
      onOpenChange={onOpenChange}
      icon={Upload}
      title={getMessage('workspaceImportTitle')}
      description={getMessage('workspaceImportDescription')}
      data-testid="workspace-import-dialog"
      maxWidth={560}
    >
      <WizardModal.Body>
        <Box>
          <SourceModeSegmented source={source} />

          <Box mt="3">
            {source.sourceMode === 'file' ? (
              <FileDropZone source={source} />
            ) : (
              <JsonTextArea source={source} placeholder='{"workspace": {...}, ...}' />
            )}
          </Box>

          <ImportErrorCallout source={source} />

          {applyError ? (
            <Callout.Root color="red" variant="soft" mt="3" data-testid="workspace-import-error">
              <Callout.Icon>
                <AlertCircle size={16} />
              </Callout.Icon>
              <Callout.Text>{applyError}</Callout.Text>
            </Callout.Root>
          ) : null}

          <ImportedNoteCallout note={source.importedNote} />

          {ready ? (
            <Flex direction="column" gap="2" mt="3" data-testid="workspace-import-summary">
              <Text size="2" color="gray">
                {getMessage('workspaceImportSummary', [
                  source.parsedData!.workspace.name,
                  String(ruleCount),
                  String(sessionCount),
                ])}
              </Text>

              <RadioGroup.Root value={mode} onValueChange={(v) => setMode(v as ImportMode)}>
                <Flex direction="column" gap="1">
                  <Text as="label" size="2">
                    <Flex align="center" gap="2">
                      <RadioGroup.Item value="new" data-testid="workspace-import-mode-new" />
                      {getMessage('workspaceImportModeNew')}
                    </Flex>
                  </Text>
                  <Text as="label" size="2">
                    <Flex align="center" gap="2">
                      <RadioGroup.Item
                        value="merge"
                        data-testid="workspace-import-mode-merge"
                        disabled={!active}
                      />
                      {getMessage('workspaceImportModeMerge', [active?.name ?? ''])}
                    </Flex>
                  </Text>
                </Flex>
              </RadioGroup.Root>

              {mode === 'new' ? (
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" htmlFor="workspace-import-name-override">
                    {getMessage('workspaceImportNameOverrideLabel')}
                  </Text>
                  <TextField.Root
                    id="workspace-import-name-override"
                    data-testid="workspace-import-name-override"
                    value={nameOverride}
                    onChange={(e) => setNameOverride(e.currentTarget.value)}
                    maxLength={40}
                  />
                </Flex>
              ) : null}

              {hasStats ? (
                <Flex align="center" gap="2" asChild>
                  <Text as="label" size="2">
                    <Checkbox
                      data-testid="workspace-import-include-stats"
                      checked={includeStatistics}
                      onCheckedChange={(checked) => setIncludeStatistics(checked === true)}
                    />
                    {getMessage('workspaceImportIncludeStats')}
                  </Text>
                </Flex>
              ) : null}
            </Flex>
          ) : null}
        </Box>
      </WizardModal.Body>

      <WizardModal.Footer>
        <Dialog.Close>
          <Button variant="soft" color="gray" data-testid="workspace-import-btn-cancel">
            {getMessage('cancel')}
          </Button>
        </Dialog.Close>
        <Button
          data-testid="workspace-import-btn-confirm"
          disabled={!ready || submitting}
          onClick={() => {
            handleConfirm().catch((e) =>
              logger.error('[ImportWorkspaceDialog] confirm:', e),
            );
          }}
        >
          {mode === 'new'
            ? getMessage('workspaceImportBtnNew')
            : getMessage('workspaceImportBtnMerge')}
        </Button>
      </WizardModal.Footer>
    </WizardModal>
  );
}
