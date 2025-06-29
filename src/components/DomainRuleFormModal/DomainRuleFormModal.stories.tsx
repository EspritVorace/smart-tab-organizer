import type { Meta, StoryObj } from '@storybook/react';
import { DomainRuleFormModal } from './DomainRuleFormModal';
const action = (name: string) => (...args: any[]) => console.log(name, ...args);
import type { DomainRule } from '../../schemas/domainRule';
import type { LogicalGroup } from '../../schemas/logicalGroup';
import type { RegexPreset } from '../../schemas/regexPreset';

const mockAvailableGroups: LogicalGroup[] = [
  {
    id: 'group-1',
    label: 'Travail',
    color: 'blue'
  },
  {
    id: 'group-2', 
    label: 'Personnel',
    color: 'green'
  },
  {
    id: 'group-3',
    label: 'Développement',
    color: 'purple'
  }
];

const mockAvailablePresets: RegexPreset[] = [
  {
    id: 'preset-1',
    name: 'Jira Issue',
    regex: '\\[([A-Z]+-\\d+)\\]',
    urlRegex: ''
  },
  {
    id: 'preset-2',
    name: 'GitHub Repo',
    regex: '(.+)',
    urlRegex: '/([^/]+/[^/]+)'
  },
  {
    id: 'preset-3',
    name: 'YouTube Video',
    regex: '(.+) - YouTube',
    urlRegex: ''
  }
];

const mockDomainRule: DomainRule = {
  id: 'rule-1',
  domainFilter: 'github.com',
  label: 'GitHub',
  titleParsingRegEx: '(.+)',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  groupId: 'group-3',
  deduplicationEnabled: true,
  presetId: null
};

const meta: Meta<typeof DomainRuleFormModal> = {
  title: 'Components/DomainRuleFormModal',
  component: DomainRuleFormModal,
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
    availableGroups: mockAvailableGroups,
    availablePresets: mockAvailablePresets,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// === CRÉATION ET ÉDITION ===

export const DomainRuleFormModalCreate: Story = {
  args: {
    isOpen: true,
    domainRule: undefined,
  },
};

export const DomainRuleFormModalEdit: Story = {
  args: {
    isOpen: true,
    domainRule: mockDomainRule,
  },
};

// === SOURCES DE GROUPEMENT ===

export const DomainRuleFormModalManualGrouping: Story = {
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

export const DomainRuleFormModalTitleGroupingNoPreset: Story = {
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

export const DomainRuleFormModalTitleGroupingWithPreset: Story = {
  args: {
    isOpen: true,
    domainRule: {
      ...mockDomainRule,
      groupNameSource: 'title',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      presetId: 'preset-1',
    },
  },
};

export const DomainRuleFormModalUrlGroupingNoPreset: Story = {
  args: {
    isOpen: true,
    domainRule: {
      ...mockDomainRule,
      groupNameSource: 'url',
      titleParsingRegEx: '',
      urlParsingRegEx: '/projects/([^/]+)',
      presetId: null,
    },
  },
};

export const DomainRuleFormModalUrlGroupingWithPreset: Story = {
  args: {
    isOpen: true,
    domainRule: {
      ...mockDomainRule,
      groupNameSource: 'url',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      presetId: 'preset-2',
    },
  },
};

// === DÉDUPLICATION ===

export const DomainRuleFormModalDeduplicationDisabled: Story = {
  args: {
    isOpen: true,
    domainRule: {
      ...mockDomainRule,
      deduplicationEnabled: false,
      deduplicationMatchMode: 'exact',
    },
  },
};

export const DomainRuleFormModalDeduplicationEnabled: Story = {
  args: {
    isOpen: true,
    domainRule: {
      ...mockDomainRule,
      deduplicationEnabled: true,
      deduplicationMatchMode: 'hostname_path',
    },
  },
};

// === CAS LIMITES ===

export const DomainRuleFormModalNoGroups: Story = {
  args: {
    isOpen: true,
    domainRule: undefined,
    availableGroups: [],
  },
};

export const DomainRuleFormModalNoPresets: Story = {
  args: {
    isOpen: true,
    domainRule: undefined,
    availablePresets: [],
  },
};

export const DomainRuleFormModalClosed: Story = {
  args: {
    isOpen: false,
    domainRule: undefined,
  },
};