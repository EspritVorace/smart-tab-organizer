import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from 'storybook/test';
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

// Clicks the "notify on grouping" switch to invoke its onCheckedChange handler.
export const SettingsPageToggleNotifyGroup: Story = {
  args: {
    syncSettings: defaultAppSettings,
    updateSettings: () => {},
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const toggle = await body.findByTestId('page-settings-toggle-notify-group');
    await userEvent.click(toggle);
  },
};

// Clicks the "notify on deduplication" switch.
export const SettingsPageToggleNotifyDedup: Story = {
  args: {
    syncSettings: defaultAppSettings,
    updateSettings: () => {},
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const toggle = await body.findByTestId('page-settings-toggle-notify-dedup');
    await userEvent.click(toggle);
  },
};

// Clicks the "deduplicate unmatched domains" switch.
export const SettingsPageToggleDedupUnmatched: Story = {
  args: {
    syncSettings: defaultAppSettings,
    updateSettings: () => {},
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const toggle = await body.findByTestId('page-settings-toggle-dedup-unmatched');
    await userEvent.click(toggle);
  },
};

// Clicks a keep-strategy radio button to invoke its onValueChange handler.
export const SettingsPageClickKeepOld: Story = {
  args: {
    syncSettings: { ...defaultAppSettings, globalDeduplicationEnabled: true },
    updateSettings: () => {},
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const radio = await body.findByTestId('page-settings-dedup-keep-keep-old');
    await userEvent.click(radio);
  },
};
