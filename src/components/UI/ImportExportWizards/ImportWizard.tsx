import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, Dialog, Flex, Separator } from '@radix-ui/themes';
import { FileUp } from 'lucide-react';
import { ImportTheme } from '@/components/Form/themes';
import { getMessage } from '@/utils/i18n';
import { showSuccessNotification } from '@/utils/notifications';
import { importDataSchema } from '@/schemas/importExport';
import { classifyImportedRules } from '@/utils/importClassification';
import { generateUUID } from '@/utils/utils';
import type { DomainRuleSetting } from '@/types/syncSettings';
import { TwoStepImportFooter, WizardDialogTitle, useDialogReset } from './Shared';
import { SourceStep, ImportedNoteCallout, useJsonSourceInput } from './Source';
import {
  useImportClassification,
  ClassificationGroup,
  ClassificationScrollArea,
  ConflictModeSelector,
  ConflictWarningCallout,
  ImportCountLabel,
} from './Classification';
import type { RuleClassification } from '@/utils/importClassification';
import { RuleRow, ConflictRuleRow } from './RuleImportRows';

interface ImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingRules: DomainRuleSetting[];
  onImport: (updatedRules: DomainRuleSetting[]) => void;
}

const validateRulesPayload = (raw: unknown) => {
  const validated = importDataSchema.parse(raw);
  return {
    data: validated.domainRules as DomainRuleSetting[],
    note: validated.note ?? null,
  };
};

export function ImportWizard({ open, onOpenChange, existingRules, onImport }: ImportWizardProps) {
  const [step, setStep] = useState(0);
  const source = useJsonSourceInput<DomainRuleSetting[]>(validateRulesPayload);
  const classificationState = useImportClassification<RuleClassification>();
  const { classification, conflictMode, newSelection: newRuleSelection } = classificationState;

  useDialogReset(open, () => {
    setStep(0);
    source.reset();
    classificationState.reset();
  });

  // Transition to step 1: classify rules
  const goToStep1 = useCallback(() => {
    if (!source.parsedData) return;
    const result = classifyImportedRules(source.parsedData, existingRules);
    classificationState.setClassification(result);
    newRuleSelection.setAll(result.newRules.map((r) => r.id));
    setStep(1);
  }, [source.parsedData, existingRules, classificationState, newRuleSelection]);

  // Compute import count
  const importCount = useMemo(() => {
    if (!classification) return 0;
    const newCount = classification.newRules.filter(r => newRuleSelection.has(r.id)).length;
    const conflictCount = conflictMode === 'ignore' ? 0 : classification.conflictingRules.length;
    return newCount + conflictCount;
  }, [classification, newRuleSelection, conflictMode]);

  // Execute import
  const executeImport = useCallback(() => {
    if (!classification) return;

    const updatedRules = [...existingRules];
    let added = 0;
    let overwritten = 0;

    // Add new selected rules
    for (const rule of classification.newRules) {
      if (newRuleSelection.has(rule.id)) {
        updatedRules.push(rule);
        added++;
      }
    }

    // Handle conflicts
    for (const conflict of classification.conflictingRules) {
      if (conflictMode === 'overwrite') {
        const idx = updatedRules.findIndex(
          r => r.label.toLowerCase() === conflict.existing.label.toLowerCase()
        );
        if (idx !== -1) {
          updatedRules[idx] = { ...conflict.imported, id: conflict.existing.id };
          overwritten++;
        }
      } else if (conflictMode === 'duplicate') {
        updatedRules.push({ ...conflict.imported, id: generateUUID() });
        added++;
      }
      // 'ignore': do nothing
    }

    onImport(updatedRules);
    onOpenChange(false);
    showSuccessNotification(
      getMessage('importNotificationTitle'),
      getMessage('importNotificationMessage', [String(added), String(overwritten)]),
    );
  }, [classification, existingRules, newRuleSelection, conflictMode, onImport, onOpenChange]);

  return (
    <ImportTheme>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ maxWidth: 600 }}>
          <WizardDialogTitle
            icon={FileUp}
            titleKey="importRulesTitle"
            descriptionKey="importRulesDescription"
          />

          {/* Step 0: Source */}
          {step === 0 && (
            <SourceStep
              source={source}
              textareaPlaceholder='{"domainRules": [...]}'
              successCountMessageKey="rulesFoundCount"
            />
          )}

          {/* Step 1: Selection */}
          {step === 1 && classification && (
            <Box mt="4">
              <ImportedNoteCallout note={source.importedNote} />
              <ClassificationScrollArea>
                <ClassificationGroup
                  titleKey="newRulesGroup"
                  items={classification.newRules}
                  renderItem={(rule) => (
                    <RuleRow
                      key={rule.id}
                      rule={rule}
                      checkbox
                      checked={newRuleSelection.has(rule.id)}
                      onToggle={() => newRuleSelection.toggle(rule.id)}
                    />
                  )}
                />
                <ClassificationGroup
                  titleKey="conflictingRulesGroup"
                  items={classification.conflictingRules}
                  showSeparator={classification.newRules.length > 0}
                  beforeList={
                    <ConflictModeSelector
                      value={conflictMode}
                      onChange={classificationState.setConflictMode}
                    />
                  }
                  renderItem={(conflict) => (
                    <ConflictRuleRow key={conflict.imported.id} conflict={conflict} />
                  )}
                />
                <ClassificationGroup
                  titleKey="identicalRulesGroup"
                  items={classification.identicalRules}
                  showSeparator={
                    classification.newRules.length > 0 || classification.conflictingRules.length > 0
                  }
                  renderItem={(rule) => (
                    <RuleRow
                      key={rule.id}
                      rule={rule}
                      dimmed
                      statusBadge={getMessage('alreadyExists')}
                    />
                  )}
                />
              </ClassificationScrollArea>

              <ImportCountLabel messageKey="rulesToImportCount" count={importCount} />
              <ConflictWarningCallout
                when={conflictMode === 'overwrite' && classification.conflictingRules.length > 0}
                messageKey="overwriteWarning"
              />
            </Box>
          )}

          <TwoStepImportFooter
            step={step as 0 | 1}
            onNext={goToStep1}
            nextDisabled={!source.parsedData}
            onPrevious={() => setStep(0)}
            onConfirm={executeImport}
            confirmDisabled={importCount === 0}
            confirmLabelKey="confirmImport"
          />
        </Dialog.Content>
      </Dialog.Root>
    </ImportTheme>
  );
}
