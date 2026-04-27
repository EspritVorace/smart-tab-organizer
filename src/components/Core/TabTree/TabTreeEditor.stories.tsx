import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from 'storybook/test';
import { TabTreeEditor } from './TabTreeEditor';
import type { Session } from '@/types/session';

const mockSession: Session = {
  id: 'session-editor',
  name: 'Editor Session',
  createdAt: '2025-03-20T09:00:00.000Z',
  updatedAt: '2025-03-28T17:30:00.000Z',
  isPinned: false,
  categoryId: null,
  groups: [
    {
      id: 'grp-1',
      title: 'Frontend',
      color: 'blue',
      tabs: [
        { id: 't1', title: 'React Docs', url: 'https://react.dev', favIconUrl: '' },
        { id: 't2', title: 'GitHub PR #42', url: 'https://github.com/pull/42', favIconUrl: '' },
      ],
    },
    {
      id: 'grp-2',
      title: 'Backend',
      color: 'green',
      tabs: [
        { id: 't3', title: 'FastAPI', url: 'https://fastapi.tiangolo.com/', favIconUrl: '' },
      ],
    },
  ],
  ungroupedTabs: [
    { id: 't4', title: 'Figma Designs', url: 'https://figma.com/file/abc', favIconUrl: '' },
    { id: 't5', title: 'Slack', url: 'https://app.slack.com/', favIconUrl: '' },
  ],
};

const meta: Meta<typeof TabTreeEditor> = {
  title: 'Components/Core/TabTree/TabTreeEditor',
  component: TabTreeEditor,
  parameters: { layout: 'padded' },
  args: {
    onSessionChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TabTreeEditorDefault: Story = {
  args: { session: mockSession },
};

export const TabTreeEditorWithMaxHeight: Story = {
  args: { session: mockSession, maxHeight: 300 },
};

export const TabTreeEditorEmptyUngrouped: Story = {
  args: {
    session: { ...mockSession, ungroupedTabs: [] },
  },
};

// Opens the group edit row for the first group.
export const TabTreeEditorEditGroup: Story = {
  args: { session: mockSession },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editGroupBtns = canvas.getAllByTitle('Edit group');
    await userEvent.click(editGroupBtns[0]);
  },
};

// Opens the tab edit row for the first ungrouped tab.
export const TabTreeEditorEditTab: Story = {
  args: { session: mockSession },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editTabBtns = canvas.getAllByTitle('Edit tab');
    await userEvent.click(editTabBtns[0]);
  },
};

// Types a new URL in the tab edit row.
export const TabTreeEditorEditTabType: Story = {
  args: { session: mockSession },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editTabBtns = canvas.getAllByTitle('Edit tab');
    await userEvent.click(editTabBtns[0]);
    const input = canvas.getByRole('textbox', { name: /url/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'https://new-url.com');
  },
};

// Types a new group name in the group edit row.
export const TabTreeEditorEditGroupType: Story = {
  args: { session: mockSession },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editGroupBtns = canvas.getAllByTitle('Edit group');
    await userEvent.click(editGroupBtns[0]);
    const input = canvas.getByRole('textbox', { name: /group name/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'Renamed Group');
  },
};
