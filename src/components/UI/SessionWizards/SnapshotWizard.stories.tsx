import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import { SnapshotWizard } from './SnapshotWizard';
import type { Session } from '@/types/session';

const meta: Meta<typeof SnapshotWizard> = {
  title: 'Components/UI/SessionWizards/SnapshotWizard',
  component: SnapshotWizard,
  parameters: { layout: 'centered' },
  args: {
    onOpenChange: () => {},
    onSave: async () => {},
    existingSessions: [],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SnapshotWizardOpen: Story = {
  args: { open: true },
};

export const SnapshotWizardClosed: Story = {
  args: { open: false },
};

// Types a custom session name.
export const SnapshotWizardFillName: Story = {
  args: { open: true },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const nameInput = await body.findByTestId<HTMLInputElement>('wizard-snapshot-field-name');
    // The wizard's open useEffect populates the name with "Snapshot {date}"
    // asynchronously: wait for that to land before clearing, otherwise the
    // effect runs after clear() and we end up appending to the seeded value.
    await waitFor(() => expect(nameInput.value.length).toBeGreaterThan(0));
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'My Work Session');
    await expect(nameInput).toHaveValue('My Work Session');
  },
};

// Fills both name and note fields.
export const SnapshotWizardFillNameAndNote: Story = {
  args: { open: true },
  play: async (context) => {
    await SnapshotWizardFillName.play?.(context);
    const body = within(context.canvasElement.ownerDocument.body);
    const noteField = body.getByTestId('wizard-snapshot-field-notes');
    await userEvent.click(noteField);
    await userEvent.type(noteField, 'Sprint 42 tabs');
    await expect(noteField).toHaveValue('Sprint 42 tabs');
  },
};

// Clicks Cancel to dismiss the wizard.
export const SnapshotWizardCancel: Story = {
  args: { open: true },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const cancelBtn = await body.findByTestId('wizard-snapshot-btn-cancel');
    await userEvent.click(cancelBtn);
  },
};

// Tries to save with a name that already exists in existingSessions.
export const SnapshotWizardDuplicateName: Story = {
  args: {
    open: true,
    existingSessions: [
      {
        id: 'existing',
        name: 'Work tabs',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        isPinned: false,
        categoryId: null,
        groups: [],
        ungroupedTabs: [],
      } satisfies Session,
    ],
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const nameInput = await body.findByTestId<HTMLInputElement>('wizard-snapshot-field-name');
    await waitFor(() => expect(nameInput.value.length).toBeGreaterThan(0));
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Work tabs');
    const saveBtn = body.getByTestId('wizard-snapshot-btn-save');
    await userEvent.click(saveBtn);
  },
};
