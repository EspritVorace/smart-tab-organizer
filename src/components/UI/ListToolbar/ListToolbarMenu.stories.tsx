import type { Meta, StoryObj } from '@storybook/react';
import { Download, Upload } from 'lucide-react';
import { ListToolbarMenu } from './ListToolbarMenu';

const meta = {
  title: 'Components/UI/ListToolbar/ListToolbarMenu',
  component: ListToolbarMenu,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ListToolbarMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ListToolbarMenuExportImport: Story = {
  args: {
    testId: 'page-rules-toolbar-menu',
    items: [
      {
        key: 'export',
        testId: 'page-rules-toolbar-menu-export',
        icon: Download,
        label: 'Export rules',
        onSelect: () => {},
      },
      {
        key: 'import',
        testId: 'page-rules-toolbar-menu-import',
        icon: Upload,
        label: 'Import rules',
        onSelect: () => {},
      },
    ],
  },
};

export const ListToolbarMenuImportOnly: Story = {
  args: {
    testId: 'page-workspaces-toolbar-menu',
    items: [
      {
        key: 'import',
        testId: 'page-workspaces-toolbar-menu-import',
        icon: Upload,
        label: 'Import workspace',
        onSelect: () => {},
      },
    ],
  },
};
