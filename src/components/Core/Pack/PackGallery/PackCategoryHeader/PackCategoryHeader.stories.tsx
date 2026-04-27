import type { Meta, StoryObj } from '@storybook/react';
import { PackCategoryHeader } from './PackCategoryHeader';

const meta = {
  title: 'Components/Core/Pack/PackGallery/PackCategoryHeader',
  component: PackCategoryHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PackCategoryHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PackCategoryHeaderDefault: Story = {
  args: {
    label: 'Cloud',
    icon: '☁️',
    count: 4,
  },
};

export const PackCategoryHeaderNoIcon: Story = {
  args: {
    label: 'Development',
    count: 2,
  },
};
