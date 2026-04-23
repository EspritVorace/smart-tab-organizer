import type { Meta, StoryObj } from '@storybook/react';
import { SettingsPage } from './SettingsPage';
import { defaultAppSettings } from '@/types/syncSettings';

const meta: Meta<typeof SettingsPage> = {
  title: 'Components/UI/SettingsPage/SettingsPage',
  component: SettingsPage,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    updateSettings: { action: 'settings updated' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SettingsPageDefault: Story = {
  args: {
    syncSettings: defaultAppSettings,
    updateSettings: (settings) => console.log('Settings updated:', settings),
  },
};

export const SettingsPageNotificationsDisabled: Story = {
  args: {
    syncSettings: {
      ...defaultAppSettings,
      notifyOnGrouping: false,
      notifyOnDeduplication: false,
    },
    updateSettings: (settings) => console.log('Settings updated:', settings),
  },
};

export const SettingsPageGroupingOnly: Story = {
  args: {
    syncSettings: {
      ...defaultAppSettings,
      notifyOnGrouping: true,
      notifyOnDeduplication: false,
    },
    updateSettings: (settings) => console.log('Settings updated:', settings),
  },
};

export const SettingsPageDedupUnmatchedDisabled: Story = {
  args: {
    syncSettings: {
      ...defaultAppSettings,
      deduplicateUnmatchedDomains: false,
    },
    updateSettings: (settings) => console.log('Settings updated:', settings),
  },
};

export const SettingsPageKeepNewStrategy: Story = {
  args: {
    syncSettings: {
      ...defaultAppSettings,
      deduplicationKeepStrategy: 'keep-new',
    },
    updateSettings: (settings) => console.log('Settings updated:', settings),
  },
};

export const SettingsPageKeepGroupedStrategy: Story = {
  args: {
    syncSettings: {
      ...defaultAppSettings,
      deduplicationKeepStrategy: 'keep-grouped',
    },
    updateSettings: (settings) => console.log('Settings updated:', settings),
  },
};

export const SettingsPageKeepGroupedOrNewStrategy: Story = {
  args: {
    syncSettings: {
      ...defaultAppSettings,
      deduplicationKeepStrategy: 'keep-grouped-or-new',
    },
    updateSettings: (settings) => console.log('Settings updated:', settings),
  },
};
