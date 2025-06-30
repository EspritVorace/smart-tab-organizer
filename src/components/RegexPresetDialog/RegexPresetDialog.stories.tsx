import type { Meta, StoryObj } from '@storybook/react';
import { RegexPresetDialog } from './RegexPresetDialog';
const action = (name: string) => (...args: any[]) => console.log(name, ...args);
import type { RegexPreset } from '../../schemas/regexPreset';
import type { SyncSettings } from '../../types/syncSettings';

const mockSyncSettings: SyncSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  darkModePreference: 'system',
  logicalGroups: [],
  regexPresets: [
    {
      id: 'existing-preset-1',
      name: 'Existing Preset',
      titleParsingRegEx: '([A-Z]+-\\d+)',
      urlParsingRegEx: '/browse/([A-Z]+-\\d+)'
    },
    {
      id: 'existing-preset-2',
      name: 'Another Preset',
      titleParsingRegEx: '(.+)',
      urlParsingRegEx: ''
    }
  ],
  domainRules: []
};

const mockRegexPreset: RegexPreset = {
  id: 'preset-1',
  name: 'Jira Issue',
  titleParsingRegEx: '\\[([A-Z]+-\\d+)\\]',
  urlParsingRegEx: '/browse/([A-Z]+-\\d+)'
};

const meta: Meta<typeof RegexPresetDialog> = {
  title: 'Components/RegexPresetDialog',
  component: RegexPresetDialog,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
    },
    regexPreset: {
      control: 'object',
    },
  },
  args: {
    onClose: action('onClose'),
    onSubmit: action('onSubmit'),
    syncSettings: mockSyncSettings,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// === CRÉATION ET ÉDITION ===

export const RegexPresetDialogCreate: Story = {
  args: {
    isOpen: true,
    regexPreset: undefined,
  },
};

export const RegexPresetDialogEdit: Story = {
  args: {
    isOpen: true,
    regexPreset: mockRegexPreset,
  },
};

// === EXEMPLES DE REGEX ===

export const RegexPresetDialogWithUrlRegex: Story = {
  args: {
    isOpen: true,
    regexPreset: {
      id: 'preset-2',
      name: 'Jira Ticket',
      titleParsingRegEx: '\\[([A-Z]+-\\d+)\\]',
      urlParsingRegEx: '/browse/([A-Z]+-\\d+)'
    },
  },
};

export const RegexPresetDialogOnlyTitleRegex: Story = {
  args: {
    isOpen: true,
    regexPreset: {
      id: 'preset-3',
      name: 'GitHub Issue',
      titleParsingRegEx: '(.+) · Issue #(\\d+)',
      urlParsingRegEx: ''
    },
  },
};

// === CAS LIMITES ===

export const RegexPresetDialogClosed: Story = {
  args: {
    isOpen: false,
    regexPreset: undefined,
  },
};