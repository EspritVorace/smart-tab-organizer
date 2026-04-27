import type { Meta, StoryObj } from '@storybook/react';
import { SessionsPage } from './SessionsPage';
import type { AppSettings } from '@/types/syncSettings';
import type { Session } from '@/types/session';

const now = '2025-01-01T10:00:00.000Z';

function makeSession(id: string, name: string, isPinned: boolean): Session {
  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    groups: [],
    ungroupedTabs: [{ id: `tab-${id}`, title: 'Example', url: 'https://example.com' }],
    isPinned,
    categoryId: null,
  };
}

const mockSyncSettings: AppSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  deduplicateUnmatchedDomains: true,
  deduplicationKeepStrategy: 'keep-old',
  categories: [],
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

/** All sessions are pinned: "Sessions" subsection shows its empty state. */
export const SessionsPageAllPinned: Story = {
  beforeEach: async () => {
    await browser.storage.local.set({
      sessions: [
        makeSession('s1', 'Work', true),
        makeSession('s2', 'Research', true),
      ],
    });
  },
};

/** No session is pinned: "Pinned sessions" subsection shows its empty state. */
export const SessionsPageNonePinned: Story = {
  beforeEach: async () => {
    await browser.storage.local.set({
      sessions: [
        makeSession('s1', 'Work', false),
        makeSession('s2', 'Research', false),
      ],
    });
  },
};
