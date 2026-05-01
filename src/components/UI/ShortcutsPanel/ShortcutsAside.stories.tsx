import type { Meta, StoryObj } from '@storybook/react';
import { Flex } from '@radix-ui/themes';
import { ShortcutsAside } from './ShortcutsAside';

const meta = {
  title: 'Components/UI/ShortcutsPanel/ShortcutsAside',
  component: ShortcutsAside,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Flex style={{ height: 600, alignItems: 'stretch' }}>
        <div style={{ flex: 1, padding: 16 }}>Mock options content (squeezed when panel opens)</div>
        <Story />
      </Flex>
    ),
  ],
} satisfies Meta<typeof ShortcutsAside>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShortcutsAsideOpen: Story = {
  args: {
    open: true,
    onClose: () => {},
  },
};

export const ShortcutsAsideClosed: Story = {
  args: {
    open: false,
    onClose: () => {},
  },
};
