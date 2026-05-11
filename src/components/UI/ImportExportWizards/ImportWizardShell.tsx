import React from 'react';
import { Box } from '@radix-ui/themes';
import type { LucideIcon } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
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
  /** Pack-mode footer wiring: the rule count drives the Next button's disabled state, the callback triggers the confirmation. */
  packFooter?: {
    ruleCount: number;
    onConfirm: () => void;
  };
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

  return (
    <WizardModal
      open={open}
      onOpenChange={onOpenChange}
      icon={icon}
      title={title}
      description={getMessage(stepDescriptionKeys[step])}
      maxWidth={maxWidth}
      fillHeight={fillHeight}
    >
      <WizardModal.Body>
        {step === 0 && (
          <SourceStep
            source={source}
            textareaPlaceholder={textareaPlaceholder}
            successCountMessageKey={successCountMessageKey}
            availableModes={availableModes}
            packGalleryNode={packGalleryNode}
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
