import type { Meta, StoryObj } from '@storybook/react';
import { RestoreWizard } from './RestoreWizard';
import type { Session } from '@/types/session';

const mockSession: Session = {
  id: 'session-1',
  name: 'Work Sprint 42',
  createdAt: '2025-03-20T09:00:00.000Z',
  updatedAt: '2025-03-28T17:30:00.000Z',
  isPinned: false,
  categoryId: null,
  groups: [
    {
      id: 'grp-frontend',
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

const meta: Meta<typeof RestoreWizard> = {
  title: 'Components/UI/SessionWizards/RestoreWizard',
  component: RestoreWizard,
  parameters: { layout: 'centered' },
  args: {
    onOpenChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const RestoreWizardOpen: Story = {
  args: { open: true, session: mockSession },
};

export const RestoreWizardNoSession: Story = {
  args: { open: true, session: null },
};

export const RestoreWizardClosed: Story = {
  args: { open: false, session: null },
};
