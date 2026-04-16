import type { Meta, StoryObj } from '@storybook/react';
import { SessionsPage } from './SessionsPage';
import type { SyncSettings } from '@/types/syncSettings';

const mockSyncSettings: SyncSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  notifyOnGrouping: true,
  notifyOnDeduplication: true,
  domainRules: [],
};

const meta: Meta<typeof SessionsPage> = {
  title: 'Pages/SessionsPage',
  component: SessionsPage,
  parameters: { layout: 'fullscreen' },
  args: {
    syncSettings: mockSyncSettings,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SessionsPageDefault: Story = {
  args: {},
};

export const SessionsPageWithSnapshotOpen: Story = {
  args: {
    snapshotWizardOpen: true,
  },
};
