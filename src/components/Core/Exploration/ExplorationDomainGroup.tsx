import type { KeyboardEvent } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Badge, Box, Card, Flex, Progress, Separator, Text } from '@radix-ui/themes';
import { Check, ChevronRight } from 'lucide-react';
import { IconBox } from '@/components/UI/IconBox/IconBox.js';
import type { CatalogEntry } from '@/exploration/catalog.js';
import type { ExplorationDomain } from '@/exploration/domains.js';
import { domainLabelKey } from '@/exploration/domains.js';
import type { ExplorationProgress } from '@/types/exploration.js';
import { getEntryState } from '@/exploration/coverage.js';
import { getMessage, type MessageKey } from '@/utils/i18n.js';
import { DOMAIN_ICONS } from './explorationUi.js';
import { CatalogRow } from './CatalogRow.js';
import styles from './Exploration.module.css';

interface ExplorationDomainGroupProps {
  domain: ExplorationDomain;
  entries: CatalogEntry[];
  progress: ExplorationProgress;
  discovered: number;
  total: number;
  percent: number;
  open: boolean;
  /** When true, the group is forced open and the header is not a toggle. */
  forceOpen: boolean;
  onToggle: () => void;
  onToggleMark: (id: string, marked: boolean) => void;
  onGoToUi: (uiTarget: string) => void;
  /** Forwarded to each row to drive Up/Down/Home/End list navigation. */
  onRowKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
  /** Drives Up/Down/Home/End navigation from the group header (across groups). */
  onNavKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
}

/**
 * One collapsible domain card: a header (icon, name, progress bar, ratio, %)
 * plus the list of catalogue rows. When a filter or search is active the group
 * is forced open and the header is rendered as static text, not a toggle.
 */
export function ExplorationDomainGroup({
  domain,
  entries,
  progress,
  discovered,
  total,
  percent,
  open,
  forceOpen,
  onToggle,
  onToggleMark,
  onGoToUi,
  onRowKeyDown,
  onNavKeyDown,
}: ExplorationDomainGroupProps) {
  const name = getMessage(domainLabelKey(domain) as MessageKey);
  const isOpen = forceOpen || open;
  const ariaLabel = `${name} : ${discovered} / ${total}, ${percent} %`;

  // Header keyboard handling. ArrowRight/ArrowLeft expand/collapse the group;
  // Up/Down/Home/End flow through the shared cross-group navigation (the header
  // is a nav item alongside the rows). Enter/Space fall through to the
  // Collapsible.Trigger, which toggles the group.
  const handleHeaderKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (!open) onToggle();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (open) onToggle();
      return;
    }
    onNavKeyDown?.(e);
  };

  const header = (
    <Flex align="center" gap="3" p="3">
      {!forceOpen && (
        <ChevronRight
          size={16}
          aria-hidden="true"
          className={isOpen ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron}
        />
      )}
      <IconBox icon={DOMAIN_ICONS[domain]} size="sm" variant="soft" />
      <Text size="2" weight="medium" style={{ minWidth: 140, lineHeight: 1 }}>
        {name}
      </Text>
      {percent === 100 && (
        <Badge color="green" variant="soft" highContrast size="1">
          <Check size={12} aria-hidden="true" />
          {getMessage('explorationDomainComplete')}
        </Badge>
      )}
      <Box className={styles.domainBar}>
        <Progress value={percent} size="2" aria-hidden="true" />
      </Box>
      <Text size="2" className={styles.numeric} style={{ minWidth: 52, textAlign: 'right', lineHeight: 1 }}>
        <Text as="span" weight="bold">{discovered}</Text>/{total}
      </Text>
      <Text size="2" weight="bold" highContrast className={styles.numeric} style={{ minWidth: 48, textAlign: 'right', lineHeight: 1 }}>
        {percent} %
      </Text>
    </Flex>
  );

  const body = (
    <Box px="3" pb="2" role="list" aria-label={name}>
      {entries.map((entry) => {
        const { state, provenance } = getEntryState(entry, progress);
        return (
          <CatalogRow
            key={entry.id}
            entry={entry}
            state={state}
            provenance={provenance}
            progress={progress}
            onToggleMark={onToggleMark}
            onGoToUi={onGoToUi}
            onRowKeyDown={onRowKeyDown}
          />
        );
      })}
    </Box>
  );

  return (
    <Card data-testid={`exploration-domain-${domain}`}>
      <Collapsible.Root open={isOpen} onOpenChange={forceOpen ? undefined : onToggle}>
        {forceOpen ? (
          <Box aria-label={ariaLabel}>{header}</Box>
        ) : (
          <Collapsible.Trigger asChild>
            <button
              type="button"
              className={styles.domainButton}
              aria-label={ariaLabel}
              aria-expanded={isOpen}
              data-exploration-nav-item=""
              onKeyDown={handleHeaderKeyDown}
            >
              {header}
            </button>
          </Collapsible.Trigger>
        )}
        {isOpen && <Separator size="4" />}
        <Collapsible.Content>{body}</Collapsible.Content>
      </Collapsible.Root>
    </Card>
  );
}
