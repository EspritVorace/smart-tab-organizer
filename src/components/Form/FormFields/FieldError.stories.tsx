import type { Meta, StoryObj } from '@storybook/react';
import { FieldError } from './FieldError';

const meta: Meta<typeof FieldError> = {
  title: 'Components/Form/FormFields/FieldError',
  component: FieldError,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FieldErrorDefault: Story = {
  args: {
    error: {
      message: 'This field is required',
    },
  },
};

export const FieldErrorLong: Story = {
  args: {
    error: {
      message: 'Invalid Regular Expression (must have capturing group ())',
    },
  },
};

export const FieldErrorNone: Story = {
  args: {
    error: undefined,
  },
};