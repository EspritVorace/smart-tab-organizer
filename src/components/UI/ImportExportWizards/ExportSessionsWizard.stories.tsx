import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from 'storybook/test';
import { ExportSessionsWizard } from './ExportSessionsWizard';
import { sessionsItem } from '@/utils/storageItems';
import type { Session } from '@/types/session';

const mockSessions: Session[] = [
  {
    id: 'session-pinned-1',
    name: 'Pinned Profile',
    createdAt: '2025-03-20T09:00:00.000Z',
    updatedAt: '2025-03-20T09:00:00.000Z',
    isPinned: true,
    groups: [
      {
        id: 'grp-1',
        title: 'Frontend',
        color: 'blue',
        tabs: [{ id: 't1', title: 'React', url: 'https://react.dev' }],
      },
    ],
    ungroupedTabs: [],
  },
  {
    id: 'session-work-1',
    name: 'Work tabs',
    createdAt: '2025-03-21T09:00:00.000Z',
    updatedAt: '2025-03-21T09:00:00.000Z',
    isPinned: false,
    groups: [],
    ungroupedTabs: [
      { id: 't2', title: 'Figma', url: 'https://figma.com' },
      { id: 't3', title: 'Slack', url: 'https://slack.com' },
    ],
  },
  {
    id: 'session-research',
    name: 'Research',
    createdAt: '2025-03-22T09:00:00.000Z',
    updatedAt: '2025-03-22T09:00:00.000Z',
    isPinned: false,
    groups: [],
    ungroupedTabs: [
      { id: 't4', title: 'MDN', url: 'https://developer.mozilla.org' },
    ],
  },
];

/** Seeds the fake browser local storage with sessions BEFORE the story mounts. */
function withSeededSessions(sessions: Session[]) {
  return function SessionSeeder(Story: React.ComponentType) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
      sessionsItem.setValue(sessions).then(() => setReady(true));
    }, []);
    if (!ready) return null;
    return <Story />;
  };
}

const meta: Meta<typeof ExportSessionsWizard> = {
  title: 'Components/UI/ImportExportWizards/ExportSessionsWizard',
  component: ExportSessionsWizard,
  parameters: { layout: 'centered' },
  args: {
    onOpenChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ExportSessionsWizardOpen: Story = {
  args: { open: true },
};

export const ExportSessionsWizardClosed: Story = {
  args: { open: false },
};

// With sessions seeded in storage: the wizard loads them and lists pinned + unpinned.
export const ExportSessionsWizardWithSessions: Story = {
  args: { open: true },
  decorators: [withSeededSessions(mockSessions)],
};

// Deselect all sessions to cover the disabled-export state.
export const ExportSessionsWizardDeselectAll: Story = {
  args: { open: true },
  decorators: [withSeededSessions(mockSessions)],
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByText('Deselect All'));
  },
};
