import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from 'storybook/test';
import { StatisticsPage } from './StatisticsPage';
import type { AppSettings } from '@/types/syncSettings';
import { defaultAppSettings } from '@/types/syncSettings';

const mockSettings: AppSettings = defaultAppSettings;

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
  args: {
    stats: { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 0 },
  },
};

export const StatisticsPageWithData: Story = {
  args: {
    stats: { tabGroupsCreatedCount: 142, tabsDeduplicatedCount: 57 },
  },
};

export const StatisticsPageResetClick: Story = {
  args: {
    stats: { tabGroupsCreatedCount: 10, tabsDeduplicatedCount: 5 },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const resetBtn = await body.findByTestId('page-stats-btn-reset');
    await expect(resetBtn).toBeInTheDocument();
    await userEvent.click(resetBtn);
  },
};
