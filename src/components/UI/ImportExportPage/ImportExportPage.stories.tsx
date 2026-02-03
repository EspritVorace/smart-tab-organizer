import type { Meta, StoryObj } from '@storybook/react';
import { ImportExportPage } from './ImportExportPage';
import { defaultSyncSettings } from '../../../types/syncSettings';

const meta: Meta<typeof ImportExportPage> = {
  title: 'Components/UI/ImportExportPage/ImportExportPage',
  component: ImportExportPage,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onSettingsUpdate: { action: 'settings updated' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ImportExportPageDefault: Story = {
  args: {
    syncSettings: defaultSyncSettings,
    onSettingsUpdate: (settings) => console.log('Settings updated:', settings),
  },
};