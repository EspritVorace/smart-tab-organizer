import type { Meta, StoryObj } from '@storybook/react';
import { AriaButton } from './AriaButton';

const meta: Meta<typeof AriaButton> = {
  title: 'Components/UI/AriaButton',
  component: AriaButton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    ariaDisabled: { control: 'boolean' },
    disabledReason: { control: 'text' },
  },
} satisfies Meta<typeof AriaButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AriaButtonEnabled: Story = {
  name: 'Enabled',
  args: {
    children: 'Click me',
    ariaDisabled: false,
    onClick: () => alert('clicked'),
  },
};

export const AriaButtonDisabledNoReason: Story = {
  name: 'aria-disabled (no tooltip)',
  args: {
    children: 'Disabled button',
    ariaDisabled: true,
    onClick: () => alert('should not fire'),
  },
};

export const AriaButtonDisabledWithReason: Story = {
  name: 'aria-disabled with tooltip reason',
  args: {
    children: 'Save session',
    ariaDisabled: true,
    disabledReason: 'No active tab group to save',
    onClick: () => alert('should not fire'),
  },
};
