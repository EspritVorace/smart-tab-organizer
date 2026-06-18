import { useState } from 'react';
import { IconButton, Tooltip } from '@radix-ui/themes';
import { AppWindow } from 'lucide-react';
import { browser } from 'wxt/browser';
import { getMessage } from '@/utils/i18n';
import { logger } from '@/utils/logger';
import { buildTabCoverageEntries, type TabCoverageEntry } from '@/utils/tabCoverage';
import type { DomainRuleSetting } from '@/types/syncSettings';
import { TabCoveragePanel } from './TabCoveragePanel';

interface TabCoverageButtonProps {
  /** Enabled-rule coverage is computed against these rules. */
  domainRules: DomainRuleSetting[];
  /** Seed the domain filter field with the chosen value. */
  onSeed: (value: string) => void;
}

/**
 * Trigger next to the step 1 domain filter field: opens the discovery dialog
 * listing the domains found across the open tabs. Queries all windows on open
 * (the `tabs` permission is already granted) and computes the coverage model.
 */
export function TabCoverageButton({ domainRules, onSeed }: TabCoverageButtonProps) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<TabCoverageEntry[]>([]);

  const handleOpen = async () => {
    try {
      const tabs = await browser.tabs.query({});
      const enabledRules = domainRules.filter((r) => r.enabled);
      setEntries(buildTabCoverageEntries(tabs, enabledRules));
    } catch (e) {
      logger.debug('[TabCoverageButton] Error querying tabs:', e);
      setEntries([]);
    }
    setOpen(true);
  };

  return (
    <>
      <Tooltip content={getMessage('tabCoverageOpenButton')}>
        <IconButton
          type="button"
          variant="soft"
          color="gray"
          highContrast
          onClick={handleOpen}
          aria-label={getMessage('tabCoverageOpenButton')}
          data-testid="tab-coverage-open"
        >
          <AppWindow size={16} aria-hidden="true" />
        </IconButton>
      </Tooltip>
      <TabCoveragePanel open={open} onOpenChange={setOpen} entries={entries} onSeed={onSeed} />
    </>
  );
}
