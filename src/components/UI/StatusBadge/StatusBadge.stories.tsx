import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './StatusBadge';

const meta = {
  title: 'Components/UI/StatusBadge/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StatusBadgeNew: Story = {
  args: {
    type: 'NEW'
  }
};

export const StatusBadgeWarning: Story = {
  args: {
    type: 'WARNING'
  }
};

export const StatusBadgeDeleted: Story = {
  args: {
    type: 'DELETED'
  }
};

export const StatusBadgeSize2: Story = {
  args: {
    type: 'NEW',
    size: '2'
  }
};

export const StatusBadgeSize3: Story = {
  args: {
    type: 'WARNING',
    size: '3'
  }
};