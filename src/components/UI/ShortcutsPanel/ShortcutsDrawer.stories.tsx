import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@radix-ui/themes';
import { ShortcutsDrawer } from './ShortcutsDrawer';

const meta = {
  title: 'Components/UI/ShortcutsPanel/ShortcutsDrawer',
  component: ShortcutsDrawer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box style={{ width: 400, minHeight: 500, background: 'var(--gray-a2)', position: 'relative' }}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof ShortcutsDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShortcutsDrawerOpenInPopup: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
};
