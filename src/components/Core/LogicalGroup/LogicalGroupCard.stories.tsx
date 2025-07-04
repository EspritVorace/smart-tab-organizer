import type { Meta, StoryObj } from '@storybook/react';
import { LogicalGroupCard } from './LogicalGroupCard';
import type { LogicalGroupSetting, DomainRuleSetting } from '../../../types/syncSettings';

const meta = {
  title: 'Components/Core/LogicalGroup/LogicalGroupCard',
  component: LogicalGroupCard,
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
} satisfies Meta<typeof LogicalGroupCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockGroup: LogicalGroupSetting = {
  id: '1',
  label: 'Development',
  color: 'blue',
  enabled: true
};

const mockAvailableGroups: LogicalGroupSetting[] = [
  { id: '1', label: 'Development', color: 'blue', enabled: true },
  { id: '2', label: 'Testing', color: 'green', enabled: true },
  { id: '3', label: 'Documentation', color: 'purple', enabled: true }
];

const mockDomainRules: DomainRuleSetting[] = [
  {
    id: 'rule1',
    domainFilter: 'github.com',
    label: 'GitHub Issues',
    titleParsingRegEx: '([A-Z]+-\\d+)',
    urlParsingRegEx: '',
    groupNameSource: 'title',
    deduplicationMatchMode: 'exact',
    groupId: '1',
    deduplicationEnabled: true,
    enabled: true
  },
  {
    id: 'rule2',
    domainFilter: 'stackoverflow.com',
    label: 'Stack Overflow',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'manual',
    deduplicationMatchMode: 'exact',
    groupId: '1',
    deduplicationEnabled: false,
    enabled: true
  }
];

export const LogicalGroupCardDefault: Story = {
  args: {
    group: mockGroup,
    onEnabledChanged: (enabled: boolean) => console.log('Enabled changed:', enabled),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked')
  }
};

export const LogicalGroupCardWithDomainRules: Story = {
  args: {
    group: mockGroup,
    domainRulesList: mockDomainRules,
    availableGroups: mockAvailableGroups,
    onEnabledChanged: (enabled: boolean) => console.log('Enabled changed:', enabled),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onDomainRuleEnabledChanged: (ruleId: string, enabled: boolean) => console.log('Domain rule enabled changed:', ruleId, enabled),
    onDomainRuleEdit: (ruleId: string) => console.log('Domain rule edit:', ruleId),
    onDomainRuleDelete: (ruleId: string) => console.log('Domain rule delete:', ruleId),
    onDomainRuleCopy: (ruleId: string) => console.log('Domain rule copy:', ruleId),
    onDomainRulePaste: (ruleId: string) => console.log('Domain rule paste:', ruleId),
    onDomainRuleChangeGroup: (ruleId: string, groupId: string | null) => console.log('Domain rule change group:', ruleId, groupId),
    isDomainRulePasteAvailable: true
  }
};

export const LogicalGroupCardDisabled: Story = {
  args: {
    ...LogicalGroupCardDefault.args,
    group: { ...mockGroup, enabled: false }
  }
};

export const LogicalGroupCardEmpty: Story = {
  args: {
    ...LogicalGroupCardDefault.args,
    group: {
      ...mockGroup,
      label: 'Empty Group'
    },
    domainRulesList: []
  }
};

export const LogicalGroupCardRedColor: Story = {
  args: {
    ...LogicalGroupCardDefault.args,
    group: {
      ...mockGroup,
      label: 'Critical Issues',
      color: 'red'
    }
  }
};

export const LogicalGroupCardGreenColor: Story = {
  args: {
    ...LogicalGroupCardDefault.args,
    group: {
      ...mockGroup,
      label: 'Testing',
      color: 'green'
    }
  }
};

export const LogicalGroupCardPurpleColor: Story = {
  args: {
    ...LogicalGroupCardDefault.args,
    group: {
      ...mockGroup,
      label: 'Documentation',
      color: 'purple'
    }
  }
};

export const LogicalGroupCardYellowColor: Story = {
  args: {
    ...LogicalGroupCardDefault.args,
    group: {
      ...mockGroup,
      label: 'Pending Review',
      color: 'yellow'
    }
  }
};

export const LogicalGroupCardOrangeColor: Story = {
  args: {
    ...LogicalGroupCardDefault.args,
    group: {
      ...mockGroup,
      label: 'In Progress',
      color: 'orange'
    }
  }
};

export const LogicalGroupCardCyanColor: Story = {
  args: {
    ...LogicalGroupCardDefault.args,
    group: {
      ...mockGroup,
      label: 'Research',
      color: 'cyan'
    }
  }
};

export const LogicalGroupCardPinkColor: Story = {
  args: {
    ...LogicalGroupCardDefault.args,
    group: {
      ...mockGroup,
      label: 'Design',
      color: 'pink'
    }
  }
};

export const LogicalGroupCardGreyColor: Story = {
  args: {
    ...LogicalGroupCardDefault.args,
    group: {
      ...mockGroup,
      label: 'Archived',
      color: 'grey'
    }
  }
};

export const LogicalGroupCardWithBadge: Story = {
  args: {
    ...LogicalGroupCardDefault.args,
    badge: {
      text: 'New',
      color: 'green'
    }
  }
};

export const LogicalGroupCardWithWarningBadge: Story = {
  args: {
    ...LogicalGroupCardDefault.args,
    badge: {
      text: 'Deprecated',
      color: 'orange'
    }
  }
};

export const LogicalGroupCardWithErrorBadge: Story = {
  args: {
    ...LogicalGroupCardDefault.args,
    badge: {
      text: 'Error',
      color: 'red'
    }
  }
};

export const LogicalGroupCardLongLabel: Story = {
  args: {
    ...LogicalGroupCardDefault.args,
    group: {
      ...mockGroup,
      label: 'Very Long Logical Group Name That Should Be Handled Properly'
    }
  }
};