import type { Meta, StoryObj } from '@storybook/react';
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
