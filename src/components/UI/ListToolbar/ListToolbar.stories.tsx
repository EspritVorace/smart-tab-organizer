import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@radix-ui/themes';
import { Plus, Camera } from 'lucide-react';
import { ListToolbar } from './ListToolbar';
import { RuleViewMenu } from '@/components/UI/RuleViewMenu';
import { DEFAULT_RULE_VIEW_STATE, type RuleViewState } from '@/utils/ruleViewUtils';

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
        <Plus size={16} />
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
        <Camera size={16} />
        Take Snapshot
      </Button>
    ),
  },
  render: (args) => <ControlledListToolbar {...args} />,
};

function FilterMenu() {
  const [view, setView] = useState<RuleViewState>({
    ...DEFAULT_RULE_VIEW_STATE,
    sort: 'date',
    group: 'category',
  });
  return <RuleViewMenu value={view} onChange={setView} testId="page-rules-btn-view" />;
}

export const ListToolbarWithFilter: Story = {
  args: {
    testId: 'page-rules-toolbar',
    searchTestId: 'page-rules-search',
    searchPlaceholder: 'Search rules',
    searchValue: '',
    onSearchChange: () => {},
    filter: <FilterMenu />,
    action: (
      <Button onClick={() => {}}>
        <Plus size={16} />
        Add Rule
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
        <Plus size={16} />
        Add Rule
      </Button>
    ),
  },
  render: (args) => <ControlledListToolbar {...args} />,
};
