import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@radix-ui/themes';
import { PopupHeader } from './PopupHeader';

const meta: Meta<typeof PopupHeader> = {
  title: 'Components/UI/PopupHeader',
  component: PopupHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onSettingsOpen: { action: 'settings-opened' },
  },
  decorators: [
    (Story) => (
      <Box style={{ width: 350 }}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof PopupHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PopupHeaderDefault: Story = {
  name: 'Default Header',
  args: {
    title: 'Smart Tab Organizer',
  },
};

export const PopupHeaderShort: Story = {
  name: 'Short Title',
  args: {
    title: 'Tabs',
  },
};

export const PopupHeaderLong: Story = {
  name: 'Long Title',
  args: {
    title: 'Smart Tab Organizer Extension',
  },
};