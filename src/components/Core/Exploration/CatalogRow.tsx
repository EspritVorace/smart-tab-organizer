import { Badge, Flex, IconButton, Text, Tooltip } from '@radix-ui/themes';
import { ArrowRight, BookOpen, Check, Circle, Lock } from 'lucide-react';
import type { CatalogEntry } from '@/exploration/catalog.js';
import type { EntryDisplayState, DiscoveryProvenance, ExplorationProgress } from '@/types/exploration.js';
import { describeMissing } from '@/exploration/prerequisites.js';
import { discoveredSet } from '@/exploration/coverage.js';
import { getMessage } from '@/utils/i18n.js';
import { getDocsUrl } from '@/utils/docsUrl.js';
import { formatMissingPrerequisite } from './explorationUi.js';
import styles from './Exploration.module.css';

interface CatalogRowProps {
  entry: CatalogEntry;
  state: EntryDisplayState;
  provenance: DiscoveryProvenance | null;
  progress: ExplorationProgress;
  onToggleMark: (id: string, marked: boolean) => void;
  onGoToUi: (uiTarget: string) => void;
}

/**
 * One catalogue line. The status is always carried by text (for screen readers
 * and voice control), never by color or shape alone. The status control is:
 * - a toggle (aria-pressed) on a "to-discover" row (mark) and on a manual-only
 *   discovered row (unmark),
 * - static on an automatically discovered row and on a "not-possible" row.
 */
export function CatalogRow({ entry, state, provenance, progress, onToggleMark, onGoToUi }: CatalogRowProps) {
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
      aria-label={rowAriaLabel}
      data-testid={`exploration-row-${entry.id}`}
      data-state={state}
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

      <Flex align="center" gap="1">
        <Tooltip content={getMessage('explorationGotoUi')}>
          <IconButton
            size="1"
            variant="ghost"
            color="gray"
            aria-label={getMessage('explorationGotoUi')}
            onClick={() => onGoToUi(entry.uiTarget)}
            data-testid={`exploration-goto-${entry.id}`}
          >
            <ArrowRight size={15} aria-hidden="true" />
          </IconButton>
        </Tooltip>
        {entry.docUrl && (
          <Tooltip content={getMessage('explorationReadDoc')}>
            <IconButton
              size="1"
              variant="ghost"
              color="gray"
              aria-label={getMessage('explorationReadDoc')}
              asChild
            >
              <a href={getDocsUrl(entry.docUrl)} target="_blank" rel="noopener noreferrer">
                <BookOpen size={15} aria-hidden="true" />
              </a>
            </IconButton>
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
      <button
        type="button"
        aria-pressed={pressed}
        aria-label={actionLabel}
        title={actionLabel}
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
