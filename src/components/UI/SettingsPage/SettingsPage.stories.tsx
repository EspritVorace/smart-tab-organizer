import type { Meta, StoryObj } from '@storybook/react';
import { SettingsPage } from './SettingsPage';
import { defaultSyncSettings } from '../../../types/syncSettings';

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
    syncSettings: defaultSyncSettings,
    updateSettings: (settings) => console.log('Settings updated:', settings),
  },
};

export const SettingsPageNotificationsDisabled: Story = {
  args: {
    syncSettings: {
      ...defaultSyncSettings,
      notifyOnGrouping: false,
      notifyOnDeduplication: false,
    },
    updateSettings: (settings) => console.log('Settings updated:', settings),
  },
};

export const SettingsPageGroupingOnly: Story = {
  args: {
    syncSettings: {
      ...defaultSyncSettings,
      notifyOnGrouping: true,
      notifyOnDeduplication: false,
    },
    updateSettings: (settings) => console.log('Settings updated:', settings),
  },
};
