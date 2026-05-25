import type { Meta, StoryObj } from '@storybook/react';
import { browser } from 'wxt/browser';
import { HomePage } from './HomePage';
import { MockImportExportWizardsProvider } from '@/test-utils/MockImportExportWizardsProvider';
import type { AppSettings, DomainRuleSetting } from '@/types/syncSettings';
import type { Session } from '@/types/session';
import type { StatisticsAggregates } from '@/types/statistics';

function makeSession(id: string, name: string, groups: number, tabs: number, isPinned = true): Session {
  const groupList = Array.from({ length: groups }, (_, gi) => ({
    id: `${id}-g${gi}`,
    title: `Group ${gi + 1}`,
    color: 'blue' as const,
    tabs: Array.from({ length: Math.ceil(tabs / Math.max(groups, 1)) }, (__, ti) => ({
      id: `${id}-g${gi}-t${ti}`,
      title: `Tab ${ti + 1}`,
      url: `https://example.com/${id}/${gi}/${ti}`,
    })),
  }));
  const ungroupedTabs = groups === 0
    ? Array.from({ length: tabs }, (_, ti) => ({
        id: `${id}-u${ti}`,
        title: `Tab ${ti + 1}`,
        url: `https://example.com/${id}/${ti}`,
      }))
    : [];
  return {
    id,
    name,
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: `2025-04-${String((parseInt(id.replace(/\D/g, ''), 10) % 28) + 1).padStart(2, '0')}T10:00:00.000Z`,
    groups: groupList,
    ungroupedTabs,
    isPinned,
  };
}

const sampleRule: DomainRuleSetting = {
  id: 'rule-1',
  domainFilter: 'github.com',
  label: 'GitHub',
  titleParsingRegEx: '(.+)',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  color: 'purple',
  deduplicationEnabled: true,
  ignoredQueryParams: [],
  presetId: null,
  urlExtractionMode: 'regex',
  enabled: true,
};

const baseSettings: AppSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  deduplicateUnmatchedDomains: false,
  deduplicationKeepStrategy: 'keep-grouped-or-new',
  defaultRestoreAction: 'current',
  categories: [],
  notifyOnGrouping: true,
  notifyOnDeduplication: true,
  notifyOnOrganize: true,
  domainRules: [],
};

const emptyAggregates: StatisticsAggregates = {
  totalGrouping: 0,
  totalDedup: 0,
  firstUsedAt: null,
  thisWeek: { grouping: 0, dedup: 0 },
  lastWeek: { grouping: 0, dedup: 0 },
  thisMonth: { grouping: 0, dedup: 0 },
  topRules: [],
  sessionEvents: {
    totals: { created: 0, restored: 0, tabsRestored: 0, archived: 0 },
    thisWeek: { created: 0, restored: 0, tabsRestored: 0 },
    lastWeek: { created: 0, restored: 0, tabsRestored: 0 },
  },
};

const richAggregates: StatisticsAggregates = {
  ...emptyAggregates,
  totalGrouping: 1342,
  totalDedup: 287,
  firstUsedAt: new Date('2024-09-01T00:00:00.000Z'),
  thisWeek: { grouping: 12, dedup: 4 },
  lastWeek: { grouping: 9, dedup: 3 },
  thisMonth: { grouping: 80, dedup: 22 },
};

const meta: Meta<typeof HomePage> = {
  title: 'Pages/HomePage',
  component: HomePage,
  parameters: {
    layout: 'fullscreen',
    landmark: false,
  },
  decorators: [
    (Story) => (
      <MockImportExportWizardsProvider>
        <Story />
      </MockImportExportWizardsProvider>
    ),
  ],
  args: {
    syncSettings: baseSettings,
    statisticsAggregates: emptyAggregates,
    onNavigate: () => {},
    onOpenSnapshotWizard: () => {},
    onOpenRuleWizard: () => {},
    onOpenShortcutsAside: () => {},
    onRestore: () => {},
    onDefaultRestoreActionChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty state: no rules, no sessions. The full onboarding hero is shown. */
export const HomePageEmpty: Story = {
  beforeEach: async () => {
    await browser.storage.local.set({ sessions: [] });
  },
  args: {
    syncSettings: baseSettings,
    statisticsAggregates: emptyAggregates,
  },
};

/** Rules configured but no pinned session yet: compact hero, no pinned section. */
export const HomePageWithRulesNoSessions: Story = {
  beforeEach: async () => {
    await browser.storage.local.set({ sessions: [] });
  },
  args: {
    syncSettings: { ...baseSettings, domainRules: [sampleRule] },
    statisticsAggregates: emptyAggregates,
  },
};

/** Fully configured: rules, pinned sessions, and statistics. All sections visible. */
export const HomePageFullyConfigured: Story = {
  beforeEach: async () => {
    await browser.storage.local.set({
      sessions: [
        makeSession('s1', 'Travail', 3, 12, true),
        makeSession('s2', 'Recherche IA', 2, 7, true),
        makeSession('s3', 'Veille tech', 1, 4, true),
        makeSession('s4', 'Brouillon', 0, 0, false),
      ],
    });
  },
  args: {
    syncSettings: { ...baseSettings, domainRules: [sampleRule] },
    statisticsAggregates: richAggregates,
  },
};

/** Loading: statistics aggregates are still null and sessions storage is unset. */
export const HomePageLoading: Story = {
  beforeEach: async () => {
    await browser.storage.local.remove(['sessions']);
  },
  args: {
    syncSettings: baseSettings,
    statisticsAggregates: null,
  },
};
