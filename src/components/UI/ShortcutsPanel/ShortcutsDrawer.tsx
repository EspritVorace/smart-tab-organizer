import React, { useCallback } from 'react';
import { Box, Dialog, Flex } from '@radix-ui/themes';
import { Keyboard } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { DialogCloseButton } from '@/components/UI/DialogShell';
import { ShortcutsContent } from './ShortcutsContent';
import { POPUP_SHORTCUT_GROUPS } from './shortcuts';
import styles from './ShortcutsDrawer.module.css';

interface ShortcutsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Slide-from-right drawer used inside the popup. Covers the full popup
 * viewport (400px x popup height). The Radix Dialog auto-portals to
 * document.body which, in a browser-action popup, is the popup document
 * itself. Only popup-relevant shortcut groups are displayed.
 */
export function ShortcutsDrawer({ open, onOpenChange }: ShortcutsDrawerProps) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === '?' && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        onOpenChange(false);
      }
    },
    [onOpenChange],
  );

  const preventClose = useCallback((event: Event) => {
    event.preventDefault();
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        data-testid="shortcuts-drawer"
        className={styles.drawerContent}
        onPointerDownOutside={preventClose}
        onInteractOutside={preventClose}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.drawerHeader}>
          <Flex align="center" gap="2" className={styles.drawerHeaderTitle}>
            <Keyboard size={16} aria-hidden="true" />
            <Dialog.Title size="3" mb="0">
              {getMessage('shortcutsPanelTitle')}
            </Dialog.Title>
          </Flex>
          <DialogCloseButton iconSize={14} />
        </div>
        <Box className={styles.drawerBody}>
          <Dialog.Description size="1" color="gray" mb="3">
            {getMessage('shortcutsPanelDescription')}
          </Dialog.Description>
          <ShortcutsContent groups={POPUP_SHORTCUT_GROUPS} />
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
}
