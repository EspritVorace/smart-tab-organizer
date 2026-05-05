import type { Meta, StoryObj } from '@storybook/react';
import { HeroCompact } from './HeroCompact';

const meta = {
  title: 'Components/HomePage/HeroCompact',
  component: HeroCompact,
  parameters: {
    layout: 'padded',
    landmark: false,
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HeroCompact>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HeroCompactDefault: Story = {};
