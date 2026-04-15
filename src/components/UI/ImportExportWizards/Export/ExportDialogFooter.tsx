import React from 'react';
import { Button, Dialog, Flex, Separator } from '@radix-ui/themes';
import { getMessage } from '../../../../utils/i18n';

interface ExportDialogFooterProps {
  /** Typically the `<ExportSplitButton>` for the wizard. */
  children: React.ReactNode;
}

/**
 * Separator + right-aligned Cancel button + caller-provided primary action
 * used at the bottom of every export wizard.
 */
export function ExportDialogFooter({ children }: ExportDialogFooterProps) {
  return (
    <>
      <Separator size="4" mt="4" style={{ opacity: 0.3 }} />
      <Flex gap="3" justify="end" mt="3">
        <Dialog.Close>
          <Button variant="soft" color="gray">{getMessage('cancel')}</Button>
        </Dialog.Close>
        {children}
      </Flex>
    </>
  );
}
