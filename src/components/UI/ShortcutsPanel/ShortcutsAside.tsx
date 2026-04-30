import React, { useEffect, useRef } from 'react';
import { Flex, IconButton, Text } from '@radix-ui/themes';
import { Keyboard, X } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { ShortcutsContent } from './ShortcutsContent';
import styles from './ShortcutsAside.module.css';

interface ShortcutsAsideProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Non-modal side panel used in the options page. Unlike a Radix Dialog this
 * stays inline in the layout (squeeze) and the rest of the page remains
 * interactive while the panel is visible.
 *
 * Focus management: when opening, the previously-focused element is captured
 * and the close button takes focus. On close, focus is restored.
 */
export function ShortcutsAside({ open, onClose }: ShortcutsAsideProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      // Wait one frame so the panel is in the DOM and visible.
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    } else if (!open && wasOpenRef.current) {
      previousActiveElementRef.current?.focus?.();
      previousActiveElementRef.current = null;
    }
    wasOpenRef.current = open;
  }, [open]);

  return (
    <aside
      data-testid="shortcuts-aside"
      data-state={open ? 'open' : 'closed'}
      aria-label={getMessage('shortcutsPanelTitle')}
      aria-hidden={!open}
      className={`${styles.aside} ${open ? styles.asideOpen : styles.asideClosed}`}
    >
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Keyboard size={16} aria-hidden="true" />
          <Text size="2" weight="bold">
            {getMessage('shortcutsPanelTitle')}
          </Text>
        </div>
        <IconButton
          ref={closeButtonRef}
          size="1"
          variant="ghost"
          color="gray"
          aria-label={getMessage('shortcutsPanelClose')}
          title={getMessage('shortcutsPanelClose')}
          onClick={onClose}
          tabIndex={open ? 0 : -1}
          data-testid="shortcuts-aside-close"
        >
          <X size={14} aria-hidden="true" />
        </IconButton>
      </div>
      <Flex direction="column" className={styles.body}>
        <ShortcutsContent />
      </Flex>
    </aside>
  );
}
