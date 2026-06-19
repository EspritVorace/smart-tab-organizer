import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from 'storybook/test';
import { Command } from 'cmdk';
import { Badge, Theme } from '@radix-ui/themes';
import { SearchableInlineList } from './SearchableInlineList';
import type { SearchableSelectOption } from './SearchableSelect';

const meta: Meta<typeof SearchableInlineList> = {
  title: 'Components/Form/FormFields/SearchableInlineList',
  component: SearchableInlineList,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Theme accentColor="indigo">
        <div style={{ width: 360, height: 320, display: 'flex', flexDirection: 'column' }}>
          <Story />
        </div>
      </Theme>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const fruits: SearchableSelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
];

// Default render path: behavior unchanged (SearchableSelectItem rows).
export const SearchableInlineListDefault: Story = {
  render: () => {
    const [value, setValue] = useState('banana');
    return (
      <SearchableInlineList
        value={value}
        onValueChange={setValue}
        options={fruits}
        searchPlaceholder="Search a fruit..."
        emptyMessage="No fruit found."
        aria-label="Fruits"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Search a fruit...');
    await userEvent.type(input, 'cher');
    await expect(canvas.getByText('Cherry')).toBeInTheDocument();
  },
};

// Pressing Enter from the empty search input selects the first result.
export const SearchableInlineListEnterSelectsFirst: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchableInlineList
        value={value}
        onValueChange={setValue}
        options={fruits}
        searchPlaceholder="Search a fruit..."
        emptyMessage="No fruit found."
        aria-label="Fruits"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Search a fruit...');
    input.focus();
    // Enter on the empty query lands on the first item (Apple).
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByText('Apple').closest('[cmdk-item=""]')).toHaveClass(
      'ss-item--selected',
    );
  },
};

// Typing then Enter selects the first filtered result.
export const SearchableInlineListEnterSelectsFirstFiltered: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchableInlineList
        value={value}
        onValueChange={setValue}
        options={fruits}
        searchPlaceholder="Search a fruit..."
        emptyMessage="No fruit found."
        aria-label="Fruits"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Search a fruit...');
    input.focus();
    await userEvent.type(input, 'e');
    await userEvent.keyboard('{Enter}');
    // "e" matches several fruits; the first rendered result becomes selected.
    await expect(
      canvasElement.querySelector('[cmdk-item=""].ss-item--selected'),
    ).toBeInTheDocument();
  },
};

// Custom render path: the renderItem prop supplies rich rows with a trailing badge.
export const SearchableInlineListCustomRenderItem: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchableInlineList
        value={value}
        onValueChange={setValue}
        options={fruits}
        searchPlaceholder="Search a fruit..."
        emptyMessage="No fruit found."
        aria-label="Fruits"
        renderItem={(option) => (
          <Command.Item
            key={option.value}
            value={option.value}
            onSelect={() => setValue(option.value)}
            className="ss-item"
            style={{ display: 'flex', justifyContent: 'space-between', minHeight: 44 }}
            aria-label={`${option.label} (custom)`}
          >
            <span>{option.label}</span>
            <Badge color="green" variant="soft" highContrast aria-hidden="true">
              custom
            </Badge>
          </Command.Item>
        )}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Custom rows render the badge text and the custom accessible name.
    await expect(canvas.getAllByText('custom').length).toBeGreaterThan(0);
    await expect(canvas.getByLabelText('Apple (custom)')).toBeInTheDocument();
  },
};
