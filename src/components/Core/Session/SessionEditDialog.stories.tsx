import type { Meta, StoryObj } from '@storybook/react';
import { SessionEditDialog } from './SessionEditDialog';
import type { Session } from '@/types/session';

const mockSession: Session = {
  id: 'session-edit-1',
  name: 'Work Sprint 42',
  createdAt: '2025-03-20T09:00:00.000Z',
  updatedAt: '2025-03-28T17:30:00.000Z',
  isPinned: false,
  categoryId: null,
  note: 'Important sprint',
  groups: [
    {
      id: 'grp-1',
      title: 'Frontend',
      color: 'blue',
      tabs: [
        { id: 't1', title: 'React Docs', url: 'https://react.dev', favIconUrl: '' },
        { id: 't2', title: 'GitHub PR', url: 'https://github.com/pull/42', favIconUrl: '' },
      ],
    },
  ],
  ungroupedTabs: [
    { id: 't3', title: 'Figma', url: 'https://figma.com/file/abc', favIconUrl: '' },
  ],
};

const meta: Meta<typeof SessionEditDialog> = {
  title: 'Components/Core/Session/SessionEditDialog',
  component: SessionEditDialog,
  parameters: { layout: 'centered' },
  args: {
    onOpenChange: () => {},
    onSave: async () => {},
    existingSessions: [],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SessionEditDialogOpen: Story = {
  args: { open: true, session: mockSession },
};

export const SessionEditDialogClosed: Story = {
  args: { open: false, session: null },
};
