import React, { useState } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Box, Button, Flex, Kbd, Text } from '@radix-ui/themes';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { getShortcutsCustomizeInfo, openShortcutsCustomizePage } from '@/utils/browserUrls';
import { useBrowserCommands, type BrowserCommandsMap } from '@/hooks/useBrowserCommands';
import {
  SHORTCUT_GROUPS,
  isGroupOpenByDefault,
  type PageContext,
  type ShortcutDisplay,
  type ShortcutGroup,
} from './shortcuts';
import styles from './ShortcutsContent.module.css';

interface ShortcutsContentProps {
  /** Optional override of the groups to display (defaults to SHORTCUT_GROUPS). */
  groups?: ShortcutGroup[];
  /**
   * When provided, each group's initial expanded state is derived from the
   * page context (see `isGroupOpenByDefault`). When omitted, all groups start
   * expanded so non-contextual surfaces (Storybook, popup drawer) keep their
   * historical behaviour.
   */
  pageContext?: PageContext;
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

const TRIGGER_SELECTOR = '[data-shortcut-group-trigger]';

function getTriggers(container: HTMLElement | null): HTMLButtonElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLButtonElement>(TRIGGER_SELECTOR)).filter(
    (el) => el.offsetParent !== null,
  );
}

/**
 * Focus the first group trigger that is currently open. Falls back to the
 * very first trigger when no section is open. No-op when the container is
 * empty or null.
 */
export function focusFirstOpenTrigger(container: HTMLElement | null): void {
  const triggers = getTriggers(container);
  if (triggers.length === 0) return;
  const open = triggers.find((t) => t.getAttribute('data-state') === 'open');
  (open ?? triggers[0]).focus();
}

function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
  const target = event.target as HTMLElement | null;
  if (!target?.matches(TRIGGER_SELECTOR)) return;

  const triggers = getTriggers(event.currentTarget);
  if (triggers.length === 0) return;
  const currentIndex = triggers.indexOf(target as HTMLButtonElement);
  if (currentIndex === -1) return;

  let nextIndex: number | null = null;
  switch (event.key) {
    case 'ArrowDown':
      nextIndex = Math.min(currentIndex + 1, triggers.length - 1);
      break;
    case 'ArrowUp':
      nextIndex = Math.max(currentIndex - 1, 0);
      break;
    case 'Home':
      nextIndex = 0;
      break;
    case 'End':
      nextIndex = triggers.length - 1;
      break;
    default:
      return;
  }

  if (nextIndex !== null && nextIndex !== currentIndex) {
    event.preventDefault();
    triggers[nextIndex].focus();
  } else if (nextIndex === currentIndex) {
    event.preventDefault();
  }
}

export function ShortcutsContent({ groups = SHORTCUT_GROUPS, pageContext }: ShortcutsContentProps) {
  const { isDirect } = getShortcutsCustomizeInfo();
  const liveCommands = useBrowserCommands();
  const hasUnbound = !!liveCommands && groups.some((group) =>
    group.shortcuts.some((s) => resolveKeys(s, liveCommands).unbound),
  );
  return (
    <Flex direction="column" gap="4" data-testid="shortcuts-content" onKeyDown={handleTriggerKeyDown}>
      {hasUnbound && (
        <Box className={styles.unboundBanner} data-testid="shortcuts-unbound-banner">
          <Text size="1" as="p">
            {getMessage('shortcutsUnboundWarning')}
          </Text>
        </Box>
      )}
      {groups.map((group) => (
        <CollapsibleGroup
          key={group.titleKey}
          group={group}
          pageContext={pageContext}
          liveCommands={liveCommands}
          nested={false}
        />
      ))}
      <Box>
        <Button
          variant={hasUnbound ? 'soft' : 'ghost'}
          size="1"
          onClick={() => void openShortcutsCustomizePage()}
          data-testid="shortcuts-customize-button"
        >
          <ExternalLink size={12} />
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

function CollapsibleGroup({
  group,
  pageContext,
  liveCommands,
  nested,
}: {
  group: ShortcutGroup;
  pageContext?: PageContext;
  liveCommands: BrowserCommandsMap | null;
  nested: boolean;
}) {
  const [open, setOpen] = useState(() =>
    pageContext === undefined ? true : isGroupOpenByDefault(group.titleKey, pageContext),
  );
  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      data-group-title={group.titleKey}
      className={nested ? styles.nestedGroup : undefined}
    >
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className={styles.groupTrigger}
          data-state={open ? 'open' : 'closed'}
          data-shortcut-group-trigger=""
        >
          <Text
            size={nested ? '1' : '2'}
            weight="bold"
            highContrast={!nested}
            color={nested ? 'gray' : undefined}
            className={styles.groupTitle}
            as="div"
          >
            {getMessage(group.titleKey)}
          </Text>
          <ChevronDown size={14} className={styles.chevron} />
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Flex direction="column">
          {group.shortcuts.map((shortcut) => (
            <ShortcutRow
              key={shortcut.descriptionKey}
              shortcut={shortcut}
              liveCommands={liveCommands}
            />
          ))}
          {group.subgroups?.map((sub) => (
            <CollapsibleGroup
              key={sub.titleKey}
              group={sub}
              pageContext={pageContext}
              liveCommands={liveCommands}
              nested
            />
          ))}
        </Flex>
      </Collapsible.Content>
    </Collapsible.Root>
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
