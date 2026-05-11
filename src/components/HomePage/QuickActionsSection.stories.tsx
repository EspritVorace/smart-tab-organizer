import type { Meta, StoryObj } from '@storybook/react';
import { QuickActionsSection } from './QuickActionsSection';

const meta = {
  title: 'Components/HomePage/QuickActionsSection',
  component: QuickActionsSection,
  parameters: {
    layout: 'padded',
    landmark: false,
  },
  tags: ['autodocs'],
  args: {
    onAction: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1064 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QuickActionsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const QuickActionsSectionDefault: Story = {
  args: { count: 5 },
};

export const QuickActionsSectionThree: Story = {
  args: { count: 3 },
};

export const QuickActionsSectionAll: Story = {
  args: { count: 7 },
};
