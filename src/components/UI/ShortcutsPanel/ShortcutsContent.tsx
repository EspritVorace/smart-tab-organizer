import React, { useState } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Box, Button, Flex, Kbd, Text } from '@radix-ui/themes';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { getShortcutsCustomizeInfo, openShortcutsCustomizePage } from '@/utils/browserUrls';
import { useBrowserCommands, type BrowserCommandsMap } from '@/hooks/useBrowserCommands';
import {
  getDisplayTree,
  isGroupOpenByDefault,
  type DisplayGroup,
  type PageContext,
  type ShortcutGroupDescriptor,
  type Surface,
} from '@/shortcuts/groups';
import { getShortcutsByGroup } from '@/shortcuts/registry';
import type { Binding, ShortcutEntry } from '@/shortcuts/types';
import {
  formatSequenceForA11y,
  tokenizeComboForDisplay,
} from '@/utils/shortcutDisplay';
import styles from './ShortcutsContent.module.css';

interface ShortcutsContentProps {
  /**
   * Surface this panel renders into. Drives both group filtering
   * (`VISIBLE_GROUPS_BY_SURFACE`) and structural choices (SessionCard
   * top-level on popup, nested under Home/Sessions on options).
   */
  surface: Surface;
  /**
   * Active page on the options surface. Each group's initial expanded state
   * is derived from `isGroupOpenByDefault`. When omitted (popup drawer or
   * Storybook), every group starts expanded.
   */
  pageContext?: PageContext;
}

interface ResolvedKeys {
  keys: Binding[];
  unbound: boolean;
}

function resolveKeys(
  entry: ShortcutEntry,
  liveCommands: BrowserCommandsMap | null,
): ResolvedKeys {
  if (!entry.commandName || liveCommands === null) {
    return { keys: entry.defaultBindings, unbound: false };
  }
  const live = liveCommands[entry.commandName];
  if (live === undefined) return { keys: entry.defaultBindings, unbound: false };
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

function flattenDisplayTree(tree: DisplayGroup[]): ShortcutGroupDescriptor[] {
  return tree.flatMap((node) => [node.descriptor, ...node.subgroups]);
}

export function ShortcutsContent({ surface, pageContext }: ShortcutsContentProps) {
  const { isDirect } = getShortcutsCustomizeInfo();
  const liveCommands = useBrowserCommands();
  const tree = getDisplayTree(surface);
  const hasUnbound =
    !!liveCommands &&
    flattenDisplayTree(tree).some((descriptor) =>
      getShortcutsByGroup(descriptor.id).some(
        (entry) => resolveKeys(entry, liveCommands).unbound,
      ),
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
      {tree.map((node) => (
        <CollapsibleGroup
          key={node.descriptor.id}
          descriptor={node.descriptor}
          subgroups={node.subgroups}
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
  descriptor,
  subgroups,
  pageContext,
  liveCommands,
  nested,
}: {
  descriptor: ShortcutGroupDescriptor;
  subgroups: ShortcutGroupDescriptor[];
  pageContext?: PageContext;
  liveCommands: BrowserCommandsMap | null;
  nested: boolean;
}) {
  const [open, setOpen] = useState(() =>
    pageContext === undefined ? true : isGroupOpenByDefault(descriptor.id, pageContext),
  );
  const entries = getShortcutsByGroup(descriptor.id);
  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      data-group-id={descriptor.id}
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
            {getMessage(descriptor.titleKey)}
          </Text>
          <ChevronDown size={14} className={styles.chevron} />
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Flex direction="column">
          {entries.map((entry) => (
            <ShortcutRow
              key={entry.id}
              entry={entry}
              liveCommands={liveCommands}
            />
          ))}
          {subgroups.map((sub) => (
            <CollapsibleGroup
              key={sub.id}
              descriptor={sub}
              subgroups={[]}
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

function bindingKey(binding: Binding): string {
  return typeof binding === 'string' ? binding : binding.join('|');
}

function ShortcutRow({
  entry,
  liveCommands,
}: {
  entry: ShortcutEntry;
  liveCommands: BrowserCommandsMap | null;
}) {
  const { keys, unbound } = resolveKeys(entry, liveCommands);
  return (
    <div className={styles.row}>
      <Text size="2" className={styles.rowDescription}>
        {getMessage(entry.descriptionKey)}
      </Text>
      <div className={styles.rowKeys}>
        {unbound ? (
          <span className={styles.unboundLabel} data-testid="shortcut-unbound">
            {getMessage('shortcutNotSet')}
          </span>
        ) : (
          keys.map((binding, index) => (
            <React.Fragment key={bindingKey(binding)}>
              {index > 0 && <span className={styles.altSeparator} aria-hidden="true">/</span>}
              <KeyCombo binding={binding} />
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
}

function SimpleCombo({ combo }: { combo: string }) {
  const tokens = tokenizeComboForDisplay(combo);
  return (
    <Flex gap="1" align="center">
      {tokens.map((token, i) => (
        <React.Fragment key={`${token.display}-${i}`}>
          {i > 0 && <span className={styles.plus} aria-hidden="true">+</span>}
          <Kbd size="1" aria-label={token.accessibleLabel}>{token.display}</Kbd>
        </React.Fragment>
      ))}
    </Flex>
  );
}

function KeyCombo({ binding }: { binding: Binding }) {
  if (typeof binding === 'string') {
    return <SimpleCombo combo={binding} />;
  }
  const separator = getMessage('shortcutSequenceSeparator');
  return (
    <Flex gap="1" align="center" aria-label={formatSequenceForA11y(binding, separator)}>
      {binding.map((combo, i) => (
        <React.Fragment key={`${combo}-${i}`}>
          {i > 0 && (
            <Text size="1" color="gray" className={styles.sequenceSeparator} aria-hidden="true">
              {separator}
            </Text>
          )}
          <SimpleCombo combo={combo} />
        </React.Fragment>
      ))}
    </Flex>
  );
}
