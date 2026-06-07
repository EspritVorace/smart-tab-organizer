import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Flex, Theme } from '@radix-ui/themes';
import { SessionViewMenu } from './SessionViewMenu';
import { DEFAULT_SESSION_VIEW_STATE, type SessionViewState } from '@/utils/sessionViewUtils';

/** Controlled wrapper so the menu reflects and persists its own state in the story. */
function ControlledMenu({ initial }: { initial?: Partial<SessionViewState> }) {
  const [value, setValue] = useState<SessionViewState>({ ...DEFAULT_SESSION_VIEW_STATE, ...initial });
  return (
    <Flex justify="end">
      <SessionViewMenu value={value} onChange={setValue} testIdPrefix="session-view-menu" />
    </Flex>
  );
}

const meta: Meta<typeof SessionViewMenu> = {
  title: 'Components/UI/SessionViewMenu',
  component: SessionViewMenu,
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

export const SessionViewMenuDefault: Story = {
  render: () => <ControlledMenu />,
};

export const SessionViewMenuActiveFilter: Story = {
  render: () => <ControlledMenu initial={{ filterCategories: ['development'] }} />,
};

export const SessionViewMenuSortDateDesc: Story = {
  render: () => <ControlledMenu initial={{ sort: 'date', sortDirection: 'desc' }} />,
};

export const SessionViewMenuSortRestored: Story = {
  render: () => <ControlledMenu initial={{ sort: 'restored' }} />,
};

export const SessionViewMenuSortCategory: Story = {
  render: () => <ControlledMenu initial={{ sort: 'category', sortDirection: 'asc' }} />,
};
