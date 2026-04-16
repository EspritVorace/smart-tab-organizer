import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Theme, Box, Flex, TextField } from '@radix-ui/themes';
import { Search } from 'lucide-react';
import { SessionCard } from './SessionCard';
import type { Session } from '@/types/session';

const baseSession: Session = {
  id: 'session-1',
  name: 'Work — Sprint 42',
  createdAt: '2025-03-20T09:00:00.000Z',
  updatedAt: '2025-03-28T17:30:00.000Z',
  isPinned: false,
  categoryId: null,
  groups: [
    {
      id: 'grp-frontend',
      title: 'Frontend',
      color: 'blue',
      tabs: [
        { id: 't1', title: 'React Docs — useEffect', url: 'https://react.dev/reference/react/useEffect', favIconUrl: '' },
        { id: 't2', title: 'GitHub PR #42', url: 'https://github.com/my-org/my-repo/pull/42', favIconUrl: '' },
      ],
    },
    {
      id: 'grp-backend',
      title: 'Backend APIs',
      color: 'green',
      tabs: [
        { id: 't3', title: 'FastAPI Documentation', url: 'https://fastapi.tiangolo.com/', favIconUrl: '' },
        { id: 't4', title: 'PostgreSQL: JSON Functions', url: 'https://www.postgresql.org/docs/current/functions-json.html', favIconUrl: '' },
      ],
    },
  ],
  ungroupedTabs: [
    { id: 't5', title: 'Figma — Sprint 42 Designs', url: 'https://figma.com/file/abc123', favIconUrl: '' },
  ],
};

const noop = () => {};
const asyncNoop = async () => {};

const meta: Meta<typeof SessionCard> = {
  title: 'Components/Core/Session/SessionCard',
  component: SessionCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <Theme>
        <Box style={{ maxWidth: 680 }}>
          <Story />
        </Box>
      </Theme>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Default (collapsed)
// ---------------------------------------------------------------------------
export const SessionCardDefault: Story = {
  args: {
    session: baseSession,
    onRestore: noop,
    onRestoreCurrentWindow: asyncNoop,
    onRestoreNewWindow: asyncNoop,
    onRename: asyncNoop,
    onEdit: noop,
    onDelete: noop,
    onPin: asyncNoop,
    onUnpin: asyncNoop,
  },
};

// ---------------------------------------------------------------------------
// Pinned profile
// ---------------------------------------------------------------------------
export const SessionCardPinned: Story = {
  args: {
    ...SessionCardDefault.args,
    session: { ...baseSession, isPinned: true },
  },
};

// ---------------------------------------------------------------------------
// Deep search — preview auto-expanded, only matching group shown
//
// Simulates a user typing "github" in the search bar:
// - The card preview is forced open (forcePreviewOpen=true).
// - Only the "Frontend" group (which contains the GitHub PR tab) is expanded.
// - The "Backend APIs" group is collapsed because it has no match.
// ---------------------------------------------------------------------------
export const SessionCardDeepSearchMatch: Story = {
  decorators: [
    (Story) => (
      <Theme>
        <Box style={{ maxWidth: 680 }}>
          {/* Simulated search bar — purely decorative in this story */}
          <Flex mb="4">
            <Box style={{ flex: 1 }}>
              <TextField.Root defaultValue="github" readOnly>
                <TextField.Slot>
                  <Search size={16} aria-hidden="true" />
                </TextField.Slot>
              </TextField.Root>
            </Box>
          </Flex>
          <Story />
        </Box>
      </Theme>
    ),
  ],
  args: {
    session: baseSession,
    onRestore: noop,
    onRestoreCurrentWindow: asyncNoop,
    onRestoreNewWindow: asyncNoop,
    onRename: asyncNoop,
    onEdit: noop,
    onDelete: noop,
    onPin: asyncNoop,
    onUnpin: asyncNoop,
    // Search matched a tab inside "Frontend" group (GitHub PR #42)
    forcePreviewOpen: true,
    searchMatchingGroupIds: new Set(['grp-frontend']),
  },
};
