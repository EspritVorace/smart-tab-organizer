import React, { useCallback, useState } from 'react';
import { Box, Button, Dialog } from '@radix-ui/themes';
import { FileDown } from 'lucide-react';
import { ExportTheme } from '@/components/Form/themes';
import type { DomainRuleSetting } from '@/types/syncSettings';
import { getMessage } from '@/utils/i18n';
import { WizardModal } from '@/components/UI/WizardModal';
import { CountLabel, useDialogReset, useToggleSet } from './Shared';
import {
  ExportNoteField,
  ExportSplitButton,
  SelectableListContainer,
  SelectionToolbar,
  useExportActions,
} from './Export';
import { RuleRow } from './RuleImportRows';

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
      <WizardModal
        open={open}
        onOpenChange={onOpenChange}
        icon={FileDown}
        title={getMessage('exportRulesTitle')}
        description={getMessage('exportRulesDescription')}
      >
        <WizardModal.Body>
          <Box>
            <ExportNoteField value={exportNote} onChange={setExportNote} />
            <SelectionToolbar onSelectAll={selectAll} onDeselectAll={selection.clearAll} />

            <SelectableListContainer>
              {rules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  checkbox
                  checked={selection.has(rule.id)}
                  onToggle={() => selection.toggle(rule.id)}
                  statusBadge={rule.enabled ? undefined : getMessage('disabled')}
                />
              ))}
            </SelectableListContainer>

            <CountLabel messageKey="rulesSelectedCount" count={selection.size} />
          </Box>
        </WizardModal.Body>

        <WizardModal.Footer>
          <Dialog.Close>
            <Button variant="soft" color="gray">{getMessage('cancel')}</Button>
          </Dialog.Close>
          <ExportSplitButton
            labelKey="exportButton"
            actions={actions}
            disabled={selection.size === 0}
          />
        </WizardModal.Footer>
      </WizardModal>
    </ExportTheme>
  );
}
