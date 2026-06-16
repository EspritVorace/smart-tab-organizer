import type { KeyboardEvent } from 'react';
import { Badge, Button, Flex, Kbd, Text, Tooltip } from '@radix-ui/themes';
import { ArrowRight, BookOpen, Check, Circle, Lock } from 'lucide-react';
import type { CatalogEntry } from '@/exploration/catalog.js';
import type { EntryDisplayState, DiscoveryProvenance, ExplorationProgress } from '@/types/exploration.js';
import { describeMissing } from '@/exploration/prerequisites.js';
import { discoveredSet } from '@/exploration/coverage.js';
import { getEffectiveBindings } from '@/shortcuts/getEffectiveBindings.js';
import { getMessage } from '@/utils/i18n.js';
import { getDocsUrl } from '@/utils/docsUrl.js';
import { formatMissingPrerequisite } from './explorationUi.js';
import styles from './Exploration.module.css';

/** First default binding of a registry shortcut, rendered for a `<Kbd>` hint. */
function bindingHint(id: string): string {
  const binding = getEffectiveBindings(id)[0];
  return Array.isArray(binding) ? binding.join(' ') : (binding ?? '');
}

const GOTO_KEY = bindingHint('explorationCard.gotoUi');
const DOC_KEY = bindingHint('explorationCard.openDoc');
const MARK_KEY = bindingHint('explorationCard.toggleMark');

interface CatalogRowProps {
  entry: CatalogEntry;
  state: EntryDisplayState;
  provenance: DiscoveryProvenance | null;
  progress: ExplorationProgress;
  onToggleMark: (id: string, marked: boolean) => void;
  onGoToUi: (uiTarget: string) => void;
  /** Forwarded keydown handler driving Up/Down/Home/End list navigation. */
  onRowKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
}

/**
 * One catalogue line. The status is always carried by text (for screen readers
 * and voice control), never by color or shape alone. The status control is:
 * - a toggle (aria-pressed) on a "to-discover" row (mark) and on a manual-only
 *   discovered row (unmark),
 * - static on an automatically discovered row and on a "not-possible" row.
 */
