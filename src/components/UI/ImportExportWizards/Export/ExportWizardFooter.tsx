import React from 'react';
import { Button, Dialog, Flex } from '@radix-ui/themes';
import { ClipboardCopy, FileDown } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import type { ExportActions } from './useExportActions';

interface ExportWizardFooterProps {
  /**
   * Kept for backwards compatibility with the previous split-button API.
   * No longer used: each action now has its own dedicated button labelled
   * "JSON File" / "Clipboard", which is clearer and avoids the nested
   * DropdownMenu-inside-Dialog overlay race (see commit history).
   */
  labelKey?: string;
  actions: ExportActions;
  disabled: boolean;
  cancelTestId?: string;
  primaryTestId?: string;
  clipboardTestId?: string;
}

/**
 * Shared footer for export wizards (rules and sessions).
 *
 * Renders a Cancel button (wrapped in Dialog.Close) and two side-by-side
 * action buttons, one per export destination. Splitting the actions into
 * dedicated buttons (instead of the previous split-button + DropdownMenu)
 * avoids the Radix react-dismissable-layer race that leaked
 * `body { pointer-events: none }` and froze the Options page after a
 * clipboard export.
 */
export function ExportWizardFooter({
  actions,
  disabled,
  cancelTestId,
  primaryTestId,
  clipboardTestId,
}: ExportWizardFooterProps) {
  return (
    <>
      <Dialog.Close>
        <Button variant="soft" color="gray" data-testid={cancelTestId}>{getMessage('cancel')}</Button>
      </Dialog.Close>
      <Flex gap="2">
        <Button
          variant="soft"
          onClick={actions.exportToClipboard}
          disabled={disabled}
          data-testid={clipboardTestId}
        >
          <ClipboardCopy size={14} aria-hidden="true" />
          {getMessage('exportToClipboard')}
        </Button>
        <Button
          onClick={actions.exportToFile}
          disabled={disabled}
          data-testid={primaryTestId}
        >
          <FileDown size={14} aria-hidden="true" />
          {getMessage('exportToFile')}
        </Button>
      </Flex>
    </>
  );
}
