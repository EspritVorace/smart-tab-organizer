import React from 'react';
import { Button, Dialog } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';

interface ImportWizardFooterProps {
  step: 0 | 1;
  hasParsedData: boolean;
  importCount: number;
  onNext: () => void;
  onBack: () => void;
  onConfirm: () => void;
}

/**
 * Shared footer for import wizards (rules and sessions).
 *
 * Step 0: Cancel (Dialog.Close) + Next (disabled until data is parsed).
 * Step 1: Previous + Confirm Import (disabled when importCount is 0).
 */
export function ImportWizardFooter({
  step,
  hasParsedData,
  importCount,
  onNext,
  onBack,
  onConfirm,
}: ImportWizardFooterProps) {
  if (step === 0) {
    return (
      <>
        <Dialog.Close>
          <Button variant="soft" color="gray">{getMessage('cancel')}</Button>
        </Dialog.Close>
        <Button onClick={onNext} disabled={!hasParsedData}>
          {getMessage('next')}
        </Button>
      </>
    );
  }

  return (
    <>
      <Button variant="soft" color="gray" onClick={onBack}>
        {getMessage('previous')}
      </Button>
      <Button onClick={onConfirm} disabled={importCount === 0}>
        {getMessage('confirmImport')}
      </Button>
    </>
  );
}
