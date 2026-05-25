import type { Meta, StoryObj } from '@storybook/react';
import { DomainRulesPage } from './DomainRulesPage';
import { MockImportExportWizardsProvider } from '@/test-utils/MockImportExportWizardsProvider';
import type { AppSettings, DomainRuleSetting } from '@/types/syncSettings';

const rules: DomainRuleSetting[] = [
  {
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
  },
  {
    id: 'rule-2',
    domainFilter: 'jira.atlassian.net',
    label: 'Jira',
    titleParsingRegEx: '\\[([A-Z]+-\\d+)\\]',
    urlParsingRegEx: '',
    groupNameSource: 'title',
    deduplicationMatchMode: 'exact',
    color: 'blue',
    deduplicationEnabled: true,
    ignoredQueryParams: [],
    presetId: null,
    urlExtractionMode: 'regex',
    enabled: true,
  },
];

const mockSyncSettings: AppSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  deduplicateUnmatchedDomains: true,
  deduplicationKeepStrategy: 'keep-old',
  defaultRestoreAction: 'current',
  categories: [],
  notifyOnGrouping: true,
  notifyOnDeduplication: true,
  notifyOnOrganize: true,
  domainRules: rules,
};

const meta: Meta<typeof DomainRulesPage> = {
  title: 'Pages/DomainRulesPage',
  component: DomainRulesPage,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <MockImportExportWizardsProvider>
        <Story />
      </MockImportExportWizardsProvider>
    ),
  ],
  args: {
    syncSettings: mockSyncSettings,
    updateRules: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DomainRulesPageDefault: Story = {
  args: {},
};

export const DomainRulesPageEmpty: Story = {
  args: {
    syncSettings: { ...mockSyncSettings, domainRules: [] },
  },
};
