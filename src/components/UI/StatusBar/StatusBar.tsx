import React from 'react';
import { Text } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { useShortcutsControl } from '@/contexts/ShortcutsControlContext';
import styles from './StatusBar.module.css';

export function StatusBar() {
  const { openShortcuts, version } = useShortcutsControl();

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
        <kbd className={styles.kbd}>?</kbd>
        <Text size="1">{getMessage('statusBarShortcutsLabel')}</Text>
      </button>
      <span data-testid="status-bar-version" className={styles.version}>
        v{version}
      </span>
    </div>
  );
}
