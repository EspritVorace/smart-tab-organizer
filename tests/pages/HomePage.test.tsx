import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import type { AppSettings, DomainRuleSetting } from '../../src/types/syncSettings';
import type { Session } from '../../src/types/session';
import type { StatisticsAggregates } from '../../src/types/statistics';

vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      sendMessage: vi.fn(() => Promise.resolve()),
      getURL: vi.fn((p: string) => `chrome-extension://fakeid${p}`),
    },
    i18n: {
      getMessage: vi.fn((key: string) => key),
      getUILanguage: vi.fn(() => 'en'),
    },
  },
}));

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string, subs?: string[]) =>
    subs?.length ? `${key}(${subs.join(',')})` : key,
  ),
  getPluralMessage: vi.fn((count: number, oneKey: string, manyKey: string) =>
    count === 1 ? oneKey : manyKey,
  ),
}));

vi.mock('../../src/hooks/useSessions', () => ({
  useSessions: vi.fn(),
}));

import { useSessions } from '../../src/hooks/useSessions';
import { HomePage } from '../../src/pages/HomePage';
import { MockImportExportWizardsProvider } from '../../src/test-utils/MockImportExportWizardsProvider';

const mockedUseSessions = useSessions as ReturnType<typeof vi.fn>;

const baseSettings: AppSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  deduplicateUnmatchedDomains: false,
  deduplicationKeepStrategy: 'keep-grouped-or-new',
  categories: [],
  notifyOnGrouping: true,
  notifyOnDeduplication: true,
  notifyOnOrganize: true,
  domainRules: [],
};

const baseAggregates: StatisticsAggregates = {
  totalGrouping: 0,
  totalDedup: 0,
  firstUsedAt: null,
  thisWeek: { grouping: 0, dedup: 0 },
  lastWeek: { grouping: 0, dedup: 0 },
  thisMonth: { grouping: 0, dedup: 0 },
  topRules: [],
};

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    name: 'My pinned session',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
    groups: [
      { id: 'g1', title: 'Group 1', color: 'blue', tabs: [
        { id: 't1', title: 'Tab 1', url: 'https://a.test' },
        { id: 't2', title: 'Tab 2', url: 'https://b.test' },
      ] },
    ],
    ungroupedTabs: [],
    isPinned: true,
    ...overrides,
  };
}

const openImportRules = vi.fn();

const wrap = (ui: React.ReactNode) =>
  render(
    <Theme>
      <MockImportExportWizardsProvider value={{ openImportRules }}>
        {ui}
      </MockImportExportWizardsProvider>
    </Theme>,
  );

const baseHandlers = {
  onNavigate: vi.fn(),
  onOpenSnapshotWizard: vi.fn(),
  onOpenRuleWizard: vi.fn(),
  onOpenShortcutsAside: vi.fn(),
  onRestore: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  openImportRules.mockReset();
  Object.values(baseHandlers).forEach((fn) => fn.mockReset());
  mockedUseSessions.mockReturnValue({
    sessions: [],
    isLoaded: true,
    createSession: vi.fn(),
    renameSession: vi.fn(),
    removeSession: vi.fn(),
    reload: vi.fn(),
    updateOrder: vi.fn(),
  });
});

