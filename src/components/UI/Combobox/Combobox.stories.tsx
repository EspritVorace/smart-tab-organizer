import type { Meta, StoryObj } from '@storybook/react';
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