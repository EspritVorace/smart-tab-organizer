import type { Meta, StoryObj } from '@storybook/react';
import { Download, Upload } from 'lucide-react';
import { ImportExportActionCard } from './ImportExportActionCard';

const meta: Meta<typeof ImportExportActionCard> = {
  title: 'Components/UI/ImportExportWizards/ImportExportActionCard',
  component: ImportExportActionCard,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ImportExportActionCardExport: Story = {
  args: {
    testId: 'action-card-export',
    icon: Download,
    title: 'Export Rules',
    description: 'Export your domain rules to a JSON file.',
    buttonLabel: 'Export',
    onClick: () => {},
  },
};

export const ImportExportActionCardImport: Story = {
  args: {
    testId: 'action-card-import',
    icon: Upload,
    title: 'Import Rules',
    description: 'Import domain rules from a JSON file.',
    buttonLabel: 'Import',
    onClick: () => {},
  },
};

export const ImportExportActionCardDisabled: Story = {
  args: {
    testId: 'action-card-disabled',
    icon: Download,
    title: 'Export Rules',
    description: 'No rules to export yet.',
    buttonLabel: 'Export',
    onClick: () => {},
    disabled: true,
  },
};
