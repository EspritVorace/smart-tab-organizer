import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import { SnapshotWizard } from './SnapshotWizard';
import type { Session } from '@/types/session';

interface FakeTab {
  id: number;
  index: number;
  url: string;
  title: string;
  groupId?: number;
}
interface FakeGroup {
  title: string;
  color: string;
  collapsed?: boolean;
}

/**
 * Patch the storybook browser mock with synthetic tabs/tabGroups so the
 * wizard's `captureCurrentTabs()` resolves with deterministic data.
 * Mutates the shared singleton; subsequent stories that need a different
 * snapshot must redefine the mock through their own decorator.
 */
function patchTabsMock(tabs: FakeTab[], groups: Record<number, FakeGroup>): void {
  const slot = globalThis as typeof globalThis & {
    browser?: Record<string, unknown>;
  };
  const browser = (slot.browser ?? {}) as Record<string, unknown>;
  browser.tabs = { query: async () => tabs };
  browser.tabGroups = {
    get: async (id: number) => {
      const group = groups[id];
      if (!group) throw new Error(`Group ${id} not found`);
      return group;
    },
  };
  slot.browser = browser;
}

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

// Window contains a group + an ungrouped tab. Pre-selecting only the group
// triggers the partial selection callout at the top of the wizard body.
export const SnapshotWizardWithGroupCallout: Story = {
  args: { open: true, initialGroupId: 42 },
  decorators: [
    (Story) => {
      patchTabsMock(
        [
          { id: 1, index: 0, url: 'https://example.com/a', title: 'Group tab A', groupId: 42 },
          { id: 2, index: 1, url: 'https://example.com/b', title: 'Group tab B', groupId: 42 },
          { id: 3, index: 2, url: 'https://example.org', title: 'Ungrouped tab' },
        ],
        { 42: { title: 'Active group', color: 'green', collapsed: false } },
      );
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() =>
      expect(body.getByTestId('wizard-snapshot-group-callout')).toBeVisible(),
    );
  },
};

// Window contains only the active group: pre-selection covers everything,
// so the callout must NOT be displayed.
export const SnapshotWizardSingleGroupNoCallout: Story = {
  args: { open: true, initialGroupId: 7 },
  decorators: [
    (Story) => {
      patchTabsMock(
        [
          { id: 10, index: 0, url: 'https://example.com/x', title: 'Solo group tab', groupId: 7 },
        ],
        { 7: { title: 'Solo group', color: 'orange', collapsed: false } },
      );
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    // Wait for capture to land (name input populated with group title)
    const nameInput = await body.findByTestId<HTMLInputElement>('wizard-snapshot-field-name');
    await waitFor(() => expect(nameInput.value).toBe('Solo group'));
    expect(body.queryByTestId('wizard-snapshot-group-callout')).toBeNull();
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
