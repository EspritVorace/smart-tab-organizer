import React from 'react';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { ExternalLink } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { getShortcutsCustomizeInfo, openShortcutsCustomizePage } from '@/utils/browserUrls';
import { SHORTCUT_GROUPS, type ShortcutDisplay, type ShortcutGroup } from './shortcuts';
import styles from './ShortcutsContent.module.css';

interface ShortcutsContentProps {
  /** Optional override of the groups to display (defaults to SHORTCUT_GROUPS). */
  groups?: ShortcutGroup[];
}

export function ShortcutsContent({ groups = SHORTCUT_GROUPS }: ShortcutsContentProps) {
  const { isDirect } = getShortcutsCustomizeInfo();
  return (
    <Flex direction="column" gap="4" data-testid="shortcuts-content">
      {groups.map((group) => (
        <Box key={group.titleKey}>
          <Text size="2" weight="bold" highContrast className={styles.groupTitle} as="div">
            {getMessage(group.titleKey)}
          </Text>
          <Flex direction="column">
            {group.shortcuts.map((shortcut) => (
              <ShortcutRow key={shortcut.descriptionKey} shortcut={shortcut} />
            ))}
          </Flex>
        </Box>
      ))}
      <Box>
        <Button
          variant="ghost"
          size="1"
          onClick={() => void openShortcutsCustomizePage()}
          data-testid="shortcuts-customize-button"
        >
          <ExternalLink size={12} aria-hidden="true" />
          {getMessage('shortcutsCustomize')}
        </Button>
        {!isDirect && (
          <Text as="p" size="1" className={styles.firefoxHint}>
            {getMessage('shortcutsCustomizeFirefoxHint')}
          </Text>
        )}
      </Box>
    </Flex>
  );
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutDisplay }) {
  return (
    <div className={styles.row}>
      <Text size="2" className={styles.rowDescription}>
        {getMessage(shortcut.descriptionKey)}
      </Text>
      <div className={styles.rowKeys}>
        {shortcut.keys.map((combo, index) => (
          <React.Fragment key={combo}>
            {index > 0 && <span className={styles.altSeparator} aria-hidden="true">/</span>}
            <KeyCombo combo={combo} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function KeyCombo({ combo }: { combo: string }) {
  const tokens = combo.split('+');
  return (
    <Flex gap="1" align="center">
      {tokens.map((token, i) => (
        <React.Fragment key={`${token}-${i}`}>
          {i > 0 && <span className={styles.plus} aria-hidden="true">+</span>}
          <kbd className={styles.kbd}>{token}</kbd>
        </React.Fragment>
      ))}
    </Flex>
  );
}
