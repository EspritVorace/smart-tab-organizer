import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from 'storybook/test';
import { ImportWizard } from './ImportWizard';
import type { DomainRuleSetting } from '../../../types/syncSettings';

const existingRules: DomainRuleSetting[] = [
  {
    id: 'existing-1',
    domainFilter: 'github.com',
    label: 'GitHub',
    titleParsingRegEx: '(.+)',
    urlParsingRegEx: '',
    groupNameSource: 'title',
    deduplicationMatchMode: 'exact',
    color: 'purple',
    deduplicationEnabled: true,
    presetId: null,
    enabled: true,
  },
];

// Valid import payload: one new rule, one rule that conflicts with "GitHub"
// (same label, different color), and one identical rule.
const validImportJson = JSON.stringify({
  note: 'Imported from other browser',
  domainRules: [
    {
      id: 'imported-1',
      domainFilter: 'gitlab.com',
      label: 'GitLab',
      titleParsingRegEx: '(.+)',
      urlParsingRegEx: '',
      groupNameSource: 'title',
      deduplicationMatchMode: 'exact',
      color: 'orange',
      deduplicationEnabled: true,
      presetId: null,
      enabled: true,
    },
    {
      id: 'imported-2',
      domainFilter: 'github.com',
      label: 'GitHub',
      titleParsingRegEx: '(.+)',
      urlParsingRegEx: '',
      groupNameSource: 'title',
      deduplicationMatchMode: 'exact',
      color: 'blue',
      deduplicationEnabled: true,
      presetId: null,
      enabled: true,
    },
  ],
});

const meta: Meta<typeof ImportWizard> = {
  title: 'Components/UI/ImportExportWizards/ImportWizard',
  component: ImportWizard,
  parameters: { layout: 'centered' },
  args: {
    onOpenChange: () => {},
    onImport: () => {},
    existingRules,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ImportWizardOpen: Story = {
  args: { open: true },
};

export const ImportWizardClosed: Story = {
  args: { open: false },
};

// Pastes valid JSON in Text mode and advances to step 1 (classification).
export const ImportWizardStep1Classification: Story = {
  args: { open: true },
  play: async ({ canvasElement }) => {
    // Radix Dialog is rendered in a portal (outside canvasElement), so we scope
    // queries to the whole document.
    const body = within(canvasElement.ownerDocument.body);

    // Switch to Text source mode
    const textTab = body.getAllByText('Text').find(el => el.closest('button'));
    if (textTab) await userEvent.click(textTab);

    // Paste valid JSON
    const textarea = await body.findByPlaceholderText('{"domainRules": [...]}');
    await userEvent.click(textarea);
    await userEvent.paste(validImportJson);

    // Advance to step 1
    const nextBtn = body.getByText('Next').closest('button') as HTMLButtonElement;
    await expect(nextBtn).not.toBeDisabled();
    await userEvent.click(nextBtn);
  },
};

// Goes through step 1 and changes the conflict-resolution mode to "duplicate".
export const ImportWizardConflictDuplicate: Story = {
  args: { open: true },
  play: async (context) => {
    await ImportWizardStep1Classification.play?.(context);
    const body = within(context.canvasElement.ownerDocument.body);
    // Click the "Duplicate" segmented control option
    const dupOption = body.getAllByText(/Duplicate/i).find(el => el.closest('button'));
    if (dupOption) await userEvent.click(dupOption);
  },
};
