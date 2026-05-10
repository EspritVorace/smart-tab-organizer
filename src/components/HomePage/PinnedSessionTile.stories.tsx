import type { Meta, StoryObj } from '@storybook/react';
import type { Session } from '@/types/session';
import { PinnedSessionTile } from './PinnedSessionTile';

const baseSession: Session = {
  id: 's1',
  name: 'Current work',
  createdAt: '2025-01-01T10:00:00.000Z',
  updatedAt: '2025-04-12T08:30:00.000Z',
  groups: [
    {
      id: 'g1',
      title: 'Docs',
      color: 'blue',
      tabs: [
        { id: 't1', title: 'Notion', url: 'https://notion.so' },
        { id: 't2', title: 'Confluence', url: 'https://confluence.example.com' },
      ],
    },
    {
      id: 'g2',
      title: 'Code',
      color: 'green',
      tabs: [
        { id: 't3', title: 'GitHub', url: 'https://github.com' },
        { id: 't4', title: 'CodeSandbox', url: 'https://codesandbox.io' },
      ],
    },
  ],
  ungroupedTabs: [{ id: 't5', title: 'Inbox', url: 'https://mail.example.com' }],
  isPinned: true,
};

const meta = {
  title: 'Components/HomePage/PinnedSessionTile',
  component: PinnedSessionTile,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    session: baseSession,
    onRestore: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PinnedSessionTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PinnedSessionTileDefault: Story = {};

export const PinnedSessionTileLongName: Story = {
  args: {
    session: {
      ...baseSession,
      id: 's-long',
      name: 'A session with a deliberately long name to exercise truncation',
    },
  },
};

export const PinnedSessionTileSingleTab: Story = {
  args: {
    session: {
      ...baseSession,
      id: 's-single',
      groups: [],
      ungroupedTabs: [{ id: 't1', title: 'Single tab', url: 'https://example.com' }],
    },
  },
};

export const PinnedSessionTileEmpty: Story = {
  args: {
    session: {
      ...baseSession,
      id: 's-empty',
      groups: [],
      ungroupedTabs: [],
    },
  },
};
