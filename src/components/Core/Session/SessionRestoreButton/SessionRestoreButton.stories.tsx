import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Theme } from '@radix-ui/themes';
import { SessionRestoreButton } from './SessionRestoreButton';
import type { Session } from '@/types/session';

const baseSession: Session = {
  id: 'session-1',
  name: 'Work Sprint',
  createdAt: '2025-03-20T09:00:00.000Z',
  updatedAt: '2025-03-28T17:30:00.000Z',
  isPinned: false,
  categoryId: null,
  groups: [],
  ungroupedTabs: [],
};

const noop = () => {};

const meta: Meta<typeof SessionRestoreButton> = {
  title: 'Components/Core/Session/SessionRestoreButton',
  component: SessionRestoreButton,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <Theme>
        <Box style={{ padding: 16 }}>
          <Story />
        </Box>
      </Theme>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SessionRestoreButtonDefault: Story = {
  args: {
    session: baseSession,
    onRestoreCurrentWindow: noop,
    onRestoreNewWindow: noop,
    onReplaceCurrentWindow: noop,
    onCustomize: noop,
  },
};

export const SessionRestoreButtonSolid: Story = {
  args: {
    ...SessionRestoreButtonDefault.args,
    variant: 'solid',
  },
};

export const SessionRestoreButtonOutline: Story = {
  args: {
    ...SessionRestoreButtonDefault.args,
    variant: 'outline',
  },
};
