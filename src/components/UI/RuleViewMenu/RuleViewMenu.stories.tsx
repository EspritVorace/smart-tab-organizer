import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Flex, Theme } from '@radix-ui/themes';
import { RuleViewMenu } from './RuleViewMenu';
import { DEFAULT_RULE_VIEW_STATE, type RuleViewState } from '@/utils/ruleViewUtils';

/** Controlled wrapper so the menu reflects and persists its own state in the story. */
function ControlledMenu({ initial }: { initial?: Partial<RuleViewState> }) {
  const [value, setValue] = useState<RuleViewState>({ ...DEFAULT_RULE_VIEW_STATE, ...initial });
  return (
    <Flex justify="end">
      <RuleViewMenu value={value} onChange={setValue} testId="rule-view-menu" />
    </Flex>
  );
}

const meta: Meta<typeof RuleViewMenu> = {
  title: 'Components/UI/RuleViewMenu',
  component: RuleViewMenu,
  parameters: { layout: 'padded' },
  decorators: [
    Story => (
      <Theme>
        <Box style={{ padding: 16, minHeight: 360 }}>
          <Story />
        </Box>
      </Theme>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const RuleViewMenuDefault: Story = {
  render: () => <ControlledMenu />,
};

export const RuleViewMenuActiveFilter: Story = {
  render: () => (
    <ControlledMenu initial={{ filterColors: ['blue', 'red'], filterCategories: ['development'] }} />
  ),
};

export const RuleViewMenuSortDateDesc: Story = {
  render: () => <ControlledMenu initial={{ sort: 'date', sortDirection: 'desc' }} />,
};

export const RuleViewMenuSortDomain: Story = {
  render: () => <ControlledMenu initial={{ sort: 'domain' }} />,
};

export const RuleViewMenuGroupCategory: Story = {
  render: () => <ControlledMenu initial={{ group: 'category' }} />,
};
