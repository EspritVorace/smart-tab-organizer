import React, { useState, useCallback } from 'react';
import { Dialog, Flex, Button, Checkbox, Text, Separator, Badge, Box, ScrollArea, TextArea } from '@radix-ui/themes';
import { FileDown, ClipboardCopy } from 'lucide-react';
import { ExportTheme } from '../../Form/themes';
import { SplitButton } from '../SplitButton/SplitButton';
import { getMessage } from '../../../utils/i18n';
import { showSuccessNotification } from '../../../utils/notifications';
import { getRuleCategory } from '../../../schemas/enums';
import { getRadixColor } from '../../../utils/utils';
import type { DomainRuleSetting } from '../../../types/syncSettings';
import { WizardDialogTitle, useDialogReset, useToggleSet } from './Shared';

interface ExportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rules: DomainRuleSetting[];
}

export function ExportWizard({ open, onOpenChange, rules }: ExportWizardProps) {
  const selection = useToggleSet<string>();
  const [exportNote, setExportNote] = useState('');

  useDialogReset(open, () => {
    selection.setAll(rules.map(r => r.id));
    setExportNote('');
  });

  const selectAll = useCallback(() => {
    selection.setAll(rules.map(r => r.id));
  }, [rules, selection]);

  const selectedRules = rules.filter(r => selection.has(r.id));

  const getExportJson = useCallback(() => {
    const exportData: { note?: string; domainRules: DomainRuleSetting[] } = {
      domainRules: selectedRules
    };
    if (exportNote.trim()) exportData.note = exportNote.trim();
    return JSON.stringify(exportData, null, 2);
  }, [selectedRules, exportNote]);

  const handleExportToFile = useCallback(async () => {
    const json = getExportJson();

    // Use native Save As dialog when available (Chrome)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: 'smarttab_organizer_rules.json',
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
          getMessage('exportNotificationTitle'),
          getMessage('exportNotificationMessage'),
        );
      } catch (err: any) {
        // User cancelled the dialog
        if (err?.name === 'AbortError') return;
        throw err;
      }
      return;
    }

    // Fallback for Firefox / older browsers
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smarttab_organizer_rules.json';
    a.click();
    URL.revokeObjectURL(url);
    onOpenChange(false);
    showSuccessNotification(
      getMessage('exportNotificationTitle'),
      getMessage('exportNotificationMessage'),
    );
  }, [getExportJson, onOpenChange]);

  const handleExportToClipboard = useCallback(async () => {
    const json = getExportJson();
    await navigator.clipboard.writeText(json);
    onOpenChange(false);
    showSuccessNotification(
      getMessage('exportNotificationTitle'),
      getMessage('exportNotificationMessage'),
    );
  }, [getExportJson, onOpenChange]);

  return (
    <ExportTheme>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ maxWidth: 550 }}>
          <WizardDialogTitle
            icon={FileDown}
            titleKey="exportRulesTitle"
            descriptionKey="exportRulesDescription"
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
                {rules.map(rule => (
                  <Flex
                    key={rule.id}
                    align="center"
                    gap="3"
                    p="2"
                    style={{
                      borderRadius: 'var(--radius-2)',
                      backgroundColor: 'var(--gray-a2)',
                    }}
                  >
                    <Checkbox
                      checked={selection.has(rule.id)}
                      onCheckedChange={() => selection.toggle(rule.id)}
                      aria-label={rule.label}
                    />
                    <Flex direction="column" gap="1" style={{ flex: 1 }}>
                      <Text size="2" weight="medium">{rule.label}</Text>
                      <Text size="1" color="gray">{rule.domainFilter}</Text>
                    </Flex>
                    {(() => {
                      const cat = getRuleCategory(rule.categoryId);
                      if (cat) {
                        return (
                          <Badge color={getRadixColor(cat.color) as any} variant="soft" size="1">
                            {cat.emoji} {getMessage(cat.labelKey as any)}
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                    {!rule.enabled && (
                      <Badge color="gray" variant="outline" size="1">
                        {getMessage('disabled')}
                      </Badge>
                    )}
                  </Flex>
                ))}
              </Flex>
            </ScrollArea>

            <Text size="2" color="gray" mt="3">
              {getMessage('rulesSelectedCount').replace('{count}', String(selection.size))}
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
              label={getMessage('exportButton')}
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
    </ExportTheme>
  );
}
