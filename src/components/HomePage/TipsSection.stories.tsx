import type { Meta, StoryObj } from '@storybook/react';
import { TipsSection } from './TipsSection';

const meta = {
  title: 'Components/HomePage/TipsSection',
  component: TipsSection,
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
} satisfies Meta<typeof TipsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TipsSectionCards: Story = {
  args: { variant: 'cards' },
};

export const TipsSectionListe: Story = {
  args: { variant: 'liste' },
};

export const TipsSectionAccordeon: Story = {
  args: { variant: 'accordeon' },
};
