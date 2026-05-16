import React, { useCallback, useMemo } from 'react';
import { FileUp } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { showSuccessToast } from '@/utils/toast';
import { importDataSchema, type ImportDomainRule } from '@/schemas/importExport';
import {
  classifyImportedRules,
  type ConflictingRule,
} from '@/utils/importClassification';
import { generateUUID } from '@/utils/utils';
import type { DomainRuleSetting } from '@/types/syncSettings';
import { PackGallery } from '@/components/Core/Pack/PackGallery/PackGallery';
import { usePackSelections } from '@/components/Core/Pack/PackGallery/usePackSelections';
import { usePacks } from '@/hooks/usePacks';
import { ImportWizardShell } from './ImportWizardShell';
import {
  useImportWizardState,
  type NormalizedClassification,
} from './useImportWizardState';
import type { SourceMode } from './Source';
import { RuleRow, ConflictRuleRow } from './RuleImportRows';

const RULES_AVAILABLE_MODES: readonly SourceMode[] = ['file', 'text', 'pack'];

interface ImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingRules: DomainRuleSetting[];
  onImport: (updatedRules: DomainRuleSetting[]) => void;
  /** When provided, the wizard opens on this source mode instead of `'file'`. */
  initialSourceMode?: SourceMode;
}

const validateRulesPayload = (raw: unknown) => {
  const validated = importDataSchema.parse(raw);
  return {
    data: validated.domainRules as DomainRuleSetting[],
    note: validated.note ?? null,
  };
};

const classifyRules = (
  imported: DomainRuleSetting[],
  existing: DomainRuleSetting[],
): NormalizedClassification<DomainRuleSetting, ConflictingRule> => {
  const result = classifyImportedRules(imported, existing);
  return {
    newItems: result.newRules,
    conflictingItems: result.conflictingRules,
    identicalItems: result.identicalRules,
  };
};

export function ImportWizard({
  open,
  onOpenChange,
  existingRules,
  onImport,
  initialSourceMode,
}: ImportWizardProps) {
  const packSelections = usePackSelections();

  const state = useImportWizardState<DomainRuleSetting, ConflictingRule>({
    open,
    existingItems: existingRules,
    validatePayload: validateRulesPayload,
    classify: classifyRules,
    initialSourceMode,
    onReset: packSelections.reset,
  });

  const { packs, categories } = usePacks();
  const { classification, conflictMode, newSelection, source } = state;

  const existingRuleIds = useMemo(
    () => new Set(existingRules.map((rule) => rule.id)),
    [existingRules],
  );

  const handlePackConfirm = useCallback(() => {
    const aggregated: ImportDomainRule[] = [];
    for (const pack of packs) {
      const sel = packSelections.selections[pack.pack.id];
      if (sel?.selected) aggregated.push(...sel.rules);
    }
    const payload = JSON.stringify({ domainRules: aggregated });
    source.handleTextChange(payload);
  }, [packs, packSelections.selections, source]);

  const executeImport = useCallback(() => {
    if (!classification) return;

    const updatedRules = [...existingRules];
    let added = 0;
    let overwritten = 0;

    for (const rule of classification.newItems) {
      if (newSelection.has(rule.id)) {
        updatedRules.push(rule);
        added++;
      }
    }

    for (const conflict of classification.conflictingItems) {
      if (conflictMode === 'overwrite') {
        const idx = updatedRules.findIndex(r => r.id === conflict.existing.id);
        if (idx !== -1) {
          updatedRules[idx] = { ...conflict.imported, id: conflict.existing.id };
          overwritten++;
        }
      } else if (conflictMode === 'duplicate') {
        updatedRules.push({ ...conflict.imported, id: generateUUID() });
        added++;
      }
    }

    onImport(updatedRules);
    onOpenChange(false);
    showSuccessToast(
      getMessage('importNotificationTitle'),
      getMessage('importNotificationMessage', [String(added), String(overwritten)]),
    );
  }, [classification, existingRules, newSelection, conflictMode, onImport, onOpenChange]);

  return (
    <ImportWizardShell<DomainRuleSetting, ConflictingRule>
      open={open}
      onOpenChange={onOpenChange}
      icon={FileUp}
      title={getMessage('importRulesTitle')}
      stepDescriptionKeys={['importRulesStepSourceDescription', 'importRulesStepReviewDescription']}
      textareaPlaceholder='{"domainRules": [...]}'
      successCountMessageKey="rulesFoundCount"
      newGroupTitleKey="newRulesGroup"
      conflictingGroupTitleKey="conflictingRulesGroup"
      identicalGroupTitleKey="identicalRulesGroup"
      countLabelKey="rulesToImportCount"
      overwriteWarningKey="overwriteWarning"
      state={state}
      maxWidth="min(960px, 95vw)"
      fillHeight
      availableModes={RULES_AVAILABLE_MODES}
      packGalleryNode={
        <PackGallery
          packs={packs}
          categories={categories}
          selections={packSelections.selections}
          onSelectionChange={packSelections.setPackSelection}
          existingRuleIds={existingRuleIds}
        />
      }
      packFooter={{
        ruleCount: packSelections.totals.ruleCount,
        onConfirm: handlePackConfirm,
      }}
      renderNewItem={(rule) => (
        <RuleRow
          key={rule.id}
          rule={rule}
          checkbox
          checked={newSelection.has(rule.id)}
          onToggle={() => newSelection.toggle(rule.id)}
        />
      )}
      renderConflictingItem={(conflict) => (
        <ConflictRuleRow key={conflict.imported.id} conflict={conflict} />
      )}
      renderIdenticalItem={(rule) => (
        <RuleRow
          key={rule.id}
          rule={rule}
          dimmed
          statusBadge={getMessage('alreadyExists')}
        />
      )}
      onConfirm={executeImport}
    />
  );
}
