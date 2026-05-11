import React from 'react';
import { Dialog, IconButton } from '@radix-ui/themes';
import { X } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

interface DialogCloseButtonProps {
  /** Lucide X icon size in px. Default 16. */
  iconSize?: number;
  /** Absolute positioning (and any extra) on the IconButton. */
  style?: React.CSSProperties;
}

/**
 * Top-right close button shared by every Radix Dialog variant in the app
 * (DialogShell, ShortcutsDrawer, ...). Wraps the standard ghost gray
 * IconButton with the localized close label and an `X` icon.
 */
export function DialogCloseButton({ iconSize = 16, style }: DialogCloseButtonProps) {
  return (
    <Dialog.Close>
      <IconButton
        size="1"
        variant="ghost"
        color="gray"
        aria-label={getMessage('close')}
        title={getMessage('close')}
        style={style}
      >
        <X size={iconSize} />
      </IconButton>
    </Dialog.Close>
  );
}
