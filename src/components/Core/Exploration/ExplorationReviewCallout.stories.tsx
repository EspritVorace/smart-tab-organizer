import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@radix-ui/themes';
import { ExplorationReviewCallout } from './ExplorationReviewCallout';

const meta = {
  title: 'Components/Core/Exploration/ExplorationReviewCallout',
  component: ExplorationReviewCallout,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Render at a realistic page-column width so the prompt reads on one line,
  // as it does under the coverage summary on the exploration page.
  decorators: [
    (Story) => (
      <Box style={{ maxWidth: 680 }}>
        <Story />
      </Box>
    ),
  ],
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
