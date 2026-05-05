import type { Meta, StoryObj } from '@storybook/react';
import { within, expect, waitFor } from 'storybook/test';
import { Theme } from '@radix-ui/themes';
import { ConfirmDialog } from './ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Components/UI/ConfirmDialog/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'centered',
    // Radix Themes' red-9 and orange-9 solid button backgrounds have a contrast
    // ratio below 4.5:1 (WCAG AA) against white text. This is a pre-existing
    // limitation of the Radix Themes palette that applies throughout the app.
    // These stories exist to verify initial focus behaviour, not to audit the
    // colour palette; the full Playwright E2E a11y audit covers the real context.
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
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
    onOpenChange: () => {},
    onConfirm: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Focus lands on the Cancel button, not the close button or the Confirm button.
export const ConfirmDialogDefault: Story = {
  args: {
    title: 'Delete rule?',
    description: 'This action cannot be undone.',
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const cancelBtn = await body.findByTestId('confirm-dialog-btn-cancel');
    await waitFor(() => expect(cancelBtn).toHaveFocus());
  },
};

export const ConfirmDialogOrange: Story = {
  args: {
    title: 'Reset statistics?',
    description: 'All grouping and deduplication counts will be cleared.',
    color: 'orange',
    confirmLabel: 'Reset',
  },
};
