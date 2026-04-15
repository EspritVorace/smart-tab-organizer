import React from 'react';
import { ClipboardCopy, FileDown } from 'lucide-react';
import { SplitButton } from '../../SplitButton/SplitButton';
import { getMessage } from '../../../../utils/i18n';
import type { ExportActions } from './useExportActions';

interface ExportSplitButtonProps {
  /** i18n key for the primary button label (`exportButton`, `exportSessionsButton`, ...). */
  labelKey: string;
  actions: ExportActions;
  disabled: boolean;
}

/**
 * Primary export button with a popover menu offering file vs. clipboard
 * export. Both entries call the handlers returned by `useExportActions`.
 */
export function ExportSplitButton({ labelKey, actions, disabled }: ExportSplitButtonProps) {
  return (
    <SplitButton
      label={getMessage(labelKey)}
      onClick={actions.exportToFile}
      ariaLabel={getMessage('exportOptions')}
      disabled={disabled}
      menuItems={[
        {
          label: getMessage('exportToFile'),
          icon: <FileDown size={14} aria-hidden="true" />,
          onClick: actions.exportToFile,
        },
        {
          label: getMessage('exportToClipboard'),
          icon: <ClipboardCopy size={14} aria-hidden="true" />,
          onClick: actions.exportToClipboard,
        },
      ]}
    />
  );
}
