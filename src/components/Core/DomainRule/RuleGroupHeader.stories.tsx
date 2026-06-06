import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Theme } from '@radix-ui/themes';
import { RuleGroupHeader } from './RuleGroupHeader';
import type { RuleViewGroup } from '@/utils/ruleViewUtils';

const ruleIds = ['r1', 'r2', 'r3'];

const domainGroup: RuleViewGroup = {
  key: 'domain:github.com',
  kind: 'domain',
  label: 'github.com',
  ruleIds,
  rules: [],
  isDndEnabled: true,
};

const categoryGroup: RuleViewGroup = {
  key: 'category:development',
  kind: 'category',
  label: 'Development',
  emoji: '💻',
  ruleIds,
  rules: [],
  isDndEnabled: false,
};

const colorGroup: RuleViewGroup = {
  key: 'color:blue',
  kind: 'color',
  label: 'Blue',
  color: 'blue',
  ruleIds,
  rules: [],
  isDndEnabled: false,
};

const statusGroup: RuleViewGroup = {
  key: 'status:enabled',
  kind: 'status',
  label: 'Active',
  status: 'enabled',
  ruleIds,
  rules: [],
  isDndEnabled: false,
};

/** Wrapper holding selection state so the checkbox tri-state is interactive. */
function ControlledHeader({
  group,
  initialSelected = [],
}: {
  group: RuleViewGroup;
  initialSelected?: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  return (
    <RuleGroupHeader
      group={group}
      selectedCount={selected.size}
      onSelectGroup={(ids, checked) =>
        setSelected(() => (checked ? new Set(ids) : new Set()))
      }
    />
  );
}

const meta: Meta<typeof RuleGroupHeader> = {
  title: 'Components/Core/DomainRule/RuleGroupHeader',
  component: RuleGroupHeader,
  parameters: { layout: 'padded' },
  decorators: [
    Story => (
      <Theme>
        <Box style={{ maxWidth: 680, padding: 16 }}>
          <Story />
        </Box>
      </Theme>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const RuleGroupHeaderDomain: Story = {
  render: () => <ControlledHeader group={domainGroup} />,
};

export const RuleGroupHeaderCategory: Story = {
  render: () => <ControlledHeader group={categoryGroup} />,
};

export const RuleGroupHeaderColor: Story = {
  render: () => <ControlledHeader group={colorGroup} />,
};

export const RuleGroupHeaderStatus: Story = {
  render: () => <ControlledHeader group={statusGroup} />,
};

export const RuleGroupHeaderIndeterminate: Story = {
  render: () => <ControlledHeader group={domainGroup} initialSelected={['r1']} />,
};

export const RuleGroupHeaderAllSelected: Story = {
  render: () => <ControlledHeader group={domainGroup} initialSelected={ruleIds} />,
};
