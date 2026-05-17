import React from 'react';
import { Button, Dialog } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { AriaButton } from '@/components/UI/AriaButton/AriaButton';
import type { SourceMode } from './Source';

interface ImportWizardFooterProps {
  step: 0 | 1;
  sourceMode: SourceMode;
  hasParsedData: boolean;
  importCount: number;
  onNext: () => void;
  onBack: () => void;
  onConfirm: () => void;
  packFooter?: {
    ruleCount: number;
    onConfirm: () => void;
  };
}

/**
 * Shared footer for import wizards (rules and sessions).
 *
 * Step 0 (pack mode): Cancel + Next (aria-disabled until at least one rule is selected; the click builds the JSON payload, which makes the wizard auto-advance to step 1).
 * Step 0 (file/text): Cancel + Next (native disabled until data is parsed).
 * Step 1: Previous + Confirm Import (disabled when importCount is 0).
 */
export function ImportWizardFooter({
  step,
  sourceMode,
  hasParsedData,
  importCount,
  onNext,
  onBack,
  onConfirm,
  packFooter,
}: ImportWizardFooterProps) {
  if (step === 0 && sourceMode === 'pack' && packFooter) {
    const noPackSelected = packFooter.ruleCount === 0;
    return (
      <>
        <Dialog.Close>
          <Button variant="soft" color="gray">{getMessage('cancel')}</Button>
        </Dialog.Close>
        <AriaButton
          ariaDisabled={noPackSelected}
          disabledReason={noPackSelected ? getMessage('packGalleryNextDisabledReason') : undefined}
          onClick={packFooter.onConfirm}
          data-testid="import-wizard-pack-next"
        >
          {getMessage('next')}
        </AriaButton>
      </>
    );
  }

  if (step === 0) {
    return (
      <>
        <Dialog.Close>
          <Button variant="soft" color="gray" data-testid="import-wizard-btn-cancel">{getMessage('cancel')}</Button>
        </Dialog.Close>
        <Button onClick={onNext} disabled={!hasParsedData} data-testid="import-wizard-btn-next">
          {getMessage('next')}
        </Button>
      </>
    );
  }

  return (
    <>
      <Button variant="soft" color="gray" onClick={onBack} data-testid="import-wizard-btn-previous">
        {getMessage('previous')}
      </Button>
      <Button onClick={onConfirm} disabled={importCount === 0} data-testid="import-wizard-btn-confirm">
        {getMessage('confirmImport')}
      </Button>
    </>
  );
}
