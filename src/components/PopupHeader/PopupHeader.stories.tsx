import type { Meta, StoryObj } from '@storybook/react';
import { PopupHeader } from './PopupHeader';

const meta: Meta<typeof PopupHeader> = {
  title: 'Components/PopupHeader',
  component: PopupHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onSettingsOpen: { action: 'settings-opened' },
  },
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