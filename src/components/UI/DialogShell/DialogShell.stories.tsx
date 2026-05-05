import type { Meta, StoryObj } from '@storybook/react';
import { within, expect, waitFor } from 'storybook/test';
import { useState } from 'react';
import { Button, Flex, Text, TextField, Theme } from '@radix-ui/themes';
import { FolderOpen } from 'lucide-react';
import { DialogShell } from './DialogShell';

const meta: Meta<typeof DialogShell> = {
  title: 'Components/UI/DialogShell/DialogShell',
  component: DialogShell,
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
};

export default meta;
type Story = StoryObj<typeof meta>;

function WithAutofocusDemo() {
  const [open, setOpen] = useState(true);
  return (
    <DialogShell
      open={open}
      onOpenChange={setOpen}
      icon={FolderOpen}
      title="Create workspace"
      description="Enter a name for your new workspace."
    >
      <Flex direction="column" gap="3" mt="3">
        <TextField.Root
          id="demo-name-input"
          data-testid="demo-name-input"
          data-autofocus="true"
          placeholder="Workspace name"
        />
        <Flex gap="2" justify="end">
          <Button variant="soft" color="gray" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Create</Button>
        </Flex>
      </Flex>
    </DialogShell>
  );
}

function WithoutAutofocusDemo() {
  const [open, setOpen] = useState(true);
  return (
    <DialogShell
      open={open}
      onOpenChange={setOpen}
      icon={FolderOpen}
      title="About this extension"
      description="Informational dialog with no interactive form field."
    >
      <Flex direction="column" gap="3" mt="3">
        <Text size="2">
          This dialog has no data-autofocus element. Focus should land on the dialog title.
        </Text>
        <Flex gap="2" justify="end">
          <Button variant="soft" color="gray" onClick={() => setOpen(false)}>
            Close
          </Button>
        </Flex>
      </Flex>
    </DialogShell>
  );
}

// Focus lands on the [data-autofocus] input when one is present.
export const DialogShellWithAutofocus: Story = {
  render: () => <WithAutofocusDemo />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = await body.findByTestId('demo-name-input');
    await waitFor(() => expect(input).toHaveFocus());
  },
};

// Focus falls back to the dialog title when no [data-autofocus] is present.
export const DialogShellWithoutAutofocus: Story = {
  render: () => <WithoutAutofocusDemo />,
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    await waitFor(() => {
      const active = doc.activeElement;
      expect(active?.getAttribute('data-dialog-title')).not.toBeNull();
    });
  },
};
