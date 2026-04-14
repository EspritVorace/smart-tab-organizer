import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@radix-ui/themes';
import { Plus, Camera } from 'lucide-react';
import { ListToolbar } from './ListToolbar';

const meta = {
  title: 'Components/UI/ListToolbar/ListToolbar',
  component: ListToolbar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ListToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledListToolbar(props: React.ComponentProps<typeof ListToolbar>) {
  const [value, setValue] = useState(props.searchValue);
  return (
    <ListToolbar
      {...props}
      searchValue={value}
      onSearchChange={setValue}
    />
  );
}

export const ListToolbarAddRule: Story = {
  args: {
    testId: 'page-rules-toolbar',
    searchTestId: 'page-rules-search',
    searchPlaceholder: 'Search rules',
    searchValue: '',
    onSearchChange: () => {},
    action: (
      <Button onClick={() => {}}>
        <Plus size={16} aria-hidden="true" />
        Add Rule
      </Button>
    ),
  },
  render: (args) => <ControlledListToolbar {...args} />,
};

export const ListToolbarTakeSnapshot: Story = {
  args: {
    testId: 'page-sessions-toolbar',
    searchTestId: 'page-sessions-search',
    searchPlaceholder: 'Search sessions',
    searchValue: '',
    onSearchChange: () => {},
    action: (
      <Button variant="solid" size="2" onClick={() => {}} style={{ color: 'white' }}>
        <Camera size={16} aria-hidden="true" />
        Take Snapshot
      </Button>
    ),
  },
  render: (args) => <ControlledListToolbar {...args} />,
};

export const ListToolbarWithSearchValue: Story = {
  args: {
    testId: 'page-rules-toolbar',
    searchTestId: 'page-rules-search',
    searchPlaceholder: 'Search rules',
    searchValue: 'github',
    onSearchChange: () => {},
    action: (
      <Button onClick={() => {}}>
        <Plus size={16} aria-hidden="true" />
        Add Rule
      </Button>
    ),
  },
  render: (args) => <ControlledListToolbar {...args} />,
};
