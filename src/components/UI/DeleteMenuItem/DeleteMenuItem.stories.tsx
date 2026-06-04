import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Theme, DropdownMenu, Box } from '@radix-ui/themes';
import { DeleteMenuItem } from './DeleteMenuItem';

/**
 * DeleteMenuItem must live inside a DropdownMenu.Root + DropdownMenu.Content
 * to render correctly (Radix context requirement).
 * The decorator opens the menu statically so Storybook can display the item.
 */
const meta: Meta<typeof DeleteMenuItem> = {
  title: 'Components/UI/DeleteMenuItem',
  component: DeleteMenuItem,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Theme>
        <Box style={{ minWidth: 200 }}>
          <DropdownMenu.Root open>
            <DropdownMenu.Trigger>
              {/* Trigger is hidden; menu is forced open via the open prop */}
              <span />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <Story />
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Box>
      </Theme>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Stories ─────────────────────────────────────────────────────────────────── */

export const DeleteMenuItemDefault: Story = {
  args: {
    onClick: () => {},
  },
};

export const DeleteMenuItemWithTestId: Story = {
  name: 'DeleteMenuItem — with data-testid',
  args: {
    onClick: () => {},
    'data-testid': 'my-item-menu-delete',
  },
};
