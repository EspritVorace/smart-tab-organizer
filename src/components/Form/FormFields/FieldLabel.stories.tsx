import type { Meta, StoryObj } from '@storybook/react';
import { FieldLabel } from './FieldLabel';

const meta: Meta<typeof FieldLabel> = {
  title: 'Components/Form/FormFields/FieldLabel',
  component: FieldLabel,
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

export const FieldLabelDefault: Story = {
  args: {
    children: 'Field Label',
    required: false,
  },
};

export const FieldLabelRequired: Story = {
  args: {
    children: 'Required Field',
    required: true,
  },
};

export const FieldLabelLong: Story = {
  args: {
    children: 'Very Long Field Label Text That Might Wrap',
    required: true,
  },
};