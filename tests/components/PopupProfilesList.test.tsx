import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import type { Session } from '../../src/types/session';

// Mock i18n
vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => {
    const messages: Record<string, string> = {
      popupPinnedSessionsLabel: 'Pinned sessions',
      sessionRestoreCurrentWindow: 'Restore in current window',
      sessionRestoreNewWindow: 'Restore in new window',
      sessionRestoreCustomize: 'Customized restoration',
      sessionRestoreOptions: 'Restore options',
      popupPinnedEmptyHint: 'Pin a session for one-click access from here.',
      popupGoToSessions: 'Manage sessions',
      popupPinnedEmptyToggleAria: 'Toggle pinned sessions hint',
    };
    return messages[key] || key;
  }),
}));

// Mock popupPinnedEmptyCollapsedItem to avoid hitting real storage in tests
const mockGetValue = vi.fn(async () => false);
const mockSetValue = vi.fn(async () => {});
vi.mock('../../src/utils/storageItems', () => ({
  popupPinnedEmptyCollapsedItem: {
    getValue: () => mockGetValue(),
    setValue: (value: boolean) => mockSetValue(value),
  },
}));

// Mock sessionStorage
vi.mock('../../src/utils/sessionStorage', () => ({
  loadSessions: vi.fn(),
}));

// Mock tabRestore
vi.mock('../../src/utils/tabRestore', () => ({
  restoreSessionTabs: vi.fn().mockResolvedValue(undefined),
}));

// Mock getRuleCategory
vi.mock('../../src/schemas/enums', () => ({
  getRuleCategory: vi.fn(() => null),
}));

// Mock chromeGroupColors
vi.mock('../../src/utils/tabTreeUtils', () => ({
  chromeGroupColors: {},
}));

// Import after mocks
import { PopupProfilesList } from '../../src/components/UI/PopupProfilesList/PopupProfilesList';
import * as sessionStorageModule from '../../src/utils/sessionStorage';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Theme>{children}</Theme>
);

