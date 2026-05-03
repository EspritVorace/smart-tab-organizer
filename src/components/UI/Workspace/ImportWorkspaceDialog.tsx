import React, { useCallback, useEffect, useState } from 'react';
import { Button, Callout, Checkbox, Dialog, Flex, RadioGroup, Text, TextArea, TextField } from '@radix-ui/themes';
import { AlertCircle, Upload, FileUp } from 'lucide-react';
import { importWorkspaceDataSchema, type ImportWorkspaceData } from '@/schemas/importExport.js';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext.js';
import {
  applyWorkspaceImportAsNew,
  applyWorkspaceImportToExisting,
} from '@/utils/workspaceImportExport.js';
import { getMessage } from '@/utils/i18n.js';
import { logger } from '@/utils/logger.js';

type ImportMode = 'new' | 'merge';

interface ImportWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedState {
  status: 'idle' | 'parsing' | 'ready' | 'error';
  data?: ImportWorkspaceData;
  errorMessage?: string;
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsText(file);
  });
}

function parseWorkspaceJson(raw: string): ParsedState {
  try {
    const json = JSON.parse(raw);
    const result = importWorkspaceDataSchema.safeParse(json);
    if (!result.success) {
      return { status: 'error', errorMessage: getMessage('workspaceImportErrorInvalid') };
    }
    return { status: 'ready', data: result.data };
  } catch {
    return { status: 'error', errorMessage: getMessage('workspaceImportErrorJson') };
  }
}

export function ImportWorkspaceDialog({ open, onOpenChange }: ImportWorkspaceDialogProps) {
  const { active } = useActiveWorkspaceContext();
  const [parsed, setParsed] = useState<ParsedState>({ status: 'idle' });
  const [mode, setMode] = useState<ImportMode>('new');
  const [includeStatistics, setIncludeStatistics] = useState(false);
  const [nameOverride, setNameOverride] = useState('');
  const [pasted, setPasted] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setParsed({ status: 'idle' });
    setMode('new');
    setIncludeStatistics(false);
    setNameOverride('');
    setPasted('');
    setSubmitting(false);
  }, [open]);

  const handleFile = useCallback(async (file: File) => {
    setParsed({ status: 'parsing' });
    try {
      const raw = await readFileAsText(file);
      const next = parseWorkspaceJson(raw);
      setParsed(next);
      if (next.status === 'ready' && next.data) {
        setNameOverride(next.data.workspace.name);
      }
    } catch (error) {
      logger.error('[ImportWorkspaceDialog] file read failed:', error);
      setParsed({ status: 'error', errorMessage: getMessage('workspaceImportErrorJson') });
    }
  }, []);

  const handlePastedSubmit = useCallback(() => {
    if (!pasted.trim()) return;
    const next = parseWorkspaceJson(pasted);
    setParsed(next);
    if (next.status === 'ready' && next.data) {
      setNameOverride(next.data.workspace.name);
    }
  }, [pasted]);

  const handleConfirm = useCallback(async () => {
    if (parsed.status !== 'ready' || !parsed.data) return;
    setSubmitting(true);
    try {
      if (mode === 'new') {
        await applyWorkspaceImportAsNew(parsed.data, {
          includeStatistics,
          nameOverride: nameOverride || undefined,
        });
      } else if (active) {
        await applyWorkspaceImportToExisting(active.id, parsed.data, { includeStatistics });
      }
      onOpenChange(false);
    } catch (error) {
      logger.error('[ImportWorkspaceDialog] apply failed:', error);
      setParsed({ status: 'error', errorMessage: getMessage('workspaceImportErrorApply') });
    } finally {
      setSubmitting(false);
    }
  }, [parsed, mode, includeStatistics, nameOverride, active, onOpenChange]);

  const ready = parsed.status === 'ready' && !!parsed.data;
  const ruleCount = parsed.data?.domainRules.length ?? 0;
  const sessionCount = parsed.data?.sessions.length ?? 0;
  const hasStats = !!parsed.data?.statistics;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content data-testid="workspace-import-dialog" maxWidth="560px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Upload size={18} />
            {getMessage('workspaceImportTitle')}
          </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" mb="3">
          {getMessage('workspaceImportDescription')}
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <Flex direction="column" gap="2">
            <Text as="label" size="2" weight="medium">
              {getMessage('workspaceImportFileLabel')}
            </Text>
            <Flex align="center" gap="2">
              <Button asChild variant="soft">
                <label htmlFor="workspace-import-file">
                  <FileUp size={16} />
                  {getMessage('workspaceImportFileBtn')}
                </label>
              </Button>
              <input
                id="workspace-import-file"
                data-testid="workspace-import-file"
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  if (file) {
                    handleFile(file).catch((err) =>
                      logger.error('[ImportWorkspaceDialog] handleFile:', err),
                    );
                  }
                }}
              />
              <Text size="1" color="gray">{getMessage('workspaceImportFileHint')}</Text>
            </Flex>
          </Flex>

          <Flex direction="column" gap="2">
            <Text as="label" size="2" weight="medium" htmlFor="workspace-import-paste">
              {getMessage('workspaceImportPasteLabel')}
            </Text>
            <TextArea
              id="workspace-import-paste"
              data-testid="workspace-import-paste"
              value={pasted}
              onChange={(e) => setPasted(e.currentTarget.value)}
              placeholder="{ ... }"
              rows={3}
            />
            <Flex justify="end">
              <Button
                size="1"
                variant="soft"
                data-testid="workspace-import-paste-btn"
                onClick={handlePastedSubmit}
                disabled={!pasted.trim()}
              >
                {getMessage('workspaceImportPasteBtn')}
              </Button>
            </Flex>
          </Flex>

          {parsed.status === 'error' ? (
            <Callout.Root color="red" data-testid="workspace-import-error">
              <Callout.Icon>
                <AlertCircle size={16} />
              </Callout.Icon>
              <Callout.Text>{parsed.errorMessage}</Callout.Text>
            </Callout.Root>
          ) : null}

          {ready ? (
            <Flex direction="column" gap="2" data-testid="workspace-import-summary">
              <Text size="2" color="gray">
                {getMessage('workspaceImportSummary', [
                  parsed.data!.workspace.name,
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
        </Flex>

        <Flex gap="3" mt="4" justify="end">
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
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
