import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Theme, Box, Flex, TextField, Checkbox, Badge, Button } from '@radix-ui/themes';
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
    onReplaceCurrentWindow: asyncNoop,
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
// Relative dates: cards staggered across multiple time ranges to validate
// the "modifiée il y a X" / "créée il y a Y" rendering on the right of the
// counters line, and the wrap behavior on narrow widths.
// ---------------------------------------------------------------------------
const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const buildSession = (
  id: string,
  name: string,
  createdOffsetMs: number,
  updatedOffsetMs: number | null,
): Session => {
  const reference = new Date('2026-04-29T12:00:00.000Z').getTime();
  const createdAt = new Date(reference - createdOffsetMs).toISOString();
  const updatedAt = new Date(
    reference - (updatedOffsetMs ?? createdOffsetMs),
  ).toISOString();
  return {
    ...baseSession,
    id,
    name,
    createdAt,
    updatedAt,
  };
};

export const SessionCardWithRelativeDates: Story = {
  render: () => {
    const sessions: Session[] = [
      buildSession('rt-just-now', 'Vient de naître', 1 * SECOND, null),
      buildSession('rt-5min-modified', 'Sprint en cours', 30 * MINUTE, 5 * MINUTE),
      buildSession('rt-2h-created', 'Recherches du matin', 2 * HOUR, null),
      buildSession('rt-yesterday', 'Veille technologique', 2 * DAY, 1 * DAY),
      buildSession('rt-3-days', 'Documentation API', 3 * DAY, null),
      buildSession('rt-2-weeks', 'Refonte UI', 3 * WEEK, 2 * WEEK),
      buildSession('rt-1-month', 'Release Q1', 1 * MONTH, null),
      buildSession('rt-1-year', 'Archives 2025', 1 * YEAR, null),
    ];
    return (
      <Theme>
        <Flex direction="column" gap="2" style={{ maxWidth: 680 }}>
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              existingSessions={sessions}
              onRestore={noop}
              onRestoreCurrentWindow={asyncNoop}
              onRestoreNewWindow={asyncNoop}
              onReplaceCurrentWindow={asyncNoop}
              onRename={asyncNoop}
              onEdit={noop}
              onDelete={noop}
              onPin={asyncNoop}
              onUnpin={asyncNoop}
            />
          ))}
        </Flex>
      </Theme>
    );
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
// ---------------------------------------------------------------------------
// Summary mode: base (no actions, no drag)
// ---------------------------------------------------------------------------
export const SessionCardSummary: Story = {
  name: 'SessionCard — Summary (base)',
  decorators: [(Story) => <div role="list"><Story /></div>],
  args: {
    session: baseSession,
    variant: 'summary',
  },
};

// ---------------------------------------------------------------------------
// Summary mode: with leading checkbox (export use case)
// ---------------------------------------------------------------------------
export const SessionCardSummaryWithCheckbox: Story = {
  name: 'SessionCard — Summary + checkbox (export)',
  render: () => (
    <Theme>
      <Box style={{ maxWidth: 680 }}>
        <div role="list">
          <SessionCard
            session={baseSession}
            variant="summary"
            leading={<Checkbox defaultChecked aria-label={baseSession.name} />}
          />
        </div>
      </Box>
    </Theme>
  ),
};

// ---------------------------------------------------------------------------
// Summary mode: conflict state (import conflicting session)
// ---------------------------------------------------------------------------
export const SessionCardSummaryConflict: Story = {
  name: 'SessionCard — Summary + conflict (import)',
  render: () => (
    <Theme>
      <Box style={{ maxWidth: 680 }}>
        <div role="list">
          <SessionCard
            session={baseSession}
            variant="summary"
            status="conflict"
            trailing={
              <Button size="1" variant="soft" color="orange">View diff</Button>
            }
          />
        </div>
      </Box>
    </Theme>
  ),
};

// ---------------------------------------------------------------------------
// Summary mode: identical state (import already-existing session)
// ---------------------------------------------------------------------------
export const SessionCardSummaryIdentical: Story = {
  name: 'SessionCard — Summary + identical (import)',
  render: () => (
    <Theme>
      <Box style={{ maxWidth: 680 }}>
        <div role="list">
          <SessionCard
            session={baseSession}
            variant="summary"
            status="identical"
            trailing={
              <Badge color="gray" variant="outline" size="1">Already exists</Badge>
            }
          />
        </div>
      </Box>
    </Theme>
  ),
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
              <TextField.Root defaultValue="github" readOnly aria-label="Search sessions">
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
    onReplaceCurrentWindow: asyncNoop,
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
