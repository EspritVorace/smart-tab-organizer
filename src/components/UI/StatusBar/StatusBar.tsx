import React from 'react';
import { Kbd, Text } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { useShortcutsControl } from '@/contexts/ShortcutsControlContext';
import styles from './StatusBar.module.css';

export function StatusBar() {
  const { openShortcuts } = useShortcutsControl();

  return (
    <div data-testid="status-bar" className={styles.statusBar}>
      <button
        type="button"
        data-testid="status-bar-shortcuts"
        className={styles.shortcutsButton}
        aria-label={getMessage('shortcutsPanelToggleAria')}
        title={getMessage('shortcutsPanelToggleAria')}
        onClick={openShortcuts}
      >
        <Kbd size="1">?</Kbd>
        <Text size="1">{getMessage('statusBarShortcutsLabel')}</Text>
      </button>
    </div>
  );
}
