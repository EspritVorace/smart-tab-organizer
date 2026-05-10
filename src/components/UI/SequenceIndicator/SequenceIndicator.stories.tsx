import type { Meta, StoryObj } from '@storybook/react';
import { SequenceIndicator } from './SequenceIndicator';

const meta = {
  title: 'Components/UI/SequenceIndicator/SequenceIndicator',
  component: SequenceIndicator,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SequenceIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SequenceIndicatorEmpty: Story = {
  args: {
    activePrefix: null,
  },
};

export const SequenceIndicatorImportPrefix: Story = {
  args: {
    activePrefix: ['i'],
  },
};

export const SequenceIndicatorExportPrefix: Story = {
  args: {
    activePrefix: ['e'],
  },
};

export const SequenceIndicatorMultiKey: Story = {
  args: {
    activePrefix: ['i', 'r'],
  },
};
