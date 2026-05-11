import React, { useEffect, useRef } from 'react';
import { Flex, IconButton, Text } from '@radix-ui/themes';
import { Keyboard, X } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { ShortcutsContent, focusFirstOpenTrigger } from './ShortcutsContent';
import type { PageContext } from '@/shortcuts/groups';
import styles from './ShortcutsAside.module.css';

interface ShortcutsAsideProps {
  open: boolean;
  onClose: () => void;
  /**
   * Active page in the options surface. Forwarded to ShortcutsContent so
   * groups irrelevant to the current page start collapsed. Changing the
   * context resets the open/closed state of every group.
   */
  pageContext?: PageContext;
}

/**
 * Non-modal side panel used in the options page. Unlike a Radix Dialog this
 * stays inline in the layout (squeeze) and the rest of the page remains
 * interactive while the panel is visible.
 *
 * Focus management: when opening, the previously-focused element is captured
 * and the close button takes focus. On close, focus is restored.
 */
export function ShortcutsAside({ open, onClose, pageContext }: ShortcutsAsideProps) {
  const asideRef = useRef<HTMLElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      // Wait one frame so the panel is in the DOM and visible.
      requestAnimationFrame(() => focusFirstOpenTrigger(asideRef.current));
    } else if (!open && wasOpenRef.current) {
      previousActiveElementRef.current?.focus?.();
      previousActiveElementRef.current = null;
    }
    wasOpenRef.current = open;
  }, [open]);

  // Use the inert attribute (rather than aria-hidden + tabindex=-1) when closed,
  // so the panel and its children are removed from interaction and the AT tree
  // without triggering the aria-hidden-focus axe rule. React 18 typings do not
  // expose inert as a prop, so we toggle it via the ref.
  useEffect(() => {
    const node = asideRef.current;
    if (!node) return;
    if (open) {
      node.removeAttribute('inert');
    } else {
      node.setAttribute('inert', '');
    }
  }, [open]);

  return (
    <aside
      ref={asideRef}
      data-testid="shortcuts-aside"
      data-state={open ? 'open' : 'closed'}
      aria-label={getMessage('shortcutsPanelTitle')}
      className={`${styles.aside} ${open ? styles.asideOpen : styles.asideClosed}`}
    >
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Keyboard size={16} />
          <Text size="2" weight="bold">
            {getMessage('shortcutsPanelTitle')}
          </Text>
        </div>
        <IconButton
          size="1"
          variant="ghost"
          color="gray"
          aria-label={getMessage('shortcutsPanelClose')}
          title={getMessage('shortcutsPanelClose')}
          onClick={onClose}
          data-testid="shortcuts-aside-close"
        >
          <X size={14} />
        </IconButton>
      </div>
      <Flex direction="column" className={styles.body}>
        <ShortcutsContent key={pageContext} surface="options" pageContext={pageContext} />
      </Flex>
    </aside>
  );
}