describe('HomePage rendering', () => {
  it('shows the loading skeleton until sessions and stats are loaded', () => {
    mockedUseSessions.mockReturnValue({
      sessions: [],
      isLoaded: false,
      createSession: vi.fn(),
      renameSession: vi.fn(),
      removeSession: vi.fn(),
      reload: vi.fn(),
      updateOrder: vi.fn(),
    });
    wrap(
      <HomePage
        syncSettings={baseSettings}
        statisticsAggregates={baseAggregates}
        {...baseHandlers}
      />,
    );
    expect(screen.getByTestId('home-skeleton')).toBeInTheDocument();
  });

  it('shows the onboarding hero when there are no domain rules', () => {
    wrap(
      <HomePage
        syncSettings={baseSettings}
        statisticsAggregates={baseAggregates}
        {...baseHandlers}
      />,
    );
    expect(screen.getByTestId('home-hero-import')).toBeInTheDocument();
    expect(screen.getByTestId('home-hero-create-rule')).toBeInTheDocument();
  });

  it('hides the onboarding hero when there is at least one rule', () => {
    const settings: AppSettings = {
      ...baseSettings,
      domainRules: [{ id: 'r1', label: 'Test', enabled: true } as DomainRuleSetting],
    };
    wrap(
      <HomePage
        syncSettings={settings}
        statisticsAggregates={baseAggregates}
        {...baseHandlers}
      />,
    );
    expect(screen.queryByTestId('home-hero-import')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-hero-create-rule')).not.toBeInTheDocument();
  });

  it('renders the pinned-sessions section only when at least one session is pinned', () => {
    const session = makeSession();
    mockedUseSessions.mockReturnValue({
      sessions: [session, makeSession({ id: 's2', isPinned: false })],
      isLoaded: true,
      createSession: vi.fn(),
      renameSession: vi.fn(),
      removeSession: vi.fn(),
      reload: vi.fn(),
      updateOrder: vi.fn(),
    });
    wrap(
      <HomePage
        syncSettings={baseSettings}
        statisticsAggregates={baseAggregates}
        {...baseHandlers}
      />,
    );
    expect(screen.getByTestId('home-pinned')).toBeInTheDocument();
    expect(screen.getByTestId(`home-pinned-tile-${session.id}`)).toBeInTheDocument();
  });

  it('hides the mini-stats section when all counters are zero', () => {
    wrap(
      <HomePage
        syncSettings={baseSettings}
        statisticsAggregates={baseAggregates}
        {...baseHandlers}
      />,
    );
    expect(screen.queryByTestId('home-mini-stats')).not.toBeInTheDocument();
  });

  it('shows the mini-stats section when at least one counter is positive', () => {
    wrap(
      <HomePage
        syncSettings={baseSettings}
        statisticsAggregates={{ ...baseAggregates, totalGrouping: 12 }}
        {...baseHandlers}
      />,
    );
    expect(screen.getByTestId('home-mini-stats')).toBeInTheDocument();
  });
});

describe('HomePage interactions', () => {
  it('routes the "stats" quick action via onNavigate', () => {
    wrap(
      <HomePage
        syncSettings={baseSettings}
        statisticsAggregates={baseAggregates}
        {...baseHandlers}
      />,
    );
    fireEvent.click(screen.getByTestId('home-quick-action-stats'));
    expect(baseHandlers.onNavigate).toHaveBeenCalledWith('stats');
  });

  it('opens the rule wizard when "create rule" is clicked from the onboarding hero', () => {
    wrap(
      <HomePage
        syncSettings={baseSettings}
        statisticsAggregates={baseAggregates}
        {...baseHandlers}
      />,
    );
    fireEvent.click(screen.getByTestId('home-hero-create-rule'));
    expect(baseHandlers.onOpenRuleWizard).toHaveBeenCalledTimes(1);
  });

  it('opens the rules import wizard with initialSourceMode=pack from the onboarding hero', () => {
    wrap(
      <HomePage
        syncSettings={baseSettings}
        statisticsAggregates={baseAggregates}
        {...baseHandlers}
      />,
    );
    fireEvent.click(screen.getByTestId('home-hero-import'));
    expect(openImportRules).toHaveBeenCalledTimes(1);
    expect(openImportRules).toHaveBeenCalledWith({ initialSourceMode: 'pack' });
    expect(baseHandlers.onNavigate).not.toHaveBeenCalled();
  });

  it('navigates to sessions when clicking on the sessions mini-stat', () => {
    wrap(
      <HomePage
        syncSettings={baseSettings}
        statisticsAggregates={{ ...baseAggregates, totalGrouping: 5 }}
        {...baseHandlers}
      />,
    );
    fireEvent.click(screen.getByTestId('home-mini-stat-sessions'));
    expect(baseHandlers.onNavigate).toHaveBeenCalledWith('sessions');
  });
});

describe('HomePage initial focus on mount', () => {
  it('focuses the import-pack hero button when there are no domain rules', () => {
    wrap(
      <HomePage
        syncSettings={baseSettings}
        statisticsAggregates={baseAggregates}
        {...baseHandlers}
      />,
    );
    expect(document.activeElement).toBe(screen.getByTestId('home-hero-import'));
  });

  it('focuses the organize quick-action card when there are rules but no pinned sessions', () => {
    wrap(
      <HomePage
        syncSettings={{
          ...baseSettings,
          domainRules: [{ id: 'r1', label: 'Test', enabled: true } as DomainRuleSetting],
        }}
        statisticsAggregates={baseAggregates}
        {...baseHandlers}
      />,
    );
    expect(document.activeElement).toBe(screen.getByTestId('home-quick-action-organize'));
  });

  it('focuses the first pinned-session tile when at least one is pinned', () => {
    const session = makeSession();
    mockedUseSessions.mockReturnValue({
      sessions: [session],
      isLoaded: true,
      createSession: vi.fn(),
      renameSession: vi.fn(),
      removeSession: vi.fn(),
      reload: vi.fn(),
      updateOrder: vi.fn(),
    });
    wrap(
      <HomePage
        syncSettings={{
          ...baseSettings,
          domainRules: [{ id: 'r1', label: 'Test', enabled: true } as DomainRuleSetting],
        }}
        statisticsAggregates={baseAggregates}
        {...baseHandlers}
      />,
    );
    expect(document.activeElement).toBe(screen.getByTestId(`home-pinned-tile-${session.id}`));
  });
});

describe('HomePage quick-action shortcuts', () => {
  const renderHomeWithRules = () =>
    wrap(
      <HomePage
        syncSettings={{
          ...baseSettings,
          domainRules: [{ id: 'r1', label: 'Test', enabled: true } as DomainRuleSetting],
        }}
        statisticsAggregates={baseAggregates}
        {...baseHandlers}
      />,
    );

  it('renders the kbd badge on the five shortcut-bound cards and nothing on shortcuts/workspaces', () => {
    renderHomeWithRules();
    for (const id of ['organize', 'snapshot', 'rule', 'io', 'stats']) {
      expect(screen.getByTestId(`home-quick-action-${id}-kbd`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('home-quick-action-shortcuts-kbd')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-quick-action-workspaces-kbd')).not.toBeInTheDocument();
  });

  it('dispatches the organize message when "o" is pressed', async () => {
    renderHomeWithRules();
    (document.activeElement as HTMLElement | null)?.blur();
    fireEvent.keyDown(document, { key: 'o' });
    const { browser } = await import('wxt/browser');
    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({ type: 'ORGANIZE_ALL_TABS' });
  });

  it('opens the snapshot wizard when "s" is pressed', () => {
    renderHomeWithRules();
    (document.activeElement as HTMLElement | null)?.blur();
    fireEvent.keyDown(document, { key: 's' });
    expect(baseHandlers.onOpenSnapshotWizard).toHaveBeenCalledTimes(1);
  });

  it('opens the rule wizard when "n" is pressed', () => {
    renderHomeWithRules();
    (document.activeElement as HTMLElement | null)?.blur();
    fireEvent.keyDown(document, { key: 'n' });
    expect(baseHandlers.onOpenRuleWizard).toHaveBeenCalledTimes(1);
  });

  it('navigates to import/export when "i" is pressed', () => {
    renderHomeWithRules();
    (document.activeElement as HTMLElement | null)?.blur();
    fireEvent.keyDown(document, { key: 'i' });
    expect(baseHandlers.onNavigate).toHaveBeenCalledWith('importexport');
  });

  it('navigates to stats when "t" is pressed', () => {
    renderHomeWithRules();
    (document.activeElement as HTMLElement | null)?.blur();
    fireEvent.keyDown(document, { key: 't' });
    expect(baseHandlers.onNavigate).toHaveBeenCalledWith('stats');
  });
});
