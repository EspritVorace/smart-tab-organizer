import type { Meta, StoryObj } from '@storybook/react';
import { within, expect, waitFor } from 'storybook/test';
import { Theme } from '@radix-ui/themes';
import { AlertDialogShell } from './AlertDialogShell';

const meta: Meta<typeof AlertDialogShell> = {
  title: 'Components/Core/TabTree/AlertDialogShell',
  component: AlertDialogShell,
  parameters: {
    layout: 'centered',
    a11y: { config: {} },
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
    onClose: () => {},
    onSoftAction: () => {},
    onDestructiveAction: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Focus lands on the Cancel button (first, least destructive action).
export const AlertDialogShellDefault: Story = {
  args: {
    title: 'Delete last tab?',
    description: 'The group will also be removed when its last tab is deleted.',
    softActionLabel: 'Delete tab only',
    destructiveActionLabel: 'Delete tab and group',
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    // The Cancel button is the only gray soft button in this dialog
    const cancelBtn = await body.findByRole('button', { name: /cancel/i });
    await waitFor(() => expect(cancelBtn).toHaveFocus());
  },
};
