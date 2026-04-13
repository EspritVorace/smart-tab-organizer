import type { Meta, StoryObj } from '@storybook/react';
import { ImportSessionsWizard } from './ImportSessionsWizard';

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
