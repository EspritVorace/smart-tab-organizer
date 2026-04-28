import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from 'storybook/test';
import { StatisticsPage } from './StatisticsPage';
import type { AppSettings } from '@/types/syncSettings';
import { defaultAppSettings } from '@/types/syncSettings';
import type { StatisticsAggregates } from '@/types/statistics';

const mockSettings: AppSettings = {
  ...defaultAppSettings,
  domainRules: [
    { id: 'rule-1', enabled: true, domainFilter: 'github.com', label: 'GitHub', groupingEnabled: true, titleParsingRegEx: '', urlParsingRegEx: '', groupNameSource: 'title', deduplicationMatchMode: 'exact', deduplicationEnabled: true },
    { id: 'rule-2', enabled: true, domainFilter: 'jira.atlassian.net', label: 'Jira', groupingEnabled: true, titleParsingRegEx: '', urlParsingRegEx: '', groupNameSource: 'title', deduplicationMatchMode: 'exact', deduplicationEnabled: true },
    { id: 'rule-3', enabled: false, domainFilter: 'notion.so', label: 'Notion', groupingEnabled: false, titleParsingRegEx: '', urlParsingRegEx: '', groupNameSource: 'title', deduplicationMatchMode: 'exact', deduplicationEnabled: false },
  ],
};

const emptyData: StatisticsAggregates = {
  totalGrouping: 0,
  totalDedup: 0,
  firstUsedAt: null,
  thisWeek: { grouping: 0, dedup: 0 },
  lastWeek: { grouping: 0, dedup: 0 },
  thisMonth: { grouping: 0, dedup: 0 },
  topRules: [],
};

const richData: StatisticsAggregates = {
  totalGrouping: 142,
  totalDedup: 57,
  firstUsedAt: new Date('2026-01-12'),
  thisWeek: { grouping: 12, dedup: 4 },
  lastWeek: { grouping: 8, dedup: 6 },
  thisMonth: { grouping: 45, dedup: 18 },
  topRules: [
    { ruleId: 'rule-1', label: 'GitHub', grouping: 30, dedup: 5, total: 35 },
    { ruleId: 'rule-2', label: 'Jira', grouping: 10, dedup: 8, total: 18 },
    { ruleId: 'rule-deleted', label: 'rule-deleted', grouping: 5, dedup: 2, total: 7 },
  ],
};

const meta: Meta<typeof StatisticsPage> = {
  title: 'Pages/StatisticsPage',
  component: StatisticsPage,
  parameters: { layout: 'fullscreen' },
  args: {
    syncSettings: mockSettings,
    onReset: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const StatisticsPageDefault: Story = {
  args: { statisticsData: emptyData },
};

export const StatisticsPageWithData: Story = {
  args: { statisticsData: richData },
};

export const StatisticsPageTrendingDown: Story = {
  args: {
    statisticsData: {
      ...richData,
      thisWeek: { grouping: 3, dedup: 1 },
      lastWeek: { grouping: 8, dedup: 6 },
    },
  },
};

export const StatisticsPageNoTopRules: Story = {
  args: {
    statisticsData: { ...richData, topRules: [] },
  },
};

export const StatisticsPageNull: Story = {
  args: { statisticsData: null },
};

export const StatisticsPageResetClick: Story = {
  args: { statisticsData: richData },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const resetBtn = await body.findByTestId('page-stats-btn-reset');
    await expect(resetBtn).toBeInTheDocument();
    await userEvent.click(resetBtn);
  },
};
