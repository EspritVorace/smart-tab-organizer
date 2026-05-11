import type { Meta, StoryObj } from '@storybook/react';
import { HeroOnboarding } from './HeroOnboarding';

const meta = {
  title: 'Components/HomePage/HeroOnboarding',
  component: HeroOnboarding,
  parameters: {
    layout: 'padded',
    landmark: false,
  },
  tags: ['autodocs'],
  args: {
    onImportPack: () => {},
    onCreateRule: () => {},
  },
} satisfies Meta<typeof HeroOnboarding>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HeroOnboardingDefault: Story = {};
