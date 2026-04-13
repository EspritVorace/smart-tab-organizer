import type { Meta, StoryObj } from '@storybook/react';
import { ExportSessionsWizard } from './ExportSessionsWizard';

const meta: Meta<typeof ExportSessionsWizard> = {
  title: 'Components/UI/ImportExportWizards/ExportSessionsWizard',
  component: ExportSessionsWizard,
  parameters: { layout: 'centered' },
  args: {
    onOpenChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ExportSessionsWizardOpen: Story = {
  args: { open: true },
};

export const ExportSessionsWizardClosed: Story = {
  args: { open: false },
};
