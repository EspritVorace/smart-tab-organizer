import type { Meta, StoryObj } from '@storybook/react';
import { Statistics } from './Statistics';

const meta: Meta<typeof Statistics> = {
  title: 'Components/Core/Statistics',
  component: Statistics,
  tags: ['autodocs'],
  argTypes: {
    isLoading: { control: 'boolean' },
    onReset: { action: 'onReset' },
  },
} satisfies Meta<typeof Statistics>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StatisticsDefault: Story = {
  name: 'Default State',
  args: {
    stats: {
      tabGroupsCreatedCount: 5,
      tabsDeduplicatedCount: 12,
    },
    isLoading: false,
  },
};

export const StatisticsEmpty: Story = {
  name: 'Empty Statistics',
  args: {
    stats: {
      tabGroupsCreatedCount: 0,
      tabsDeduplicatedCount: 0,
    },
    isLoading: false,
  },
};

export const StatisticsSingular: Story = {
  name: 'Singular Values',
  args: {
    stats: {
      tabGroupsCreatedCount: 1,
      tabsDeduplicatedCount: 1,
    },
    isLoading: false,
  },
};

export const StatisticsOneGroupManyTabs: Story = {
  name: 'One Group Many Tabs',
  args: {
    stats: {
      tabGroupsCreatedCount: 1,
      tabsDeduplicatedCount: 15,
    },
    isLoading: false,
  },
};

export const StatisticsManyGroupsOneTab: Story = {
  name: 'Many Groups One Tab',
  args: {
    stats: {
      tabGroupsCreatedCount: 8,
      tabsDeduplicatedCount: 1,
    },
    isLoading: false,
  },
};

export const StatisticsHighNumbers: Story = {
  name: 'High Numbers',
  args: {
    stats: {
      tabGroupsCreatedCount: 156,
      tabsDeduplicatedCount: 423,
    },
    isLoading: false,
  },
};

export const StatisticsLoading: Story = {
  name: 'Loading State',
  args: {
    isLoading: true,
  },
};

export const StatisticsNull: Story = {
  name: 'Null Statistics',
  args: {
    stats: null,
    isLoading: false,
  },
};

export const StatisticsUndefined: Story = {
  name: 'Undefined Statistics',
  args: {
    isLoading: false,
  },
};