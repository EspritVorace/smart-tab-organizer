import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, Dialog } from '@radix-ui/themes';
import { FileUp } from 'lucide-react';
import { ImportTheme } from '@/components/Form/themes';
import { getMessage } from '@/utils/i18n';
import { showSuccessToast } from '@/utils/toast';
import { importDataSchema } from '@/schemas/importExport';
import { classifyImportedRules } from '@/utils/importClassification';
import { generateUUID } from '@/utils/utils';
import type { DomainRuleSetting } from '@/types/syncSettings';
import { WizardModal } from '@/components/UI/WizardModal';
import { useDialogReset } from './Shared';
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

const STEP_DESCRIPTION_KEYS = [
  'importRulesStepSourceDescription',
  'importRulesStepReviewDescription',
] as const;

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
    showSuccessToast(
      getMessage('importNotificationTitle'),
      getMessage('importNotificationMessage', [String(added), String(overwritten)]),
    );
  }, [classification, existingRules, newRuleSelection, conflictMode, onImport, onOpenChange]);

  return (
    <ImportTheme>
      <WizardModal open={open} onOpenChange={onOpenChange}>
        <WizardModal.Header
          icon={FileUp}
          title={getMessage('importRulesTitle')}
          description={getMessage(STEP_DESCRIPTION_KEYS[step])}
        />

        <WizardModal.Body>
          {step === 0 && (
            <SourceStep
              source={source}
              textareaPlaceholder='{"domainRules": [...]}'
              successCountMessageKey="rulesFoundCount"
            />
          )}

          {step === 1 && classification && (
            <Box>
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
        </WizardModal.Body>

        <WizardModal.Footer>
          {step === 0 && (
            <>
              <Dialog.Close>
                <Button variant="soft" color="gray">{getMessage('cancel')}</Button>
              </Dialog.Close>
              <Button onClick={goToStep1} disabled={!source.parsedData}>
                {getMessage('next')}
              </Button>
            </>
          )}
          {step === 1 && (
            <>
              <Button variant="soft" color="gray" onClick={() => setStep(0)}>
                {getMessage('previous')}
              </Button>
              <Button onClick={executeImport} disabled={importCount === 0}>
                {getMessage('confirmImport')}
              </Button>
            </>
          )}
        </WizardModal.Footer>
      </WizardModal>
    </ImportTheme>
  );
}
