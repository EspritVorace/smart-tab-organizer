import React, { useCallback, useState } from 'react';
import { Box, Button, Dialog, Flex, Separator } from '@radix-ui/themes';
import { FileDown } from 'lucide-react';
import { ExportTheme } from '../../Form/themes';
import { getMessage } from '../../../utils/i18n';
import type { DomainRuleSetting } from '../../../types/syncSettings';
import { CountLabel, WizardDialogTitle, useDialogReset, useToggleSet } from './Shared';
import {
  ExportNoteField,
  ExportSplitButton,
  SelectableListContainer,
  SelectableRuleRow,
  SelectionToolbar,
  useExportActions,
} from './Export';

interface ExportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rules: DomainRuleSetting[];
}

export function ExportWizard({ open, onOpenChange, rules }: ExportWizardProps) {
  const selection = useToggleSet<string>();
  const [exportNote, setExportNote] = useState('');

  useDialogReset(open, () => {
    selection.setAll(rules.map((r) => r.id));
    setExportNote('');
  });

  const selectAll = useCallback(() => {
    selection.setAll(rules.map((r) => r.id));
  }, [rules, selection]);

  const selectedRules = rules.filter((r) => selection.has(r.id));

  const buildJson = useCallback(() => {
    const exportData: { note?: string; domainRules: DomainRuleSetting[] } = {
      domainRules: selectedRules,
    };
    if (exportNote.trim()) exportData.note = exportNote.trim();
    return JSON.stringify(exportData, null, 2);
  }, [selectedRules, exportNote]);

  const actions = useExportActions({
    filename: 'smarttab_organizer_rules.json',
    notifyTitleKey: 'exportNotificationTitle',
    notifyMessage: 'exportNotificationMessage',
    selected: selectedRules,
    note: exportNote,
    buildJson,
    onFinish: () => onOpenChange(false),
  });

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
            <ExportNoteField value={exportNote} onChange={setExportNote} />
            <SelectionToolbar onSelectAll={selectAll} onDeselectAll={selection.clearAll} />

            <SelectableListContainer>
              {rules.map((rule) => (
                <SelectableRuleRow
                  key={rule.id}
                  rule={rule}
                  checked={selection.has(rule.id)}
                  onToggle={() => selection.toggle(rule.id)}
                />
              ))}
            </SelectableListContainer>

            <CountLabel messageKey="rulesSelectedCount" count={selection.size} />
          </Box>

          <Separator size="4" mt="4" style={{ opacity: 0.3 }} />

          <Flex gap="3" justify="end" mt="3">
            <Dialog.Close>
              <Button variant="soft" color="gray">{getMessage('cancel')}</Button>
            </Dialog.Close>
            <ExportSplitButton
              labelKey="exportButton"
              actions={actions}
              disabled={selection.size === 0}
            />
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </ExportTheme>
  );
}
