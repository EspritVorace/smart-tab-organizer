import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Flex, SegmentedControl, Text } from '@radix-ui/themes';
import { Command } from 'cmdk';
import { AppWindow, ShieldCheck } from 'lucide-react';
import { getMessage, getPluralMessage } from '@/utils/i18n';
import { DialogShell } from '@/components/UI/DialogShell/DialogShell';
import { SearchableInlineList } from '@/components/Form/FormFields/SearchableInlineList';
import type { SearchableSelectOption } from '@/components/Form/FormFields/SearchableSelect';
import type { TabCoverageEntry } from '@/utils/tabCoverage';
import './TabCoveragePanel.css';

interface TabCoveragePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Distinct hosts found across the open tabs, already sorted for display. */
  entries: TabCoverageEntry[];
  /** Seed the step 1 domain filter field with the chosen value, then close. */
  onSeed: (value: string) => void;
}

type Level = 'registrable' | 'host';

/** Accessible name of a row: host, optional managed badge, then the tab count. */
function rowAccessibleName(entry: TabCoverageEntry): string {
  const tabCount = getPluralMessage(
    entry.tabCount,
    'tabCoverageTabCountOne',
    'tabCoverageTabCount',
  );
  return entry.covered
    ? `${entry.host} · ${getMessage('tabCoverageBadgeManaged')} · ${tabCount}`
    : `${entry.host} · ${tabCount}`;
}

/**
 * Discovery dialog that lists the domains found across the open tabs so the
 * step 1 domain filter can be seeded from a real browsing context. Two steps:
 * pick a host, then pick the seeding level (registrable domain or full host).
 * The only write action is `onSeed`.
 */
export function TabCoveragePanel({ open, onOpenChange, entries, onSeed }: TabCoveragePanelProps) {
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>('registrable');

  // Reset the two-step flow every time the dialog opens.
  useEffect(() => {
    if (open) {
      setSelectedHost(null);
      setLevel('registrable');
    }
  }, [open]);

  const entryByHost = useMemo(
    () => new Map(entries.map((e) => [e.host, e])),
    [entries],
  );

  const options = useMemo<SearchableSelectOption[]>(
    () => entries.map((e) => ({ value: e.host, label: e.host })),
    [entries],
  );

  const selectedEntry = selectedHost ? entryByHost.get(selectedHost) ?? null : null;

  const handleSelect = (host: string) => {
    const entry = entryByHost.get(host);
    if (!entry) return;
    // Nothing to choose when the registrable domain equals the host: seed now.
    if (entry.registrableDomain === entry.host) {
      onSeed(entry.host);
      onOpenChange(false);
      return;
    }
    setLevel('registrable');
    setSelectedHost(host);
  };

  const handleConfirm = () => {
    if (!selectedEntry) return;
    onSeed(level === 'registrable' ? selectedEntry.registrableDomain : selectedEntry.host);
    onOpenChange(false);
  };

  const resultAnnouncement = getPluralMessage(
    entries.length,
    'tabCoverageResultCountOne',
    'tabCoverageResultCount',
  );

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={getMessage('tabCoveragePanelTitle')}
      icon={AppWindow}
      hideDescription
      description={getMessage('tabCoveragePanelTitle')}
      maxWidth={460}
      data-testid="tab-coverage-panel"
    >
      {/* aria-live region announcing the result count (FR/EN/ES pluralized). */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
      >
        {selectedEntry ? '' : resultAnnouncement}
      </div>

      {selectedEntry ? (
        <Flex direction="column" gap="4" mt="3" data-testid="tab-coverage-level">
          <Text size="2" color="gray">{selectedEntry.host}</Text>
          <Flex direction="column" gap="2">
            <Text as="label" size="2" weight="medium" id="tab-coverage-level-label">
              {getMessage('tabCoverageLevelLabel')}
            </Text>
            <SegmentedControl.Root
              value={level}
              onValueChange={(v) => setLevel(v as Level)}
              aria-labelledby="tab-coverage-level-label"
            >
              <SegmentedControl.Item value="registrable" data-testid="tab-coverage-level-registrable">
                {selectedEntry.registrableDomain}
              </SegmentedControl.Item>
              <SegmentedControl.Item value="host" data-testid="tab-coverage-level-host">
                {selectedEntry.host}
              </SegmentedControl.Item>
            </SegmentedControl.Root>
          </Flex>
          <Flex gap="2" justify="end">
            <Button
              type="button"
              variant="soft"
              color="gray"
              highContrast
              onClick={() => setSelectedHost(null)}
            >
              {getMessage('previous')}
            </Button>
            <Button type="button" onClick={handleConfirm} data-testid="tab-coverage-seed">
              {getMessage('tabCoverageSeedButton')}
            </Button>
          </Flex>
        </Flex>
      ) : (
        <Flex
          direction="column"
          mt="3"
          style={{ height: 360, minHeight: 0, overflow: 'hidden' }}
        >
          <SearchableInlineList
            value=""
            onValueChange={() => {}}
            options={options}
            // Move focus to the search input on open (WAI-ARIA modal pattern);
            // this is a managed dialog field, not a page-load autofocus.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            searchPlaceholder={getMessage('tabCoverageSearchPlaceholder')}
            emptyMessage={getMessage('tabCoverageEmpty')}
            aria-label={getMessage('tabCoveragePanelTitle')}
            renderItem={(option) => {
              const entry = entryByHost.get(option.value);
              if (!entry) return null;
              const tabCount = getPluralMessage(
                entry.tabCount,
                'tabCoverageTabCountOne',
                'tabCoverageTabCount',
              );
              return (
                <Command.Item
                  key={entry.host}
                  value={entry.host}
                  onSelect={() => handleSelect(entry.host)}
                  className="ss-item tab-coverage-item"
                  aria-label={rowAccessibleName(entry)}
                >
                  <span className="tab-coverage-item__host">{entry.host}</span>
                  {entry.covered && (
                    <Badge color="amber" variant="soft" highContrast aria-hidden="true">
                      <ShieldCheck size={12} aria-hidden="true" />
                      {getMessage('tabCoverageBadgeManaged')}
                    </Badge>
                  )}
                  <span className="tab-coverage-item__count" aria-hidden="true">{tabCount}</span>
                </Command.Item>
              );
            }}
          />
        </Flex>
      )}
    </DialogShell>
  );
}
