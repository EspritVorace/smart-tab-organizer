import type { Meta, StoryObj } from '@storybook/react';
import { Button, Flex } from '@radix-ui/themes';
import { Shield, AlertCircle, Archive, Plus, Upload } from 'lucide-react';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Components/UI/EmptyState/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyStateDefault: Story = {
  name: 'Default (no domain rules)',
  args: {
    icon: Shield,
    title: 'No domain rules yet',
    description: 'Create a rule to automatically group your tabs, or import rules from a file.',
  },
};

export const EmptyStateWithActions: Story = {
  name: 'Default with actions',
  args: {
    icon: Shield,
    title: 'No domain rules yet',
    description: 'Create a rule to automatically group your tabs, or import rules from a file.',
    actions: (
      <Flex gap="2">
        <Button variant="soft">
          <Plus size={14} aria-hidden="true" />
          Add rule
        </Button>
        <Button variant="soft">
          <Upload size={14} aria-hidden="true" />
          Import
        </Button>
      </Flex>
    ),
  },
};

export const EmptyStateCompact: Story = {
  name: 'Compact (search no results)',
  args: {
    icon: AlertCircle,
    compact: true,
    message: 'No rules found',
  },
};

export const EmptyStateSessions: Story = {
  name: 'Sessions (no sessions)',
  args: {
    icon: Archive,
    title: 'No saved sessions.',
    description: 'Take a snapshot to capture your current tabs. Pin a session to access it from the popup.',
    actions: (
      <Flex gap="2">
        <Button variant="soft">
          <Archive size={14} aria-hidden="true" />
          Take a snapshot
        </Button>
        <Button variant="soft">
          <Upload size={14} aria-hidden="true" />
          Import sessions
        </Button>
      </Flex>
    ),
  },
};

export const EmptyStateSessionsCompact: Story = {
  name: 'Sessions compact (search no results)',
  args: {
    icon: Archive,
    compact: true,
    message: 'No sessions found',
  },
};
