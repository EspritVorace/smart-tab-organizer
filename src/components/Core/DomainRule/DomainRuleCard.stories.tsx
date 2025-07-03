import type { Meta, StoryObj } from '@storybook/react';
import { DomainRuleCard } from './DomainRuleCard';
import type { DomainRuleSetting } from '../../../types/syncSettings';
import type { LogicalGroup } from '../../../schemas/logicalGroup';

const meta = {
  title: 'Components/Core/DomainRule/DomainRuleCard',
  component: DomainRuleCard,
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'responsive',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', minWidth: '600px', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof DomainRuleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockRule: DomainRuleSetting = {
  id: '1',
  domainFilter: 'github.com',
  label: 'GitHub Issues',
  titleParsingRegEx: '([A-Z]+-\\d+)',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  groupId: 'group1',
  deduplicationEnabled: true,
  enabled: true
};

const mockGroups: LogicalGroup[] = [
  { id: 'group1', label: 'Development', color: 'blue' },
  { id: 'group2', label: 'Testing', color: 'green' },
  { id: 'group3', label: 'Documentation', color: 'purple' }
];

export const DomainRuleCardDefault: Story = {
  args: {
    rule: mockRule,
    availableGroups: mockGroups,
    onEnabledChanged: (enabled: boolean) => console.log('Enabled changed:', enabled),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onCopy: () => console.log('Copy clicked'),
    onPaste: () => console.log('Paste clicked'),
    onChangeGroup: (ruleId: string, groupId: string | null) => console.log('Change group:', ruleId, groupId),
    isPasteAvailable: true
  }
};

export const DomainRuleCardDisabled: Story = {
  args: {
    ...DomainRuleCardDefault.args,
    rule: { ...mockRule, enabled: false }
  }
};

export const DomainRuleCardDeduplicationDisabled: Story = {
  args: {
    ...DomainRuleCardDefault.args,
    rule: { ...mockRule, deduplicationEnabled: false }
  }
};

export const DomainRuleCardPasteNotAvailable: Story = {
  args: {
    ...DomainRuleCardDefault.args,
    isPasteAvailable: false
  }
};

export const DomainRuleCardUrlGroupingSource: Story = {
  args: {
    ...DomainRuleCardDefault.args,
    rule: {
      ...mockRule,
      label: 'Jira Tasks',
      domainFilter: 'company.atlassian.net',
      groupNameSource: 'url',
      titleParsingRegEx: '',
      urlParsingRegEx: '/browse/([A-Z]+-\\d+)'
    }
  }
};

export const DomainRuleCardManualGroupingSource: Story = {
  args: {
    ...DomainRuleCardDefault.args,
    rule: {
      ...mockRule,
      label: 'Manual Grouping',
      groupNameSource: 'manual',
      titleParsingRegEx: '',
      urlParsingRegEx: ''
    }
  }
};

export const DomainRuleCardNoGroup: Story = {
  args: {
    ...DomainRuleCardDefault.args,
    rule: { ...mockRule, groupId: null }
  }
};

export const DomainRuleCardWithBadge: Story = {
  args: {
    ...DomainRuleCardDefault.args,
    badge: {
      text: 'New',
      color: 'green'
    }
  }
};

export const DomainRuleCardWithWarningBadge: Story = {
  args: {
    ...DomainRuleCardDefault.args,
    badge: {
      text: 'Deprecated',
      color: 'orange'
    }
  }
};

export const DomainRuleCardWithErrorBadge: Story = {
  args: {
    ...DomainRuleCardDefault.args,
    badge: {
      text: 'Error',
      color: 'red'
    }
  }
};