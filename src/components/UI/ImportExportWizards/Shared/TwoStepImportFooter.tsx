import React from 'react';
import { Button, Dialog, Flex, Separator } from '@radix-ui/themes';
import { getMessage } from '../../../../utils/i18n';

interface TwoStepImportFooterProps {
  step: 0 | 1;
  onNext: () => void;
  nextDisabled: boolean;
  onPrevious: () => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
  /** i18n key for the confirm button label (`confirmImport`, ...). */
  confirmLabelKey: string;
}

/**
 * Separator + right-aligned button row shared by every two-step import
 * wizard. Shows Cancel/Next on step 0 and Previous/Confirm on step 1.
 */
export function TwoStepImportFooter({
  step,
  onNext,
  nextDisabled,
  onPrevious,
  onConfirm,
  confirmDisabled,
  confirmLabelKey,
}: TwoStepImportFooterProps) {
  return (
    <>
      <Separator size="4" mt="4" style={{ opacity: 0.3 }} />
      <Flex gap="3" justify="end" mt="3">
        {step === 0 && (
          <>
            <Dialog.Close>
              <Button variant="soft" color="gray">{getMessage('cancel')}</Button>
            </Dialog.Close>
            <Button onClick={onNext} disabled={nextDisabled}>
              {getMessage('next')}
            </Button>
          </>
        )}
        {step === 1 && (
          <>
            <Button variant="soft" color="gray" onClick={onPrevious}>
              {getMessage('previous')}
            </Button>
            <Button onClick={onConfirm} disabled={confirmDisabled}>
              {getMessage(confirmLabelKey)}
            </Button>
          </>
        )}
      </Flex>
    </>
  );
}
