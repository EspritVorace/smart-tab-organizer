import type { Meta, StoryObj } from '@storybook/react';
import { ExplorationReviewCallout } from './ExplorationReviewCallout';

const meta = {
  title: 'Components/Core/Exploration/ExplorationReviewCallout',
  component: ExplorationReviewCallout,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ExplorationReviewCallout>;

export default meta;
type Story = StoryObj<typeof meta>;

// Eligible and not yet dismissed: the discreet review prompt is visible.
export const ExplorationReviewCalloutEligible: Story = {
  args: { eligible: true },
};

// Below the milestone: the component renders nothing.
export const ExplorationReviewCalloutNotEligible: Story = {
  args: { eligible: false },
};
