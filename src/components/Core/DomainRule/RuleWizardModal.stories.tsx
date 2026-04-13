import type { Meta, StoryObj } from '@storybook/react';
import { RuleWizardModal } from './RuleWizardModal';
const action = (name: string) => (...args: any[]) => console.log(name, ...args);
import type { DomainRule } from '../../../schemas/domainRule';
import type { SyncSettings } from '../../../types/syncSettings';

const mockSyncSettings: SyncSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  notifyOnGrouping: true,
  notifyOnDeduplication: true,
  domainRules: [
    {
      id: 'existing-rule-1',
      domainFilter: 'existing.com',
      label: 'Existing Rule',
      titleParsingRegEx: '(.+)',
      urlParsingRegEx: '',
      groupNameSource: 'title',
      deduplicationMatchMode: 'exact',
      color: 'grey',
      deduplicationEnabled: true,
      presetId: null,
      enabled: true
    }
  ]
};

const mockDomainRule: DomainRule = {
  id: 'rule-1',
  domainFilter: 'github.com',
  label: 'GitHub',
  titleParsingRegEx: '(.+)',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  color: 'purple',
  deduplicationEnabled: true,
  presetId: null
};

const meta: Meta<typeof RuleWizardModal> = {
  title: 'Components/Core/DomainRule/RuleWizardModal',
  component: RuleWizardModal,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
    },
    domainRule: {
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

// === CRÉATION (wizard 4 étapes) ===

export const RuleWizardModalCreate: Story = {
  args: {
    isOpen: true,
    domainRule: undefined,
  },
};

// === ÉDITION (vue résumé) ===

export const RuleWizardModalEdit: Story = {
  args: {
    isOpen: true,
    domainRule: mockDomainRule,
  },
};

export const RuleWizardModalEditManual: Story = {
  args: {
    isOpen: true,
    domainRule: {
      ...mockDomainRule,
      groupNameSource: 'title',
      titleParsingRegEx: '\\[([A-Z]+-\\d+)\\]',
      urlParsingRegEx: '',
      presetId: null,
    },
  },
};

export const RuleWizardModalEditAsk: Story = {
  args: {
    isOpen: true,
    domainRule: {
      ...mockDomainRule,
      groupNameSource: 'manual',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      presetId: null,
    },
  },
};

export const RuleWizardModalEditDeduplicationDisabled: Story = {
  args: {
    isOpen: true,
    domainRule: {
      ...mockDomainRule,
      deduplicationEnabled: false,
    },
  },
};

// === CAS LIMITES ===

export const RuleWizardModalClosed: Story = {
  args: {
    isOpen: false,
    domainRule: undefined,
  },
};

export const RuleWizardModalLabelUniqueness: Story = {
  args: {
    isOpen: true,
    domainRule: undefined,
    syncSettings: {
      ...mockSyncSettings,
      domainRules: [
        ...mockSyncSettings.domainRules,
        {
          id: 'test-rule',
          domainFilter: 'test.com',
          label: 'Test Label',
          titleParsingRegEx: '(.+)',
          urlParsingRegEx: '',
          groupNameSource: 'title',
          deduplicationMatchMode: 'exact',
          color: 'grey',
          deduplicationEnabled: true,
          presetId: null,
          enabled: true
        }
      ]
    },
  },
};
