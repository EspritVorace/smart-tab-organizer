import React from 'react';
import { Badge, Checkbox } from '@radix-ui/themes';
import { FileDown } from 'lucide-react';
import type { DomainRuleSetting } from '@/types/syncSettings';
import { getMessage } from '@/utils/i18n';
import { DomainRuleCard } from '@/components/Core/DomainRule/DomainRuleCard';
import { ExportWizardShell } from './ExportWizardShell';
import { useExportWizardState } from './useExportWizardState';

interface ExportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rules: DomainRuleSetting[];
  initialSelectedIds?: string[];
}

export function ExportWizard({ open, onOpenChange, rules, initialSelectedIds }: ExportWizardProps) {
  const state = useExportWizardState<DomainRuleSetting>({
    open,
    items: rules,
    initialSelectedIds,
    payloadKey: 'domainRules',
    filename: 'smarttab_organizer_rules.json',
    notifyTitleKey: 'exportNotificationTitle',
    notifyMessage: 'exportNotificationMessage',
    onFinish: () => onOpenChange(false),
  });

  const { selection } = state;

  return (
    <ExportWizardShell<DomainRuleSetting>
      open={open}
      onOpenChange={onOpenChange}
      icon={FileDown}
      title={getMessage('exportRulesTitle')}
      description={getMessage('exportRulesDescription')}
      state={state}
      countLabelKey="rulesSelectedCount"
      buttonLabelKey="exportButton"
      listRole="list"
      primaryTestId="wizard-export-rules-btn-export"
      clipboardTestId="wizard-export-rules-btn-clipboard"
      cancelTestId="wizard-export-rules-btn-cancel"
    >
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
    </ExportWizardShell>
  );
}
