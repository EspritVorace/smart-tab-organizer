import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './Header';

const meta: Meta<typeof Header> = {
  title: 'Components/UI/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HeaderDefault: Story = {
  name: 'System Theme',
  args: {
    settings: {
      darkModePreference: 'system'
    },
  },
};

export const HeaderLight: Story = {
  name: 'Light Mode',
  args: {
    settings: {
      darkModePreference: 'disabled'
    },
  },
};

export const HeaderDark: Story = {
  name: 'Dark Mode',
  args: {
    settings: {
      darkModePreference: 'enabled'
    },
  },
};