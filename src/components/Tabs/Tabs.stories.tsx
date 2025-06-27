import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {
    onTabChange: { action: 'tab-changed' },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RulesTabActive: Story = {
  args: {
    currentTab: 'rules',
  },
};

export const PresetsTabActive: Story = {
  args: {
    currentTab: 'presets',
  },
};

export const LogicalGroupsTabActive: Story = {
  args: {
    currentTab: 'logicalGroups',
  },
};

export const ImportExportTabActive: Story = {
  args: {
    currentTab: 'importexport',
  },
};

export const StatsTabActive: Story = {
  args: {
    currentTab: 'stats',
  },
};