import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from 'storybook/test';
import { ImportSessionsWizard } from './ImportSessionsWizard';

// Valid import payload: two new sessions (no existing sessions seeded).
const validImportJson = JSON.stringify({
  note: 'Exported on 2025-04-01',
  sessions: [
    {
      id: 'imported-session-1',
      name: 'Work tabs',
      createdAt: '2025-03-20T09:00:00.000Z',
      updatedAt: '2025-03-20T09:00:00.000Z',
      isPinned: false,
      groups: [
        {
          id: 'grp-1',
          title: 'Frontend',
          color: 'blue',
          tabs: [
            { id: 't1', title: 'React Docs', url: 'https://react.dev' },
          ],
        },
      ],
      ungroupedTabs: [
        { id: 't2', title: 'Figma', url: 'https://figma.com' },
      ],
    },
    {
      id: 'imported-session-2',
      name: 'Research',
      createdAt: '2025-03-21T09:00:00.000Z',
      updatedAt: '2025-03-21T09:00:00.000Z',
      isPinned: true,
      groups: [],
      ungroupedTabs: [
        { id: 't3', title: 'MDN', url: 'https://developer.mozilla.org' },
      ],
    },
  ],
});

const meta: Meta<typeof ImportSessionsWizard> = {
  title: 'Components/UI/ImportExportWizards/ImportSessionsWizard',
  component: ImportSessionsWizard,
  parameters: { layout: 'centered' },
  args: {
    onOpenChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ImportSessionsWizardOpen: Story = {
  args: { open: true },
};

export const ImportSessionsWizardClosed: Story = {
  args: { open: false },
};

// Pastes valid session JSON and advances to step 1.
export const ImportSessionsWizardStep1: Story = {
  args: { open: true },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);

    // Switch to Text mode
    const textTab = body.getAllByText('Text').find(el => el.closest('button'));
    if (textTab) await userEvent.click(textTab);

    // Paste valid session JSON
    const textarea = await body.findByPlaceholderText(/sessions/);
    await userEvent.click(textarea);
    await userEvent.paste(validImportJson);

    // Advance to step 1
    const nextBtn = body.getByText('Next').closest('button') as HTMLButtonElement;
    await expect(nextBtn).not.toBeDisabled();
    await userEvent.click(nextBtn);
  },
};
