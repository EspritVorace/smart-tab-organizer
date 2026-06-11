import type { Meta, StoryObj } from '@storybook/react';
import { ThisWeekStatsCard } from './ThisWeekStatsCard';

const meta: Meta<typeof ThisWeekStatsCard> = {
  title: 'Components/Core/Statistics/ThisWeekStatsCard',
  component: ThisWeekStatsCard,
  tags: ['autodocs'],
} satisfies Meta<typeof ThisWeekStatsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThisWeekStatsCardDefault: Story = {
  name: 'Default (up trend)',
  args: {
    data: {
      thisWeek: { grouping: 14, dedup: 7 },
      lastWeek: { grouping: 9, dedup: 4 },
    },
  },
};

export const ThisWeekStatsCardDownTrend: Story = {
  name: 'Down trend',
  args: {
    data: {
      thisWeek: { grouping: 3, dedup: 1 },
      lastWeek: { grouping: 12, dedup: 8 },
    },
  },
};

export const ThisWeekStatsCardFlat: Story = {
  name: 'Flat (no change)',
  args: {
    data: {
      thisWeek: { grouping: 5, dedup: 2 },
      lastWeek: { grouping: 5, dedup: 2 },
    },
  },
};

export const ThisWeekStatsCardEmpty: Story = {
  name: 'Empty (no activity)',
  args: {
    data: {
      thisWeek: { grouping: 0, dedup: 0 },
      lastWeek: { grouping: 0, dedup: 0 },
    },
  },
};

export const ThisWeekStatsCardFirstWeek: Story = {
  name: 'First week (no previous data)',
  args: {
    data: {
      thisWeek: { grouping: 6, dedup: 3 },
      lastWeek: { grouping: 0, dedup: 0 },
    },
  },
};
