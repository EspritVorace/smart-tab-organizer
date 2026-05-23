import type { Meta, StoryObj } from '@storybook/react';
import { RuleDetailPopover } from './RuleDetailPopover';
import type { DomainRuleSetting } from '@/types/syncSettings';

const baseRule: DomainRuleSetting = {
  id: 'rule-1',
  domainFilter: 'github.com',
  label: 'GitHub',
  titleParsingRegEx: '(.+)',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  color: 'purple',
  deduplicationEnabled: true,
  ignoredQueryParams: [],
  presetId: null,
  urlExtractionMode: 'regex',
  enabled: true,
  badge: undefined,
  categoryId: undefined,
};

const meta: Meta<typeof RuleDetailPopover> = {
  title: 'Components/Core/DomainRule/RuleDetailPopover',
  component: RuleDetailPopover,
  parameters: { layout: 'centered' },
  args: { searchTerm: '' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const RuleDetailPopoverEnabled: Story = {
  args: { rule: baseRule },
};

export const RuleDetailPopoverDisabled: Story = {
  args: { rule: { ...baseRule, enabled: false } },
};

export const RuleDetailPopoverWithPreset: Story = {
  args: {
    rule: {
      ...baseRule,
      presetId: 'github-repo',
      groupNameSource: 'smart_preset',
    },
  },
};

export const RuleDetailPopoverDeduplicationDisabled: Story = {
  args: {
    rule: { ...baseRule, deduplicationEnabled: false },
  },
};

export const RuleDetailPopoverWithSearchHighlight: Story = {
  args: { rule: baseRule, searchTerm: 'Git' },
};

export const RuleDetailPopoverUrlMode: Story = {
  args: {
    rule: {
      ...baseRule,
      groupNameSource: 'url',
      urlParsingRegEx: '/([^/]+)',
    },
  },
};

export const RuleDetailPopoverManualMode: Story = {
  args: {
    rule: {
      ...baseRule,
      groupNameSource: 'manual',
      titleParsingRegEx: '',
    },
  },
};

export const RuleDetailPopoverWithTimestampsCreatedOnly: Story = {
  args: {
    rule: {
      ...baseRule,
      createdAt: '2025-06-01T10:00:00.000Z',
      updatedAt: '2025-06-01T10:00:00.000Z',
    },
  },
};

export const RuleDetailPopoverWithTimestampsModified: Story = {
  args: {
    rule: {
      ...baseRule,
      createdAt: '2025-06-01T10:00:00.000Z',
      updatedAt: '2025-06-15T14:30:00.000Z',
    },
  },
};
