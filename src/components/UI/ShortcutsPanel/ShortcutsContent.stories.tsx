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

export const ShortcutsContentDefault: Story = {};

export const ShortcutsContentSingleGroup: Story = {
  args: {
    groups: [
      {
        titleKey: 'shortcutsGroupSessionCard',
        shortcuts: [
          { keys: ['R'], descriptionKey: 'shortcutDescSessionRestoreCustom' },
          { keys: ['Shift+R'], descriptionKey: 'shortcutDescSessionRestoreCurrent' },
          { keys: ['Alt+R'], descriptionKey: 'shortcutDescSessionReplaceCurrent' },
          { keys: ['Alt+Shift+R'], descriptionKey: 'shortcutDescSessionRestoreNew' },
        ],
      },
    ],
  },
};
