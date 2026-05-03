import React from 'react';
import { Box, Button, Flex, Kbd, Text } from '@radix-ui/themes';
import { ExternalLink } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { getShortcutsCustomizeInfo, openShortcutsCustomizePage } from '@/utils/browserUrls';
import { useBrowserCommands, type BrowserCommandsMap } from '@/hooks/useBrowserCommands';
import { SHORTCUT_GROUPS, type ShortcutDisplay, type ShortcutGroup } from './shortcuts';
import styles from './ShortcutsContent.module.css';

interface ShortcutsContentProps {
  /** Optional override of the groups to display (defaults to SHORTCUT_GROUPS). */
  groups?: ShortcutGroup[];
}

function resolveKeys(
  shortcut: ShortcutDisplay,
  liveCommands: BrowserCommandsMap | null,
): { keys: string[]; unbound: boolean } {
  if (!shortcut.commandName || liveCommands === null) {
    return { keys: shortcut.keys, unbound: false };
  }
  const live = liveCommands[shortcut.commandName];
  if (live === undefined) return { keys: shortcut.keys, unbound: false };
  if (live === '') return { keys: [], unbound: true };
  return { keys: [live], unbound: false };
}

export function ShortcutsContent({ groups = SHORTCUT_GROUPS }: ShortcutsContentProps) {
  const { isDirect } = getShortcutsCustomizeInfo();
  const liveCommands = useBrowserCommands();
  const hasUnbound = !!liveCommands && groups.some((group) =>
    group.shortcuts.some((s) => resolveKeys(s, liveCommands).unbound),
  );
  return (
    <Flex direction="column" gap="4" data-testid="shortcuts-content">
      {hasUnbound && (
        <Box className={styles.unboundBanner} data-testid="shortcuts-unbound-banner">
          <Text size="1" as="p">
            {getMessage('shortcutsUnboundWarning')}
          </Text>
        </Box>
      )}
      {groups.map((group) => (
        <Box key={group.titleKey} data-group-title={group.titleKey}>
          <Text size="2" weight="bold" highContrast className={styles.groupTitle} as="div">
            {getMessage(group.titleKey)}
          </Text>
          <Flex direction="column">
            {group.shortcuts.map((shortcut) => (
              <ShortcutRow
                key={shortcut.descriptionKey}
                shortcut={shortcut}
                liveCommands={liveCommands}
              />
            ))}
          </Flex>
        </Box>
      ))}
      <Box>
        <Button
          variant={hasUnbound ? 'soft' : 'ghost'}
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

function ShortcutRow({
  shortcut,
  liveCommands,
}: {
  shortcut: ShortcutDisplay;
  liveCommands: BrowserCommandsMap | null;
}) {
  const { keys, unbound } = resolveKeys(shortcut, liveCommands);
  return (
    <div className={styles.row}>
      <Text size="2" className={styles.rowDescription}>
        {getMessage(shortcut.descriptionKey)}
      </Text>
      <div className={styles.rowKeys}>
        {unbound ? (
          <span className={styles.unboundLabel} data-testid="shortcut-unbound">
            {getMessage('shortcutNotSet')}
          </span>
        ) : (
          keys.map((combo, index) => (
            <React.Fragment key={combo}>
              {index > 0 && <span className={styles.altSeparator} aria-hidden="true">/</span>}
              <KeyCombo combo={combo} />
            </React.Fragment>
          ))
        )}
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
          <Kbd size="1">{token}</Kbd>
        </React.Fragment>
      ))}
    </Flex>
  );
}
