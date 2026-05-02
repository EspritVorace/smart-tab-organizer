import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@radix-ui/themes';
import { PopupToolbar } from './PopupToolbar';

const meta: Meta<typeof PopupToolbar> = {
  title: 'Components/UI/PopupToolbar',
  component: PopupToolbar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    tabCount: { control: { type: 'number', min: 0 } },
    activeRulesCount: { control: { type: 'number', min: 0 } },
    hasSessions: { control: 'boolean' },
    canSave: { control: 'boolean' },
    isOrganizing: { control: 'boolean' },
    activeTabGroupId: { control: { type: 'number' } },
  },
  decorators: [
    (Story) => (
      <Box style={{ width: 368, padding: 16, background: 'var(--gray-a2)' }}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof PopupToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PopupToolbarDefault: Story = {
  name: 'Default',
  args: {
    tabCount: 12,
    activeRulesCount: 5,
    hasSessions: true,
    canSave: true,
    isOrganizing: false,
    activeTabGroupId: null,
  },
};

export const PopupToolbarOrganizing: Story = {
  name: 'Organizing in progress',
  args: {
    tabCount: 12,
    activeRulesCount: 5,
    hasSessions: true,
    canSave: true,
    isOrganizing: true,
    activeTabGroupId: null,
  },
};

export const PopupToolbarNoSessions: Story = {
  name: 'No sessions (Restore disabled)',
  args: {
    tabCount: 8,
    activeRulesCount: 3,
    hasSessions: false,
    canSave: true,
    isOrganizing: false,
    activeTabGroupId: null,
  },
};

export const PopupToolbarSaveDisabled: Story = {
  name: 'Save disabled (no capturable tab)',
  args: {
    tabCount: 1,
    activeRulesCount: 5,
    hasSessions: true,
    canSave: false,
    isOrganizing: false,
    activeTabGroupId: null,
  },
};

export const PopupToolbarNoRules: Story = {
  name: 'No active rules',
  args: {
    tabCount: 7,
    activeRulesCount: 0,
    hasSessions: true,
    canSave: true,
    isOrganizing: false,
    activeTabGroupId: null,
  },
};

export const PopupToolbarSingleTab: Story = {
  name: 'Single tab and single rule',
  args: {
    tabCount: 1,
    activeRulesCount: 1,
    hasSessions: true,
    canSave: true,
    isOrganizing: false,
    activeTabGroupId: null,
  },
};

export const PopupToolbarManyTabs: Story = {
  name: 'Many tabs and rules',
  args: {
    tabCount: 87,
    activeRulesCount: 24,
    hasSessions: true,
    canSave: true,
    isOrganizing: false,
    activeTabGroupId: null,
  },
};
