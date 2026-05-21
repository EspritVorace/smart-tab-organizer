import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Theme, Button, Box } from '@radix-ui/themes';
import { Eye, EyeOff, FileDown, Pin, PinOff, Trash2 } from 'lucide-react';
import { BulkActionsBar } from './BulkActionsBar';

const meta = {
  title: 'Components/UI/BulkActionsBar/BulkActionsBar',
  component: BulkActionsBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Theme accentColor="indigo">
        <Box style={{ maxWidth: 720 }}>
          <Story />
        </Box>
      </Theme>
    ),
  ],
} satisfies Meta<typeof BulkActionsBar>;

export default meta;
type Story = StoryObj<typeof meta>;

function rulesActions() {
  return (
    <>
      <Button size="1" variant="ghost">
        <Eye size={14} />
        Enable Selected
      </Button>
      <Button size="1" variant="ghost">
        <EyeOff size={14} />
        Disable Selected
      </Button>
      <Button size="1" variant="ghost">
        <FileDown size={14} />
        Export Selected
      </Button>
      <Button size="1" variant="ghost" color="red">
        <Trash2 size={14} />
        Delete Selected
      </Button>
    </>
  );
}

function sessionsUnpinnedActions() {
  return (
    <>
      <Button size="1" variant="ghost">
        <Pin size={14} />
        Pin Selected
      </Button>
      <Button size="1" variant="ghost">
        <FileDown size={14} />
        Export Selected
      </Button>
      <Button size="1" variant="ghost" color="red">
        <Trash2 size={14} />
        Delete Selected
      </Button>
    </>
  );
}

function sessionsPinnedActions() {
  return (
    <>
      <Button size="1" variant="ghost">
        <PinOff size={14} />
        Unpin Selected
      </Button>
      <Button size="1" variant="ghost">
        <FileDown size={14} />
        Export Selected
      </Button>
      <Button size="1" variant="ghost" color="red">
        <Trash2 size={14} />
        Delete Selected
      </Button>
    </>
  );
}

function ControlledBulkBar(props: React.ComponentProps<typeof BulkActionsBar>) {
  const [allSelected, setAllSelected] = useState(props.isAllSelected);
  return (
    <BulkActionsBar
      {...props}
      isAllSelected={allSelected}
      onSelectAll={(checked) => setAllSelected(checked)}
    />
  );
}

export const BulkActionsBarDefault: Story = {
  args: {
    testId: 'demo-bulk-bar',
    selectedCount: 3,
    isAllSelected: false,
    isIndeterminate: true,
    onSelectAll: () => {},
    children: rulesActions(),
  },
  render: (args) => <ControlledBulkBar {...args} />,
};

export const BulkActionsBarSessions: Story = {
  args: {
    testId: 'page-sessions-bulk-bar-unpinned',
    selectedCount: 2,
    isAllSelected: false,
    isIndeterminate: true,
    onSelectAll: () => {},
    children: sessionsUnpinnedActions(),
  },
  render: (args) => <ControlledBulkBar {...args} />,
};

export const BulkActionsBarSessionsPinned: Story = {
  args: {
    testId: 'page-sessions-bulk-bar-pinned',
    selectedCount: 1,
    isAllSelected: false,
    isIndeterminate: true,
    onSelectAll: () => {},
    children: sessionsPinnedActions(),
  },
  render: (args) => <ControlledBulkBar {...args} />,
};

export const BulkActionsBarAllSelected: Story = {
  args: {
    testId: 'demo-bulk-bar',
    selectedCount: 5,
    isAllSelected: true,
    isIndeterminate: false,
    onSelectAll: () => {},
    children: rulesActions(),
  },
  render: (args) => <ControlledBulkBar {...args} />,
};

export const BulkActionsBarSingleSelected: Story = {
  args: {
    testId: 'demo-bulk-bar',
    selectedCount: 1,
    isAllSelected: false,
    isIndeterminate: true,
    onSelectAll: () => {},
    children: sessionsUnpinnedActions(),
  },
  render: (args) => <ControlledBulkBar {...args} />,
};
