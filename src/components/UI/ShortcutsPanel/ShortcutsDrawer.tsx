import React from 'react';
import { Box, Dialog, Flex } from '@radix-ui/themes';
import { Keyboard } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { DialogCloseButton } from '@/components/UI/DialogShell';
import { ShortcutsContent } from './ShortcutsContent';

interface ShortcutsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal drawer used inside the popup. The Radix Dialog auto-portals to
 * document.body which, in a browser-action popup, is the popup document
 * itself. Sized to fit the typical 400px popup viewport.
 */
export function ShortcutsDrawer({ open, onOpenChange }: ShortcutsDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        data-testid="shortcuts-drawer"
        size="1"
        maxWidth="92vw"
        style={{ maxHeight: '90vh', overflow: 'auto' }}
      >
        <Flex align="center" gap="2" mb="1">
          <Keyboard size={16} aria-hidden="true" />
          <Dialog.Title size="3" mb="0">
            {getMessage('shortcutsPanelTitle')}
          </Dialog.Title>
        </Flex>
        <Dialog.Description size="1" color="gray" mb="3">
          {getMessage('shortcutsPanelDescription')}
        </Dialog.Description>
        <DialogCloseButton iconSize={14} style={{ position: 'absolute', top: 12, right: 12 }} />
        <Box>
          <ShortcutsContent />
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
}
