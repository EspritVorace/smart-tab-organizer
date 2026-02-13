import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { Combobox, ComboboxOption, ComboboxGroup } from './Combobox';

const meta: Meta<typeof Combobox> = {
  title: 'Components/UI/Combobox/Combobox',
  component: Combobox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    width: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample options for stories
const sampleOptions: ComboboxOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
];

const sampleGroups: ComboboxGroup[] = [
  {
    label: 'Fruits',
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'cherry', label: 'Cherry' },
    ],
  },
  {
    label: 'Vegetables',
    options: [
      { value: 'carrot', label: 'Carrot' },
      { value: 'broccoli', label: 'Broccoli' },
      { value: 'spinach', label: 'Spinach' },
    ],
  },
  {
    label: 'Grains',
    options: [
      { value: 'rice', label: 'Rice' },
      { value: 'wheat', label: 'Wheat' },
      { value: 'oats', label: 'Oats' },
    ],
  },
];

export const ComboboxDefault: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Choose a fruit...',
    searchPlaceholder: 'Search fruits...',
  },
};

export const ComboboxWithValue: Story = {
  args: {
    options: sampleOptions,
    value: 'banana',
    placeholder: 'Choose a fruit...',
    searchPlaceholder: 'Search fruits...',
  },
};

export const ComboboxDisabled: Story = {
  args: {
    options: sampleOptions,
    disabled: true,
    placeholder: 'Choose a fruit...',
  },
};

export const ComboboxWithGroups: Story = {
  args: {
    groups: sampleGroups,
    placeholder: 'Choose a food...',
    searchPlaceholder: 'Search foods...',
  },
};

export const ComboboxWithGroupsAndValue: Story = {
  args: {
    groups: sampleGroups,
    value: 'carrot',
    placeholder: 'Choose a food...',
    searchPlaceholder: 'Search foods...',
  },
};

export const ComboboxWithDisabledOptions: Story = {
  args: {
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana', disabled: true },
      { value: 'cherry', label: 'Cherry' },
      { value: 'date', label: 'Date', disabled: true },
      { value: 'elderberry', label: 'Elderberry' },
    ],
    placeholder: 'Choose a fruit...',
    searchPlaceholder: 'Search fruits...',
  },
};

export const ComboboxCustomWidth: Story = {
  args: {
    options: sampleOptions,
    width: '300px',
    placeholder: 'Choose a fruit...',
    searchPlaceholder: 'Search fruits...',
  },
};

export const ComboboxLongList: Story = {
  args: {
    options: [
      { value: 'afghanistan', label: 'Afghanistan' },
      { value: 'albania', label: 'Albania' },
      { value: 'algeria', label: 'Algeria' },
      { value: 'andorra', label: 'Andorra' },
      { value: 'angola', label: 'Angola' },
      { value: 'argentina', label: 'Argentina' },
      { value: 'armenia', label: 'Armenia' },
      { value: 'australia', label: 'Australia' },
      { value: 'austria', label: 'Austria' },
      { value: 'azerbaijan', label: 'Azerbaijan' },
      { value: 'bahamas', label: 'Bahamas' },
      { value: 'bahrain', label: 'Bahrain' },
      { value: 'bangladesh', label: 'Bangladesh' },
      { value: 'barbados', label: 'Barbados' },
      { value: 'belarus', label: 'Belarus' },
      { value: 'belgium', label: 'Belgium' },
      { value: 'belize', label: 'Belize' },
      { value: 'benin', label: 'Benin' },
      { value: 'bhutan', label: 'Bhutan' },
      { value: 'bolivia', label: 'Bolivia' },
    ],
    placeholder: 'Choose a country...',
    searchPlaceholder: 'Search countries...',
  },
};

export const ComboboxEmpty: Story = {
  args: {
    options: [],
    placeholder: 'No options available',
    searchPlaceholder: 'Search...',
    noResultsText: 'No options to display',
  },
};

export const ComboboxInteraction: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Interaction Test...',
    searchPlaceholder: 'Search fruits...',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    // Initial state
    await expect(canvas.getByText('Interaction Test...')).toBeInTheDocument();

    // Open combobox
    await userEvent.click(trigger);

    // Check if the search input is visible
    const searchInput = canvas.getByPlaceholderText('Search fruits...');
    await expect(searchInput).toBeInTheDocument();

    // Type 'ba' to filter
    await userEvent.type(searchInput, 'ba');

    // Banana should be visible, Apple should not
    await expect(canvas.getByText('Banana')).toBeInTheDocument();
    await expect(canvas.queryByText('Apple')).not.toBeInTheDocument();

    // Select Banana
    await userEvent.click(canvas.getByText('Banana'));

    // Combobox should now show Banana and search should be gone
    await expect(canvas.getByText('Banana')).toBeInTheDocument();
    await expect(canvas.queryByPlaceholderText('Search fruits...')).not.toBeInTheDocument();
  },
};