import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Theme } from '@radix-ui/themes';
import { TabTree } from './TabTree';
import type { TabTreeData } from '@/types/tabTree';

/** Sample data: mix of groups and ungrouped tabs */
const sampleData: TabTreeData = {
  groups: [
    {
      id: 1,
      title: 'Jira Tickets',
      color: 'red',
      tabs: [
        { id: 42, title: 'PROJ-123 - Fix login bug', url: 'https://jira.company.com/browse/PROJ-123', favIconUrl: '' },
        { id: 43, title: 'PROJ-456 - Add feature', url: 'https://jira.company.com/browse/PROJ-456', favIconUrl: '' },
        { id: 44, title: 'PROJ-789 - Refactor module', url: 'https://jira.company.com/browse/PROJ-789', favIconUrl: '' },
      ],
    },
    {
      id: 2,
      title: 'Documentation',
      color: 'blue',
      tabs: [
        { id: 50, title: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/', favIconUrl: '' },
        { id: 51, title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/', favIconUrl: '' },
      ],
    },
  ],
  ungroupedTabs: [
    { id: 99, title: 'Claude.ai', url: 'https://claude.ai/', favIconUrl: '' },
    { id: 100, title: 'Gmail - Inbox', url: 'https://mail.google.com/mail/u/0/', favIconUrl: '' },
  ],
};

/** Larger dataset for stress-testing */
const largeData: TabTreeData = {
  groups: [
    {
      id: 1,
      title: 'Development',
      color: 'green',
      tabs: Array.from({ length: 8 }, (_, i) => ({
        id: 100 + i,
        title: `Dev Tab ${i + 1} - Some long title that might get truncated in narrow views`,
        url: `https://dev.example.com/page/${i + 1}`,
        favIconUrl: '',
      })),
    },
    {
      id: 2,
      title: 'Social Media',
      color: 'pink',
      tabs: [
        { id: 200, title: 'Twitter / X', url: 'https://x.com/home', favIconUrl: '' },
        { id: 201, title: 'Reddit', url: 'https://www.reddit.com/', favIconUrl: '' },
        { id: 202, title: 'Hacker News', url: 'https://news.ycombinator.com/', favIconUrl: '' },
      ],
    },
    {
      id: 3,
      title: 'Monitoring',
      color: 'orange',
      tabs: [
        { id: 300, title: 'Grafana Dashboard', url: 'https://grafana.company.com/d/main', favIconUrl: '' },
        { id: 301, title: 'Sentry Issues', url: 'https://sentry.io/issues/', favIconUrl: '' },
      ],
    },
  ],
  ungroupedTabs: [
    { id: 400, title: 'Google Search', url: 'https://www.google.com/', favIconUrl: '' },
    { id: 401, title: 'Stack Overflow', url: 'https://stackoverflow.com/', favIconUrl: '' },
    { id: 402, title: 'YouTube', url: 'https://www.youtube.com/', favIconUrl: '' },
  ],
};

/** Empty data */
const emptyData: TabTreeData = {
  groups: [],
  ungroupedTabs: [],
};

/** Only ungrouped tabs */
const ungroupedOnlyData: TabTreeData = {
  groups: [],
  ungroupedTabs: [
    { id: 1, title: 'Tab One', url: 'https://example.com/one', favIconUrl: '' },
    { id: 2, title: 'Tab Two', url: 'https://example.com/two', favIconUrl: '' },
    { id: 3, title: 'Tab Three', url: 'https://example.com/three', favIconUrl: '' },
  ],
};

/** Only groups, no ungrouped tabs */
const groupsOnlyData: TabTreeData = {
  groups: [
    {
      id: 1,
      title: 'Work',
      color: 'purple',
      tabs: [
        { id: 10, title: 'Slack', url: 'https://app.slack.com/', favIconUrl: '' },
        { id: 11, title: 'Notion', url: 'https://www.notion.so/', favIconUrl: '' },
      ],
    },
    {
      id: 2,
      title: 'CI/CD',
      color: 'cyan',
      tabs: [
        { id: 20, title: 'GitHub Actions', url: 'https://github.com/actions', favIconUrl: '' },
      ],
    },
  ],
  ungroupedTabs: [],
};

/** Interactive wrapper that manages selection state */
function InteractiveTabTree(props: { data: TabTreeData; maxHeight?: number | string; preselected?: Set<number> }) {
  const [selectedTabIds, setSelectedTabIds] = useState<Set<number>>(props.preselected ?? new Set());
  return (
    <TabTree
      data={props.data}
      selectedTabIds={selectedTabIds}
      onSelectionChange={setSelectedTabIds}
      onTabClick={(tab) => console.log('Tab clicked:', tab.title, tab.url)}
      maxHeight={props.maxHeight}
    />
  );
}

const meta: Meta<typeof TabTree> = {
  title: 'Components/UI/TabTree/TabTree',
  component: TabTree,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Theme accentColor="indigo">
        <div style={{ width: 500 }}>
          <Story />
        </div>
      </Theme>
    ),
  ],
  argTypes: {
    maxHeight: { control: 'text', description: 'Max height before scrolling' },
  },
} satisfies Meta<typeof TabTree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TabTreeDefault: Story = {
  name: 'Default',
  render: () => <InteractiveTabTree data={sampleData} />,
};

export const TabTreePreselected: Story = {
  name: 'With Preselected Tabs',
  render: () => <InteractiveTabTree data={sampleData} preselected={new Set([42, 43, 99])} />,
};

export const TabTreeAllSelected: Story = {
  name: 'All Selected',
  render: () => {
    const allIds = new Set([
      ...sampleData.groups.flatMap((g) => g.tabs.map((t) => t.id)),
      ...sampleData.ungroupedTabs.map((t) => t.id),
    ]);
    return <InteractiveTabTree data={sampleData} preselected={allIds} />;
  },
};

export const TabTreeLargeDataset: Story = {
  name: 'Large Dataset',
  render: () => <InteractiveTabTree data={largeData} />,
};

export const TabTreeWithMaxHeight: Story = {
  name: 'Scrollable (maxHeight)',
  render: () => <InteractiveTabTree data={largeData} maxHeight={300} />,
};

export const TabTreeEmpty: Story = {
  name: 'Empty Data',
  render: () => <InteractiveTabTree data={emptyData} />,
};

export const TabTreeUngroupedOnly: Story = {
  name: 'Ungrouped Tabs Only',
  render: () => <InteractiveTabTree data={ungroupedOnlyData} />,
};

export const TabTreeGroupsOnly: Story = {
  name: 'Groups Only',
  render: () => <InteractiveTabTree data={groupsOnlyData} />,
};

export const TabTreeNarrow: Story = {
  name: 'Narrow Container (popup)',
  decorators: [
    (Story) => (
      <Theme accentColor="indigo">
        <div style={{ width: 300 }}>
          <Story />
        </div>
      </Theme>
    ),
  ],
  render: () => <InteractiveTabTree data={sampleData} />,
};

export const TabTreeAllGroupColors: Story = {
  name: 'All Group Colors',
  render: () => {
    const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'] as const;
    const colorData: TabTreeData = {
      groups: colors.map((color, i) => ({
        id: i + 1,
        title: `${color.charAt(0).toUpperCase() + color.slice(1)} Group`,
        color,
        tabs: [
          { id: (i + 1) * 100, title: `Tab in ${color} group`, url: `https://${color}.example.com/`, favIconUrl: '' },
        ],
      })),
      ungroupedTabs: [],
    };
    return <InteractiveTabTree data={colorData} />;
  },
};
