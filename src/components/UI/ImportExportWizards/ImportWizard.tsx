import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog, Flex, Button, Checkbox, Text, Badge, Box, Separator,
  Popover,
} from '@radix-ui/themes';
import { FileUp, ClipboardPaste, Eye, AlertTriangle } from 'lucide-react';
import { ImportTheme } from '../../Form/themes';
import { getMessage } from '../../../utils/i18n';
import { showSuccessNotification } from '../../../utils/notifications';
import { importDataSchema } from '../../../schemas/importExport';
import {
  classifyImportedRules,
  type ConflictingRule,
} from '../../../utils/importClassification';
import { generateUUID, getRadixColor } from '../../../utils/utils';
import { getRuleCategory } from '../../../schemas/enums';
import type { DomainRuleSetting } from '../../../types/syncSettings';
import { WizardDialogTitle, useDialogReset } from './Shared';
import { SourceStep, ImportedNoteCallout, useJsonSourceInput } from './Source';
import {
  useImportClassification,
  ClassificationGroup,
  ClassificationScrollArea,
  ConflictModeSelector,
  ConflictWarningCallout,
  ImportCountLabel,
} from './Classification';
import type { RuleClassification } from '../../../utils/importClassification';

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
                    <ConflictRow key={conflict.imported.id} conflict={conflict} />
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

          <Separator size="4" mt="4" style={{ opacity: 0.3 }} />

          {/* Footer */}
          <Flex gap="3" justify="end" mt="3">
            {step === 0 && (
              <>
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    {getMessage('cancel')}
                  </Button>
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
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </ImportTheme>
  );
}

// --- Sub-components ---

interface RuleRowProps {
  rule: DomainRuleSetting;
  checkbox?: boolean;
  checked?: boolean;
  onToggle?: () => void;
  dimmed?: boolean;
  statusBadge?: string;
}

function RuleRow({ rule, checkbox, checked, onToggle, dimmed, statusBadge }: RuleRowProps) {
  return (
    <Flex
      align="center"
      gap="3"
      p="2"
      style={{
        borderRadius: 'var(--radius-2)',
        backgroundColor: 'var(--gray-a2)',
        opacity: dimmed ? 0.6 : 1,
      }}
    >
      {checkbox && (
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          aria-label={rule.label}
        />
      )}
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
      {statusBadge && (
        <Badge color="gray" variant="outline" size="1">
          {statusBadge}
        </Badge>
      )}
    </Flex>
  );
}

interface ConflictRowProps {
  conflict: ConflictingRule;
}

function ConflictRow({ conflict }: ConflictRowProps) {
  return (
    <Flex
      align="center"
      gap="3"
      p="2"
      style={{
        borderRadius: 'var(--radius-2)',
        backgroundColor: 'var(--orange-a2)',
      }}
    >
      <AlertTriangle size={16} style={{ color: 'var(--orange-9)', flexShrink: 0 }} aria-hidden="true" />
      <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Text size="2" weight="medium">{conflict.imported.label}</Text>
        <Text size="1" color="gray">{conflict.imported.domainFilter}</Text>
      </Flex>
      <Badge color={conflict.imported.color as any} variant="soft" size="1">
        {getMessage(`color_${conflict.imported.color}`)}
      </Badge>

      <Popover.Root>
        <Popover.Trigger>
          <Button variant="ghost" size="1" aria-label={getMessage('viewDiff')} title={getMessage('viewDiff')}>
            <Eye size={14} aria-hidden="true" />
          </Button>
        </Popover.Trigger>
        <Popover.Content style={{ maxWidth: 350 }}>
          <Text size="3" weight="bold" mb="2">
            {getMessage('differences')} — {conflict.imported.label}
          </Text>
          <Flex direction="column" gap="3">
            {conflict.differences.map(diff => (
              <Box key={diff.property}>
                <Text size="2" weight="medium" mb="1">
                  {getMessage(diff.property) || diff.property}
                </Text>
                <Flex direction="column" gap="1">
                  <Flex align="center" gap="2">
                    <Badge color="red" variant="soft" size="1">{getMessage('currentValue')}</Badge>
                    <Text size="1">{String(diff.currentValue)}</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Badge color="green" variant="soft" size="1">{getMessage('importedValue')}</Badge>
                    <Text size="1">{String(diff.importedValue)}</Text>
                  </Flex>
                </Flex>
              </Box>
            ))}
          </Flex>
        </Popover.Content>
      </Popover.Root>
    </Flex>
  );
}
