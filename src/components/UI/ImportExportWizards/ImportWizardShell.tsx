import React from 'react';
import { Box } from '@radix-ui/themes';
import type { LucideIcon } from 'lucide-react';
import { getMessage, type MessageKey } from '@/utils/i18n';
import { WizardModal } from '@/components/UI/WizardModal';
import {
  ClassificationGroup,
  ClassificationScrollArea,
  ConflictModeSelector,
  ConflictWarningCallout,
  ImportCountLabel,
} from './Classification';
import { ImportWizardFooter } from './ImportWizardFooter';
import { ImportedNoteCallout, SourceStep, type SourceMode } from './Source';
import type { ImportWizardState } from './useImportWizardState';
import type { ImportJsonSchema } from '@/utils/importJsonSchemas';

export interface ImportWizardShellLabels {
  title: string;
  /** i18n keys for step 0 and step 1 dialog descriptions. */
  stepDescriptionKeys: readonly [string, string];
  textareaPlaceholder: string;
  successCountMessageKey: string;
  newGroupTitleKey: string;
  conflictingGroupTitleKey: string;
  identicalGroupTitleKey: string;
  countLabelKey: string;
  overwriteWarningKey: string;
}

interface ImportWizardShellProps<TItem extends { id: string }, TConflict>
  extends ImportWizardShellLabels {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  state: ImportWizardState<TItem, TConflict>;
  renderNewItem: (item: TItem) => React.ReactNode;
  renderConflictingItem: (conflict: TConflict) => React.ReactNode;
  renderIdenticalItem: (item: TItem) => React.ReactNode;
  onConfirm: () => void;
  /** Override the dialog max width forwarded to `WizardModal`. */
  maxWidth?: number | string;
  /** When true, force the dialog to a fixed height so inner content can size deterministically. */
  fillHeight?: boolean;
  /** Source modes exposed in the segmented control. Defaults to `['file', 'text']`. */
  availableModes?: readonly SourceMode[];
  /** Optional gallery node rendered when `sourceMode === 'pack'`. */
  packGalleryNode?: React.ReactNode;
  /** JSON Schema fed to the text-mode editor for autocompletion and linting. */
  jsonSchema?: ImportJsonSchema;
  /** Pack-mode footer wiring: the rule count drives the Next button's disabled state, the callback triggers the confirmation. */
  packFooter?: {
    ruleCount: number;
    onConfirm: () => void;
  };
}

/** Resolve the Ctrl+Enter handler for the import wizard's current step. */
function computeImportNext(args: {
  step: 0 | 1;
  sourceMode: SourceMode;
  hasParsedData: boolean;
  importCount: number;
  goToStep1: () => void;
  onConfirm: () => void;
  packFooter?: { ruleCount: number; onConfirm: () => void };
}): (() => void) | undefined {
  const { step, sourceMode, hasParsedData, importCount, goToStep1, onConfirm, packFooter } = args;
  if (step === 1) {
    return importCount > 0 ? onConfirm : undefined;
  }
  if (sourceMode === 'pack' && packFooter) {
    return packFooter.ruleCount > 0 ? packFooter.onConfirm : undefined;
  }
  return hasParsedData ? goToStep1 : undefined;
}

/**
 * Two-step import wizard shell shared by every import flow (rules, sessions,
 * ...). Owns the WizardModal frame, source step, classification step (3
 * groups + conflict mode + count + warning) and the footer. Wizards plug in
 * their classifier, row renderers, and an `executeImport` callback.
 */
export function ImportWizardShell<TItem extends { id: string }, TConflict>({
  open,
  onOpenChange,
  icon,
  title,
  stepDescriptionKeys,
  textareaPlaceholder,
  successCountMessageKey,
  newGroupTitleKey,
  conflictingGroupTitleKey,
  identicalGroupTitleKey,
  countLabelKey,
  overwriteWarningKey,
  state,
  renderNewItem,
  renderConflictingItem,
  renderIdenticalItem,
  onConfirm,
  maxWidth,
  fillHeight,
  availableModes,
  packGalleryNode,
  jsonSchema,
  packFooter,
}: ImportWizardShellProps<TItem, TConflict>) {
  const {
    step,
    source,
    classification,
    conflictMode,
    setConflictMode,
    importCount,
    goToStep0,
    goToStep1,
  } = state;

  const wizardOnNext = computeImportNext({
    step,
    sourceMode: source.sourceMode,
    hasParsedData: !!source.parsedData,
    importCount,
    goToStep1,
    onConfirm,
    packFooter,
  });

  return (
    <WizardModal
      open={open}
      onOpenChange={onOpenChange}
      icon={icon}
      title={title}
      description={getMessage(stepDescriptionKeys[step] as MessageKey)}
      maxWidth={maxWidth}
      fillHeight={fillHeight}
      onNext={wizardOnNext}
      onPrevious={step === 1 ? goToStep0 : undefined}
    >
      <WizardModal.Body>
        {step === 0 && (
          <SourceStep
            source={source}
            textareaPlaceholder={textareaPlaceholder}
            successCountMessageKey={successCountMessageKey}
            availableModes={availableModes}
            packGalleryNode={packGalleryNode}
            jsonSchema={jsonSchema}
          />
        )}

        {step === 1 && classification && (
          <Box>
            <ImportedNoteCallout note={source.importedNote} />
            <ClassificationScrollArea>
              <ClassificationGroup
                titleKey={newGroupTitleKey}
                items={classification.newItems}
                renderItem={renderNewItem}
              />
              <ClassificationGroup
                titleKey={conflictingGroupTitleKey}
                items={classification.conflictingItems}
                showSeparator={classification.newItems.length > 0}
                beforeList={
                  <ConflictModeSelector
                    value={conflictMode}
                    onChange={setConflictMode}
                  />
                }
                renderItem={renderConflictingItem}
              />
              <ClassificationGroup
                titleKey={identicalGroupTitleKey}
                items={classification.identicalItems}
                showSeparator={
                  classification.newItems.length > 0
                  || classification.conflictingItems.length > 0
                }
                renderItem={renderIdenticalItem}
              />
            </ClassificationScrollArea>

            <ImportCountLabel messageKey={countLabelKey} count={importCount} />
            <ConflictWarningCallout
              when={conflictMode === 'overwrite' && classification.conflictingItems.length > 0}
              messageKey={overwriteWarningKey}
            />
          </Box>
        )}
      </WizardModal.Body>

      <WizardModal.Footer>
        <ImportWizardFooter
          step={step}
          sourceMode={source.sourceMode}
          hasParsedData={!!source.parsedData}
          importCount={importCount}
          onNext={goToStep1}
          onBack={goToStep0}
          onConfirm={onConfirm}
          packFooter={packFooter}
        />
      </WizardModal.Footer>
    </WizardModal>
  );
}
