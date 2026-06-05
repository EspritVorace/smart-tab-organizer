import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from 'storybook/test';
import { StatisticsPage } from './StatisticsPage';
import type { AppSettings } from '@/types/syncSettings';
import { defaultAppSettings } from '@/types/syncSettings';
import type { StatisticsAggregates } from '@/types/statistics';
import type { SessionStatisticsSnapshot } from '@/hooks/useSessionStatistics';
import type { StorageUsageSnapshot } from '@/hooks/useStorageUsage';

const mockSettings: AppSettings = {
  ...defaultAppSettings,
  domainRules: [
    { id: 'rule-1', enabled: true, domainFilter: 'github.com', label: 'GitHub', groupingEnabled: true, titleParsingRegEx: '', urlParsingRegEx: '', groupNameSource: 'title', deduplicationMatchMode: 'exact', deduplicationEnabled: true, ignoredQueryParams: [], presetId: null, urlExtractionMode: 'regex' },
    { id: 'rule-2', enabled: true, domainFilter: 'jira.atlassian.net', label: 'Jira', groupingEnabled: true, titleParsingRegEx: '', urlParsingRegEx: '', groupNameSource: 'title', deduplicationMatchMode: 'exact', deduplicationEnabled: true, ignoredQueryParams: [], presetId: null, urlExtractionMode: 'regex' },
    { id: 'rule-3', enabled: false, domainFilter: 'notion.so', label: 'Notion', groupingEnabled: false, titleParsingRegEx: '', urlParsingRegEx: '', groupNameSource: 'title', deduplicationMatchMode: 'exact', deduplicationEnabled: false, ignoredQueryParams: [], presetId: null, urlExtractionMode: 'regex' },
  ],
};

const emptySessionEvents = {
  totals: { created: 0, restored: 0, tabsRestored: 0, archived: 0 },
  thisWeek: { created: 0, restored: 0, tabsRestored: 0 },
  lastWeek: { created: 0, restored: 0, tabsRestored: 0 },
};

const richSessionEvents = {
  totals: { created: 24, restored: 11, tabsRestored: 187, archived: 6 },
  thisWeek: { created: 3, restored: 2, tabsRestored: 27 },
  lastWeek: { created: 1, restored: 1, tabsRestored: 9 },
};

const emptyData: StatisticsAggregates = {
  totalGrouping: 0,
  totalDedup: 0,
  firstUsedAt: null,
  thisWeek: { grouping: 0, dedup: 0 },
  lastWeek: { grouping: 0, dedup: 0 },
  thisMonth: { grouping: 0, dedup: 0 },
  topRules: [],
  sessionEvents: emptySessionEvents,
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
  sessionEvents: richSessionEvents,
};

const emptySessionStats: SessionStatisticsSnapshot = {
  volumes: {
    total: 0, pinned: 0, active: 0, archived: 0,
    totalTabs: 0, totalGroups: 0,
    averageTabsPerSession: 0,
    largest: null,
    percentWithNote: 0, percentWithCategory: 0,
  },
  composition: {
    topCategories: [],
    topDomains: [],
    groupColorDistribution: [],
    topSessionsByTabs: [],
  },
  temporal: {
    oldest: null,
    mostRecentlyUpdated: null,
    createdThisWeek: 0,
    createdLastWeek: 0,
    updatedThisWeek: 0,
  },
  isLoaded: true,
};

const richSessionStats: SessionStatisticsSnapshot = {
  volumes: {
    total: 18, pinned: 3, active: 9, archived: 6,
    totalTabs: 142, totalGroups: 28,
    averageTabsPerSession: 11.8,
    largest: { name: 'Q1 research', tabCount: 42 },
    percentWithNote: 58, percentWithCategory: 75,
  },
  composition: {
    topCategories: [
      { id: 'development', count: 6 },
      { id: 'productivity', count: 4 },
      { id: 'communication', count: 3 },
      { id: 'media', count: 2 },
      { id: 'news', count: 1 },
    ],
    topDomains: [
      { host: 'github.com', count: 24 },
      { host: 'docs.google.com', count: 15 },
      { host: 'notion.so', count: 12 },
      { host: 'stackoverflow.com', count: 8 },
      { host: 'youtube.com', count: 5 },
    ],
    groupColorDistribution: [
      { color: 'blue', count: 8 },
      { color: 'green', count: 6 },
      { color: 'purple', count: 5 },
      { color: 'orange', count: 4 },
      { color: 'red', count: 3 },
      { color: 'yellow', count: 2 },
    ],
    topSessionsByTabs: [
      { id: 's-1', name: 'Q1 research', tabCount: 42 },
      { id: 's-2', name: 'Reading list', tabCount: 28 },
      { id: 's-3', name: 'Daily work', tabCount: 19 },
      { id: 's-4', name: 'Side project', tabCount: 14 },
      { id: 's-5', name: 'Inspiration', tabCount: 11 },
    ],
  },
  temporal: {
    oldest: { id: 's-old', name: 'First snapshot', createdAt: '2026-01-15T10:00:00Z' },
    mostRecentlyUpdated: { id: 's-recent', name: 'Daily work', updatedAt: '2026-05-22T18:30:00Z' },
    createdThisWeek: 3,
    createdLastWeek: 1,
    updatedThisWeek: 7,
  },
  isLoaded: true,
};

