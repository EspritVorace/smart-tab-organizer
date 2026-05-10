import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@radix-ui/themes';
import { ShortcutsContent } from './ShortcutsContent';

const meta = {
  title: 'Components/UI/ShortcutsPanel/ShortcutsContent',
  component: ShortcutsContent,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box style={{ width: 360 }}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof ShortcutsContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShortcutsContentPopup: Story = {
  args: { surface: 'popup' },
};

export const ShortcutsContentOptions: Story = {
  args: { surface: 'options' },
};

export const ShortcutsContentOnRules: Story = {
  args: { surface: 'options', pageContext: 'rules' },
};

export const ShortcutsContentOnSessions: Story = {
  args: { surface: 'options', pageContext: 'sessions' },
};

export const ShortcutsContentOnHome: Story = {
  args: { surface: 'options', pageContext: 'home' },
};

export const ShortcutsContentOnStats: Story = {
  args: { surface: 'options', pageContext: 'stats' },
};
