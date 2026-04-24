import React from 'react';
import { Button, Dialog } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { ExportSplitButton } from './ExportSplitButton';
import type { ExportActions } from './useExportActions';

interface ExportWizardFooterProps {
  /** i18n key for the primary export button label. */
  labelKey: string;
  actions: ExportActions;
  disabled: boolean;
}

/**
 * Shared footer for export wizards (rules and sessions).
 *
 * Renders a Cancel button (wrapped in Dialog.Close) and the primary
 * ExportSplitButton offering file and clipboard export options.
 */
export function ExportWizardFooter({ labelKey, actions, disabled }: ExportWizardFooterProps) {
  return (
    <>
      <Dialog.Close>
        <Button variant="soft" color="gray">{getMessage('cancel')}</Button>
      </Dialog.Close>
      <ExportSplitButton labelKey={labelKey} actions={actions} disabled={disabled} />
    </>
  );
}
