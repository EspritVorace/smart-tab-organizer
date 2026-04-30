import React, { useCallback, useState } from 'react';
import { Box, Checkbox, Badge } from '@radix-ui/themes';
import { FileDown } from 'lucide-react';
import type { DomainRuleSetting } from '@/types/syncSettings';
import { getMessage } from '@/utils/i18n';
import { WizardModal } from '@/components/UI/WizardModal';
import { CountLabel, useDialogReset, useToggleSet } from './Shared';
import {
  ExportNoteField,
  ExportWizardFooter,
  SelectableListContainer,
  SelectionToolbar,
  useExportActions,
} from './Export';
import { DomainRuleCard } from '@/components/Core/DomainRule/DomainRuleCard';

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

          <SelectableListContainer role="list">
            {rules.map((rule) => (
              <DomainRuleCard
                key={rule.id}
                rule={rule}
                variant="summary"
                leading={
                  <Checkbox
                    checked={selection.has(rule.id)}
                    onCheckedChange={() => selection.toggle(rule.id)}
                    aria-label={rule.label}
                  />
                }
                trailing={rule.enabled ? undefined : (
                  <Badge color="gray" variant="outline" size="1">{getMessage('disabled')}</Badge>
                )}
              />
            ))}
          </SelectableListContainer>

          <CountLabel messageKey="rulesSelectedCount" count={selection.size} />
        </Box>
      </WizardModal.Body>

      <WizardModal.Footer>
        <ExportWizardFooter
          labelKey="exportButton"
          actions={actions}
          disabled={selection.size === 0}
        />
      </WizardModal.Footer>
    </WizardModal>
  );
}
