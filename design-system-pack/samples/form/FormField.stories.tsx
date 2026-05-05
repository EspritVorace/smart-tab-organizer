import type { Meta, StoryObj } from '@storybook/react';
import { TextField } from '@radix-ui/themes';
import { FormField } from './FormField';

const meta: Meta<typeof FormField> = {
  title: 'Components/Form/FormFields/FormField',
  component: FormField,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    required: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FormFieldDefault: Story = {
  args: {
    label: 'Field Label',
    required: false,
    children: <TextField.Root placeholder="Enter value..." style={{ marginTop: '4px' }} />,
  },
};

export const FormFieldRequired: Story = {
  args: {
    label: 'Required Field',
    required: true,
    children: <TextField.Root placeholder="Enter value..." style={{ marginTop: '4px' }} />,
  },
};

export const FormFieldWithError: Story = {
  args: {
    label: 'Field with Error',
    required: true,
    error: {
      message: 'This field is required',
    },
    children: <TextField.Root placeholder="Enter value..." style={{ marginTop: '4px' }} />,
  },
};