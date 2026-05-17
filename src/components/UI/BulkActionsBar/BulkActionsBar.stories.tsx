import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Theme, Button, Box } from '@radix-ui/themes';
import { Eye, EyeOff, FileDown, Trash2 } from 'lucide-react';
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
      <Button size="1" variant="solid">
        <Eye size={14} />
        Enable Selected
      </Button>
      <Button size="1" variant="soft">
        <EyeOff size={14} />
        Disable Selected
      </Button>
      <Button size="1" variant="soft">
        <FileDown size={14} />
        Export Selected
      </Button>
      <Button size="1" variant="solid" color="red" highContrast>
        <Trash2 size={14} />
        Delete Selected
      </Button>
    </>
  );
}

function sessionsActions() {
  return (
    <>
      <Button size="1" variant="soft">
        <FileDown size={14} />
        Export Selected
      </Button>
      <Button size="1" variant="solid" color="red" highContrast>
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
    children: sessionsActions(),
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
    children: sessionsActions(),
  },
  render: (args) => <ControlledBulkBar {...args} />,
};
