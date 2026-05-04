import React from 'react';
import { ClipboardCopy, FileDown } from 'lucide-react';
import { SplitButton } from '@/components/UI/SplitButton/SplitButton';
import { getMessage } from '@/utils/i18n';
import type { ExportActions } from './useExportActions';

interface ExportSplitButtonProps {
  /** i18n key for the primary button label (`exportButton`, `exportSessionsButton`, ...). */
  labelKey: string;
  actions: ExportActions;
  disabled: boolean;
  /** data-testid forwarded to the primary (file) button. */
  primaryTestId?: string;
  /** data-testid forwarded to the clipboard menu item. */
  clipboardTestId?: string;
}

/**
 * Primary export button with a popover menu offering file vs. clipboard
 * export. Both entries call the handlers returned by `useExportActions`.
 */
export function ExportSplitButton({
  labelKey,
  actions,
  disabled,
  primaryTestId,
  clipboardTestId,
}: ExportSplitButtonProps) {
  return (
    <SplitButton
      label={getMessage(labelKey)}
      onClick={actions.exportToFile}
      ariaLabel={getMessage('exportOptions')}
      disabled={disabled}
      data-testid={primaryTestId}
      menuItems={[
        {
          label: getMessage('exportToFile'),
          icon: <FileDown size={14} />,
          onClick: actions.exportToFile,
        },
        {
          label: getMessage('exportToClipboard'),
          icon: <ClipboardCopy size={14} />,
          onClick: actions.exportToClipboard,
          'data-testid': clipboardTestId,
        },
      ]}
    />
  );
}
