import type { Meta, StoryObj } from '@storybook/react';
import { ImportExportPage } from './ImportExportPage';
import { MockImportExportWizardsProvider } from '@/test-utils/MockImportExportWizardsProvider';
import { defaultAppSettings } from '@/types/syncSettings';
import type { AppSettings } from '@/types/syncSettings';

const mockSyncSettingsWithRules: AppSettings = {
  ...defaultAppSettings,
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
      ignoredQueryParams: [],
      presetId: null,
      urlExtractionMode: 'regex',
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
      ignoredQueryParams: [],
      presetId: null,
      urlExtractionMode: 'regex',
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
      ignoredQueryParams: [],
      presetId: null,
      urlExtractionMode: 'regex',
      enabled: false,
    },
  ],
};

const meta: Meta<typeof ImportExportPage> = {
  title: 'Pages/ImportExportPage',
  component: ImportExportPage,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MockImportExportWizardsProvider>
        <Story />
      </MockImportExportWizardsProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ImportExportPageDefault: Story = {
  args: {
    syncSettings: defaultAppSettings,
  },
};

export const ImportExportPageWithRules: Story = {
  args: {
    syncSettings: mockSyncSettingsWithRules,
  },
};
