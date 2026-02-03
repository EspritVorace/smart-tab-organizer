import type { Meta, StoryObj } from '@storybook/react';
import { SettingsToggles } from './SettingsToggles';

const meta: Meta<typeof SettingsToggles> = {
  title: 'Components/UI/SettingsToggles',
  component: SettingsToggles,
  tags: ['autodocs'],
  argTypes: {
    globalGroupingEnabled: { control: 'boolean' },
    globalDeduplicationEnabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    onGroupingChange: { action: 'onGroupingChange' },
    onDeduplicationChange: { action: 'onDeduplicationChange' },
  },
} satisfies Meta<typeof SettingsToggles>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SettingsTogglesDefault: Story = {
  name: 'Default Settings',
  args: {
    globalGroupingEnabled: true,
    globalDeduplicationEnabled: false,
    isLoading: false,
  },
};

export const SettingsTogglesAllEnabled: Story = {
  name: 'All Enabled',
  args: {
    globalGroupingEnabled: true,
    globalDeduplicationEnabled: true,
    isLoading: false,
  },
};

export const SettingsTogglesAllDisabled: Story = {
  name: 'All Disabled',
  args: {
    globalGroupingEnabled: false,
    globalDeduplicationEnabled: false,
    isLoading: false,
  },
};

export const SettingsTogglesLoading: Story = {
  name: 'Loading State',
  args: {
    isLoading: true,
  },
};