const emptyStorageUsage: StorageUsageSnapshot = {
  categories: [],
  workspaceTotalBytes: 0,
  workspaces: [],
  globalTotalBytes: 0,
  quotaBytes: 10_485_760,
  quotaPercent: 0,
  isLoaded: true,
};

const richStorageUsage: StorageUsageSnapshot = {
  categories: [
    { id: 'sessions-archived', labelKey: 'statsStorageCatSessionsArchived', bytes: 184_320 },
    { id: 'sessions-active', labelKey: 'statsStorageCatSessionsActive', bytes: 96_400 },
    { id: 'domain-rules', labelKey: 'statsStorageCatDomainRules', bytes: 41_200 },
    { id: 'statistics', labelKey: 'statsStorageCatStatistics', bytes: 22_800 },
    { id: 'sessions-pinned', labelKey: 'statsStorageCatSessionsPinned', bytes: 18_100 },
    { id: 'settings', labelKey: 'statsStorageCatSettings', bytes: 240 },
  ],
  workspaceTotalBytes: 363_060,
  workspaces: [],
  globalTotalBytes: 512_000,
  quotaBytes: 10_485_760,
  quotaPercent: (512_000 / 10_485_760) * 100,
  isLoaded: true,
};

const multiWorkspaceStorageUsage: StorageUsageSnapshot = {
  ...richStorageUsage,
  globalTotalBytes: 506_180,
  quotaPercent: (506_180 / 10_485_760) * 100,
  workspaces: [
    {
      workspaceId: 'default',
      name: 'Personnel',
      accentColor: 'indigo',
      totalBytes: 322_620,
      categories: [
        { id: 'sessions-archived', labelKey: 'statsStorageCatSessionsArchived', bytes: 184_320 },
        { id: 'sessions-active', labelKey: 'statsStorageCatSessionsActive', bytes: 96_400 },
        { id: 'domain-rules', labelKey: 'statsStorageCatDomainRules', bytes: 41_200 },
        { id: 'statistics', labelKey: 'statsStorageCatStatistics', bytes: 700 },
        { id: 'sessions-pinned', labelKey: 'statsStorageCatSessionsPinned', bytes: 0 },
        { id: 'settings', labelKey: 'statsStorageCatSettings', bytes: 0 },
      ],
    },
    {
      workspaceId: 'ws-work',
      name: 'Travail',
      accentColor: 'jade',
      totalBytes: 183_560,
      categories: [
        { id: 'domain-rules', labelKey: 'statsStorageCatDomainRules', bytes: 102_400 },
        { id: 'sessions-pinned', labelKey: 'statsStorageCatSessionsPinned', bytes: 58_300 },
        { id: 'statistics', labelKey: 'statsStorageCatStatistics', bytes: 22_100 },
        { id: 'settings', labelKey: 'statsStorageCatSettings', bytes: 760 },
        { id: 'sessions-active', labelKey: 'statsStorageCatSessionsActive', bytes: 0 },
        { id: 'sessions-archived', labelKey: 'statsStorageCatSessionsArchived', bytes: 0 },
      ],
    },
  ],
};

const meta: Meta<typeof StatisticsPage> = {
  title: 'Pages/StatisticsPage',
  component: StatisticsPage,
  parameters: { layout: 'fullscreen' },
  args: {
    syncSettings: mockSettings,
    storageUsage: richStorageUsage,
    onReset: () => {},
    statsTab: 'summary',
    onStatsTabChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const StatisticsPageDefault: Story = {
  args: { statisticsData: emptyData, sessionStats: emptySessionStats },
};

export const StatisticsPageWithData: Story = {
  args: { statisticsData: richData, sessionStats: richSessionStats },
};

export const StatisticsPageTrendingDown: Story = {
  args: {
    statisticsData: {
      ...richData,
      thisWeek: { grouping: 3, dedup: 1 },
      lastWeek: { grouping: 8, dedup: 6 },
    },
    sessionStats: richSessionStats,
  },
};

export const StatisticsPageNoTopRules: Story = {
  args: {
    statisticsData: { ...richData, topRules: [] },
    sessionStats: richSessionStats,
  },
};

export const StatisticsPageEmptySessions: Story = {
  args: { statisticsData: richData, sessionStats: emptySessionStats },
};

export const StatisticsPageWithSessionData: Story = {
  args: { statisticsData: emptyData, sessionStats: richSessionStats },
};

export const StatisticsPageNull: Story = {
  args: { statisticsData: null, sessionStats: null, storageUsage: emptyStorageUsage },
};

export const StatisticsPageRules: Story = {
  args: { statisticsData: richData, sessionStats: richSessionStats, statsTab: 'rules' },
};

export const StatisticsPageSessions: Story = {
  args: { statisticsData: richData, sessionStats: richSessionStats, statsTab: 'sessions' },
};

export const StatisticsPageStorage: Story = {
  args: { statisticsData: richData, sessionStats: richSessionStats, statsTab: 'storage' },
};

export const StatisticsPageStorageMultiWorkspace: Story = {
  args: {
    statisticsData: richData,
    sessionStats: richSessionStats,
    statsTab: 'storage',
    storageUsage: multiWorkspaceStorageUsage,
  },
};

export const StatisticsPageResetClick: Story = {
  args: { statisticsData: richData, sessionStats: richSessionStats, statsTab: 'rules' },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const resetBtn = await body.findByTestId('page-stats-btn-reset');
    await expect(resetBtn).toBeInTheDocument();
    await userEvent.click(resetBtn);
  },
};
