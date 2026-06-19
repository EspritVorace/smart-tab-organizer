import React from 'react';
import { Button, Dialog, Flex } from '@radix-ui/themes';
import { ClipboardCopy, FileDown } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { WizardNavTooltip } from '@/components/UI/WizardModal';
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
 * Layout: Cancel on the far left (`mr="auto"` absorbs the space inside the
 * parent `WizardModal.Footer`'s `justify="end"` Flex), and the two action
 * buttons grouped on the right. This dissociates the "abandon" affordance
 * from the destination choice, following the common dialog convention.
 * Splitting the actions into dedicated buttons (instead of the previous
 * split-button + DropdownMenu) also avoids the Radix
 * react-dismissable-layer race that leaked `body { pointer-events: none }`
 * and froze the Options page after a clipboard export.
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
        <Button variant="soft" color="gray" mr="auto" data-testid={cancelTestId}>
          {getMessage('cancel')}
        </Button>
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
        <WizardNavTooltip kind="next" hidden={disabled}>
          <Button
            onClick={actions.exportToFile}
            disabled={disabled}
            data-testid={primaryTestId}
          >
            <FileDown size={14} aria-hidden="true" />
            {getMessage('exportToFile')}
          </Button>
        </WizardNavTooltip>
      </Flex>
    </>
  );
}
