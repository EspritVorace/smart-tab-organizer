import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import type { Session } from '../../src/types/session';
import type {
  ConflictingSession,
  SessionDiff,
  GroupDiff,
} from '../../src/utils/sessionClassification';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => key),
  getPluralMessage: vi.fn((count: number, oneKey: string, manyKey: string) =>
    count === 1 ? oneKey : manyKey,
  ),
}));

import {
  SessionRow,
  ConflictSessionRow,
  SessionDiffView,
} from '../../src/components/UI/ImportExportWizards/SessionImportRows';

const wrap = (ui: React.ReactNode) => render(<Theme>{ui}</Theme>);

const baseSession: Session = {
  id: 's1',
  name: 'My Session',
  createdAt: '2025-01-01T10:00:00.000Z',
  updatedAt: '2025-01-02T10:00:00.000Z',
  isPinned: false,
  categoryId: null,
  groups: [],
  ungroupedTabs: [],
};

const emptyDiff: SessionDiff = {
  groupsAdded: [],
  groupsRemoved: [],
  groupsChanged: [],
  ungroupedTabsAdded: [],
  ungroupedTabsRemoved: [],
};

describe('SessionRow', () => {
  it('renders the session name', () => {
    wrap(<SessionRow session={baseSession} />);
    expect(screen.getByText('My Session')).toBeInTheDocument();
  });

  it('shows the pinned badge when the session is pinned', () => {
    wrap(<SessionRow session={{ ...baseSession, isPinned: true }} />);
    expect(screen.getByText('pinnedBadge')).toBeInTheDocument();
  });

  it('renders a status badge when provided', () => {
    wrap(<SessionRow session={baseSession} statusBadge="IDENTICAL" />);
    expect(screen.getByText('IDENTICAL')).toBeInTheDocument();
  });

  it('renders a checkbox when checkbox=true', () => {
    wrap(<SessionRow session={baseSession} checkbox checked onToggle={() => {}} />);
    expect(screen.getByLabelText('My Session')).toBeInTheDocument();
  });
});

describe('ConflictSessionRow', () => {
  it('renders a conflicting session card with the diff popover trigger', () => {
    const conflict: ConflictingSession = {
      imported: { ...baseSession, name: 'Imported' },
      existing: baseSession,
      diff: { ...emptyDiff, groupsAdded: ['New group'] },
    };
    wrap(<ConflictSessionRow conflict={conflict} />);
    expect(screen.getByText('Imported')).toBeInTheDocument();
  });

  it('displays the pinned badge when the imported session is pinned', () => {
    const conflict: ConflictingSession = {
      imported: { ...baseSession, name: 'Pinned', isPinned: true },
      existing: baseSession,
      diff: emptyDiff,
    };
    wrap(<ConflictSessionRow conflict={conflict} />);
    expect(screen.getByText('pinnedBadge')).toBeInTheDocument();
  });
});

describe('SessionDiffView', () => {
  it('returns null when no diff content', () => {
    const { container } = wrap(<SessionDiffView diff={emptyDiff} />);
    // Theme wrapper renders, but no diff content node should appear inside.
    expect(container.querySelector('[mb]')).toBeNull();
    expect(container.textContent).toBe('');
  });

  it('shows isPinned diff', () => {
    wrap(
      <SessionDiffView
        diff={{ ...emptyDiff, isPinned: { current: false, imported: true } }}
      />,
    );
    expect(screen.getByText(/isPinned/)).toBeInTheDocument();
  });

  it('shows categoryId diff with null fallbacks', () => {
    wrap(
      <SessionDiffView
        diff={{ ...emptyDiff, categoryId: { current: null, imported: 'work' } }}
      />,
    );
    expect(screen.getByText(/categoryId/)).toBeInTheDocument();
  });

  it('lists groups added and groups removed', () => {
    wrap(
      <SessionDiffView
        diff={{ ...emptyDiff, groupsAdded: ['Cloud'], groupsRemoved: ['Old'] }}
      />,
    );
    expect(screen.getByText('Groups added')).toBeInTheDocument();
    expect(screen.getByText('Cloud')).toBeInTheDocument();
    expect(screen.getByText('Groups removed')).toBeInTheDocument();
    expect(screen.getByText('Old')).toBeInTheDocument();
  });

  it('lists ungrouped tabs added and removed', () => {
    wrap(
      <SessionDiffView
        diff={{
          ...emptyDiff,
          ungroupedTabsAdded: ['https://added.example/'],
          ungroupedTabsRemoved: ['https://removed.example/'],
        }}
      />,
    );
    expect(screen.getByText('Ungrouped tabs')).toBeInTheDocument();
    expect(screen.getByText('+ https://added.example/')).toBeInTheDocument();
    expect(screen.getByText('- https://removed.example/')).toBeInTheDocument();
  });

  it('renders a changed group with color, added and removed tabs', () => {
    const groupDiff: GroupDiff = {
      title: 'Work',
      colorChanged: { current: 'blue', imported: 'red' },
      tabsAdded: ['https://new.example/'],
      tabsRemoved: ['https://old.example/'],
    };
    wrap(<SessionDiffView diff={{ ...emptyDiff, groupsChanged: [groupDiff] }} />);
    expect(screen.getByText(/Group: Work/)).toBeInTheDocument();
    expect(screen.getByText('+ https://new.example/')).toBeInTheDocument();
    expect(screen.getByText('- https://old.example/')).toBeInTheDocument();
  });
});
