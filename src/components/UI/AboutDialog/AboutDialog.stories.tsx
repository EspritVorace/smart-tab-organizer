import type { Meta, StoryObj } from '@storybook/react';
import { Theme } from '@radix-ui/themes';
import { AboutDialog } from './AboutDialog';

const meta: Meta<typeof AboutDialog> = {
  title: 'Components/UI/AboutDialog/AboutDialog',
  component: AboutDialog,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Theme accentColor="indigo">
        <Story />
      </Theme>
    ),
  ],
  args: {
    open: true,
    onOpenChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AboutDialogDefault: Story = {};
