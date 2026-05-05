import type { Meta, StoryObj } from '@storybook/react';
import { HomePageSkeleton } from './HomePageSkeleton';

const meta = {
  title: 'Components/HomePage/HomePageSkeleton',
  component: HomePageSkeleton,
  parameters: {
    layout: 'padded',
    landmark: false,
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1064 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HomePageSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HomePageSkeletonDefault: Story = {};