describe('PopupProfilesList', () => {
  let mockLoadSessions: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadSessions = vi.mocked(sessionStorageModule.loadSessions);
  });

  it('should not render when no pinned sessions exist', async () => {
    mockLoadSessions.mockResolvedValue([]);

    const { container } = render(
      <TestWrapper>
        <PopupProfilesList />
      </TestWrapper>
    );

    // Wait for loadSessions to be called and state to update
    await waitFor(() => {
      expect(mockLoadSessions).toHaveBeenCalled();
    });

    // PopupProfilesList returns null, so no pinned sessions section should be rendered
    const _pinnedSectionLabel = container.querySelector('[class*="Separator"]');
    // The label "Pinned sessions" should not be visible
    expect(screen.queryByText('Pinned sessions')).not.toBeInTheDocument();
  });

  it('should display pinned sessions in storage order, not sorted by updatedAt', async () => {
    const sessions: Session[] = [
      {
        id: '1',
        isPinned: true,
        updatedAt: '2026-04-10T00:00:00Z',
        name: 'Old Pinned',
        createdAt: '2026-04-10T00:00:00Z',
        ungroupedTabs: [],
        groups: [],
      },
      {
        id: '2',
        isPinned: true,
        updatedAt: '2026-04-01T00:00:00Z',
        name: 'Newer Pinned',
        createdAt: '2026-04-01T00:00:00Z',
        ungroupedTabs: [],
        groups: [],
      },
      {
        id: '3',
        isPinned: false,
        updatedAt: '2026-04-20T00:00:00Z',
        name: 'Unpinned',
        createdAt: '2026-04-20T00:00:00Z',
        ungroupedTabs: [],
        groups: [],
      },
    ];

    mockLoadSessions.mockResolvedValue(sessions);

    render(
      <TestWrapper>
        <PopupProfilesList />
      </TestWrapper>
    );

    // Wait for loadSessions to resolve and component to render
    await waitFor(() => {
      expect(mockLoadSessions).toHaveBeenCalled();
    });

    // Get pinned session items
    await waitFor(() => {
      expect(screen.getByText('Old Pinned')).toBeInTheDocument();
    });

    const pinnedItems = screen.getAllByTestId(/^popup-profile-item-/);

    // Should show only pinned sessions (1 and 2, not 3)
    expect(pinnedItems).toHaveLength(2);

    // Order should be storage order (1, 2), not by updatedAt (2, 1)
    expect(pinnedItems[0]).toHaveAttribute('data-testid', 'popup-profile-item-1');
    expect(pinnedItems[1]).toHaveAttribute('data-testid', 'popup-profile-item-2');

    // Verify session names
    expect(screen.getByText('Old Pinned')).toBeInTheDocument();
    expect(screen.getByText('Newer Pinned')).toBeInTheDocument();
    expect(screen.queryByText('Unpinned')).not.toBeInTheDocument();
  });

  it('should not apply any sorting to pinned sessions', async () => {
    const sessions: Session[] = [
      {
        id: 'p3',
        isPinned: true,
        updatedAt: '2026-04-01T00:00:00Z',
        name: 'Third (oldest)',
        createdAt: '2026-04-01T00:00:00Z',
        ungroupedTabs: [],
        groups: [],
      },
      {
        id: 'p1',
        isPinned: true,
        updatedAt: '2026-04-30T00:00:00Z',
        name: 'First (newest)',
        createdAt: '2026-04-30T00:00:00Z',
        ungroupedTabs: [],
        groups: [],
      },
      {
        id: 'p2',
        isPinned: true,
        updatedAt: '2026-04-15T00:00:00Z',
        name: 'Second (middle)',
        createdAt: '2026-04-15T00:00:00Z',
        ungroupedTabs: [],
        groups: [],
      },
    ];

    mockLoadSessions.mockResolvedValue(sessions);

    render(
      <TestWrapper>
        <PopupProfilesList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Third (oldest)')).toBeInTheDocument();
    });

    const pinnedItems = screen.getAllByTestId(/^popup-profile-item-/);

    // Order should be exactly as in storage (p3, p1, p2), not sorted by updatedAt
    expect(pinnedItems).toHaveLength(3);
    expect(pinnedItems[0]).toHaveAttribute('data-testid', 'popup-profile-item-p3');
    expect(pinnedItems[1]).toHaveAttribute('data-testid', 'popup-profile-item-p1');
    expect(pinnedItems[2]).toHaveAttribute('data-testid', 'popup-profile-item-p2');

    // If it were sorted by updatedAt desc, order would be p1, p2, p3
    // But we want the storage order: p3, p1, p2
    expect(screen.getByText('Third (oldest)')).toBeInTheDocument();
    expect(screen.getByText('First (newest)')).toBeInTheDocument();
    expect(screen.getByText('Second (middle)')).toBeInTheDocument();
  });

  it('should show the collapsible empty hint when sessions exist but none are pinned', async () => {
    const sessions: Session[] = [
      {
        id: 'unpinned-1',
        isPinned: false,
        updatedAt: '2026-04-10T00:00:00Z',
        name: 'Not pinned',
        createdAt: '2026-04-10T00:00:00Z',
        ungroupedTabs: [],
        groups: [],
      },
    ];

    mockLoadSessions.mockResolvedValue(sessions);

    render(
      <TestWrapper>
        <PopupProfilesList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Pin a session for one-click access from here.')).toBeInTheDocument();
    });

    expect(screen.getByText('Manage sessions')).toBeInTheDocument();
    expect(screen.getByTestId('popup-pinned-empty-toggle')).toBeInTheDocument();
  });

  it('should persist the collapsed state when the user toggles the empty hint', async () => {
    const { fireEvent } = await import('@testing-library/react');
    const sessions: Session[] = [
      {
        id: 'unpinned-1',
        isPinned: false,
        updatedAt: '2026-04-10T00:00:00Z',
        name: 'Not pinned',
        createdAt: '2026-04-10T00:00:00Z',
        ungroupedTabs: [],
        groups: [],
      },
    ];

    mockLoadSessions.mockResolvedValue(sessions);
    mockSetValue.mockClear();

    render(
      <TestWrapper>
        <PopupProfilesList />
      </TestWrapper>
    );

    const toggle = await screen.findByTestId('popup-pinned-empty-toggle');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith(true);
    });
  });

  it('renders a SessionRestoreButton (split button) on each pinned session', async () => {
    const sessions: Session[] = [
      {
        id: 'p-restore',
        isPinned: true,
        updatedAt: '2026-04-10T00:00:00Z',
        name: 'Restorable Profile',
        createdAt: '2026-04-10T00:00:00Z',
        ungroupedTabs: [],
        groups: [],
      },
    ];

    mockLoadSessions.mockResolvedValue(sessions);

    render(
      <TestWrapper>
        <PopupProfilesList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Restorable Profile')).toBeInTheDocument();
    });

    // Primary restore button (left half of the split button)
    expect(screen.getByRole('button', { name: /Restore in current window/i })).toBeInTheDocument();
    // Chevron dropdown trigger (right half) — exposes the 3 options (asserted in e2e)
    expect(screen.getByRole('button', { name: /Restore options/i })).toBeInTheDocument();
  });

  it('should display pinned sessions label when pinned sessions exist', async () => {
    const sessions: Session[] = [
      {
        id: '1',
        isPinned: true,
        updatedAt: '2026-04-10T00:00:00Z',
        name: 'Pinned Session',
        createdAt: '2026-04-10T00:00:00Z',
        ungroupedTabs: [],
        groups: [],
      },
    ];

    mockLoadSessions.mockResolvedValue(sessions);

    render(
      <TestWrapper>
        <PopupProfilesList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Pinned sessions')).toBeInTheDocument();
    });
  });
});
