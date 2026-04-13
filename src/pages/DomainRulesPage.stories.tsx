import type { Meta, StoryObj } from '@storybook/react';
import { DomainRulesPage } from './DomainRulesPage';
import type { SyncSettings, DomainRuleSetting } from '../types/syncSettings';

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
    presetId: null,
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
    presetId: null,
    enabled: true,
  },
];

const mockSyncSettings: SyncSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  notifyOnGrouping: true,
  notifyOnDeduplication: true,
  domainRules: rules,
};

const meta: Meta<typeof DomainRulesPage> = {
  title: 'Pages/DomainRulesPage',
  component: DomainRulesPage,
  parameters: { layout: 'fullscreen' },
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