export function CatalogRow({ entry, state, provenance, progress, onToggleMark, onGoToUi, onRowKeyDown }: CatalogRowProps) {
  const label = getMessage(entry.labelKey as Parameters<typeof getMessage>[0]);
  const description = getMessage(entry.descriptionKey as Parameters<typeof getMessage>[0]);

  const missing = state === 'not-possible'
    ? describeMissing(entry.prerequisites, discoveredSet(progress))
    : null;
  const missingText = missing ? formatMissingPrerequisite(missing) : '';
  const prerequisiteText = missingText
    ? getMessage('explorationPrerequisitePrefix', [missingText])
    : '';

  const STATE_TEXT_KEY = {
    discovered: 'explorationStateDiscovered',
    'to-discover': 'explorationStateToDiscover',
    'not-possible': 'explorationStateNotPossible',
  } as const;
  const stateText = getMessage(STATE_TEXT_KEY[state]);

  const rowAriaLabel = prerequisiteText
    ? `${label} : ${stateText}. ${prerequisiteText}`
    : `${label} : ${stateText}`;

  return (
    <Flex
      align="center"
      gap="3"
      py="2"
      role="listitem"
      tabIndex={0}
      aria-label={rowAriaLabel}
      data-testid={`exploration-row-${entry.id}`}
      data-exploration-row=""
      data-entry-id={entry.id}
      data-shortcut-scope="widget:exploration-card"
      data-state={state}
      onKeyDown={onRowKeyDown}
      className={state === 'discovered' ? undefined : styles.rowUndiscovered}
    >
      <StateControl
        entryId={entry.id}
        state={state}
        provenance={provenance}
        stateText={stateText}
        prerequisiteText={prerequisiteText}
        onToggleMark={onToggleMark}
      />

      <Flex direction="column" gap="0" style={{ flex: 1, minWidth: 0 }}>
        <Text size="2" weight="medium" className={styles.rowLabel}>
          {label}
        </Text>
        <Text size="1" color="gray">
          {description}
        </Text>
        {prerequisiteText && (
          <Text size="1" color="gray" data-testid={`exploration-prereq-${entry.id}`}>
            {prerequisiteText}
          </Text>
        )}
      </Flex>

      <Flex align="center" gap="2" style={{ flexShrink: 0 }}>
        <Tooltip
          content={
            <Flex align="center" gap="2" aria-hidden="true">
              {getMessage('explorationGotoUi')}
              {GOTO_KEY && <Kbd>{GOTO_KEY}</Kbd>}
            </Flex>
          }
        >
          <Button
            size="1"
            variant="soft"
            color="gray"
            highContrast
            aria-label={getMessage('explorationGotoUi')}
            aria-keyshortcuts={GOTO_KEY || undefined}
            onClick={() => onGoToUi(entry.uiTarget)}
            data-testid={`exploration-goto-${entry.id}`}
          >
            <ArrowRight size={14} aria-hidden="true" />
            {getMessage('explorationGotoUiShort')}
          </Button>
        </Tooltip>
        {entry.docUrl && (
          <Tooltip
            content={
              <Flex align="center" gap="2" aria-hidden="true">
                {getMessage('explorationReadDoc')}
                {DOC_KEY && <Kbd>{DOC_KEY}</Kbd>}
              </Flex>
            }
          >
            <Button size="1" variant="ghost" color="gray" highContrast asChild>
              <a
                href={getDocsUrl(entry.docUrl)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={getMessage('explorationReadDoc')}
                aria-keyshortcuts={DOC_KEY || undefined}
                data-testid={`exploration-doc-${entry.id}`}
              >
                <BookOpen size={14} aria-hidden="true" />
                {getMessage('explorationReadDocShort')}
              </a>
            </Button>
          </Tooltip>
        )}
      </Flex>
    </Flex>
  );
}

interface StateControlProps {
  entryId: string;
  state: EntryDisplayState;
  provenance: DiscoveryProvenance | null;
  stateText: string;
  prerequisiteText: string;
  onToggleMark: (id: string, marked: boolean) => void;
}

function StateControl({ entryId, state, provenance, stateText, prerequisiteText, onToggleMark }: StateControlProps) {
  // Interactive: to-discover (mark) or manual-only discovered (unmark).
  const isManualOnly = state === 'discovered' && provenance === 'manual';
  const isInteractive = state === 'to-discover' || isManualOnly;

  if (isInteractive) {
    const pressed = isManualOnly;
    const actionLabel = pressed ? getMessage('explorationUnmarkAction') : getMessage('explorationMarkAction');
    return (
      <Tooltip
        content={
          <Flex align="center" gap="2" aria-hidden="true">
            {actionLabel}
            {MARK_KEY && <Kbd>{MARK_KEY}</Kbd>}
          </Flex>
        }
      >
        <button
          type="button"
          aria-pressed={pressed}
          aria-label={actionLabel}
          aria-keyshortcuts={MARK_KEY || undefined}
          onClick={() => onToggleMark(entryId, !pressed)}
          className={styles.markButton}
          style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
          data-testid={`exploration-mark-${entryId}`}
        >
          <Badge color={pressed ? 'green' : 'gray'} variant="soft" highContrast size="2">
            {pressed ? <Check size={13} aria-hidden="true" /> : <Circle size={13} aria-hidden="true" />}
            {stateText}
          </Badge>
        </button>
      </Tooltip>
    );
  }

  // Static: auto-discovered (green) or not-possible (gray + prereq tooltip).
  if (state === 'discovered') {
    return (
      <Badge color="green" variant="soft" highContrast size="2" data-testid={`exploration-badge-${entryId}`}>
        <Check size={13} aria-hidden="true" />
        {stateText}
      </Badge>
    );
  }

  const badge = (
    <Badge color="gray" variant="soft" size="2" data-testid={`exploration-badge-${entryId}`}>
      <Lock size={12} aria-hidden="true" />
      {stateText}
    </Badge>
  );
  return prerequisiteText ? <Tooltip content={prerequisiteText}>{badge}</Tooltip> : badge;
}
