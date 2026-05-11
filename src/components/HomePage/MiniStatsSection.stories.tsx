import type { Meta, StoryObj } from '@storybook/react';
import { MiniStatsSection } from './MiniStatsSection';

const meta = {
  title: 'Components/HomePage/MiniStatsSection',
  component: MiniStatsSection,
  parameters: {
    layout: 'padded',
    landmark: false,
  },
  tags: ['autodocs'],
  args: {
    onNavigate: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1064 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MiniStatsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MiniStatsSectionDefault: Story = {
  args: {
    stats: { groups: 142, dedup: 87, sessions: 12 },
  },
};

export const MiniStatsSectionLargeNumbers: Story = {
  args: {
    stats: { groups: 12_345, dedup: 7_890, sessions: 124 },
  },
};

export const MiniStatsSectionAllZero: Story = {
  args: {
    stats: { groups: 0, dedup: 0, sessions: 0 },
  },
};

export const MiniStatsSectionEnglishLocale: Story = {
  args: {
    stats: { groups: 12_345, dedup: 7_890, sessions: 124 },
    locale: 'en-US',
  },
};
