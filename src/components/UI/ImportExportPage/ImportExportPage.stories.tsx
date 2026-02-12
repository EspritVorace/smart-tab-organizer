import type { Meta, StoryObj } from '@storybook/react';
import { ImportExportPage } from './ImportExportPage';
import { defaultSyncSettings } from '../../../types/syncSettings';
import type { SyncSettings } from '../../../types/syncSettings';

const mockSyncSettingsWithRules: SyncSettings = {
  ...defaultSyncSettings,
  domainRules: [
    {
      id: 'rule-1',
      domainFilter: 'github.com',
      label: 'GitHub',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      groupNameSource: 'smart_label',
      deduplicationMatchMode: 'exact',
      color: 'purple',
      deduplicationEnabled: true,
      presetId: null,
      enabled: true,
    },
    {
      id: 'rule-2',
      domainFilter: 'gitlab.com',
      label: 'GitLab',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      groupNameSource: 'smart_label',
      deduplicationMatchMode: 'exact',
      color: 'orange',
      deduplicationEnabled: true,
      presetId: null,
      enabled: true,
    },
    {
      id: 'rule-3',
      domainFilter: '*.atlassian.net',
      label: 'Jira',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      groupNameSource: 'smart_label',
      deduplicationMatchMode: 'exact',
      color: 'blue',
      deduplicationEnabled: true,
      presetId: null,
      enabled: false,
    },
  ],
};

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

export const ImportExportPageWithRules: Story = {
  args: {
    syncSettings: mockSyncSettingsWithRules,
    onSettingsUpdate: (settings) => console.log('Settings updated:', settings),
  },
};
