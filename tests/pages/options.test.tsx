import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mocks (hoissés avant les imports) ──────────────────────────────────────

vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      getManifest: vi.fn(() => ({ version: '1.1.3' })),
      getURL: vi.fn((path: string) => `chrome-extension://fakeid${path}`),
    },
    tabs: {
      create: vi.fn(() => Promise.resolve()),
    },
    i18n: {
      getMessage: vi.fn((key: string) => key),
      getUILanguage: vi.fn(() => 'en'),
    },
  },
}));

vi.mock('../../src/hooks/useSettings', () => ({ useSettings: vi.fn() }));
vi.mock('../../src/hooks/useStatistics', () => ({ useStatistics: vi.fn() }));
vi.mock('../../src/hooks/useDeepLinking', () => ({ useDeepLinking: vi.fn() }));

vi.mock('../../src/pages/DomainRulesPage', () => ({ DomainRulesPage: () => <div data-testid="page-rules-mock" /> }));
vi.mock('../../src/pages/SessionsPage', () => ({ SessionsPage: () => <div data-testid="page-sessions-mock" /> }));
vi.mock('../../src/pages/ImportExportPage', () => ({ ImportExportPage: () => <div data-testid="page-importexport-mock" /> }));
vi.mock('../../src/pages/StatisticsPage', () => ({
  StatisticsPage: ({ onReset }: { onReset: () => void }) => (
    <div data-testid="page-stats-mock">
      <button data-testid="stats-reset-mock" onClick={onReset}>reset</button>
    </div>
  ),
}));
vi.mock('../../src/components/UI/SettingsPage/SettingsPage', () => ({ SettingsPage: () => <div data-testid="page-settings-mock" /> }));
vi.mock('../../src/components/UI/Toaster/Toaster', () => ({ Toaster: () => null }));

// ── Imports après mocks ───────────────────────────────────────────────────

import { useSettings } from '../../src/hooks/useSettings';
import { useStatistics } from '../../src/hooks/useStatistics';
import { useDeepLinking } from '../../src/hooks/useDeepLinking';
import { OptionsApp } from '../../src/pages/options';

const mockedUseSettings = useSettings as ReturnType<typeof vi.fn>;
const mockedUseStatistics = useStatistics as ReturnType<typeof vi.fn>;
const mockedUseDeepLinking = useDeepLinking as ReturnType<typeof vi.fn>;

const mockSettings = {
  domainRules: [],
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
};

const mockStats = { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 0 };

function makeDeepLinking(currentTab = 'rules') {
  return {
    currentTab,
    setCurrentTab: vi.fn(),
    openSnapshotWizard: false,
    setOpenSnapshotWizard: vi.fn(),
    snapshotGroupId: null,
    setSnapshotGroupId: vi.fn(),
    restoreSessionId: null,
    setRestoreSessionId: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseSettings.mockReturnValue({ settings: mockSettings, updateSettings: vi.fn() });
  mockedUseStatistics.mockReturnValue({ statistics: mockStats, resetStatistics: vi.fn() });
  mockedUseDeepLinking.mockReturnValue(makeDeepLinking('rules'));
});

// ── Tests ─────────────────────────────────────────────────────────────────

describe('OptionsApp rendu', () => {
  it('affiche le spinner quand settings est null', () => {
    mockedUseSettings.mockReturnValue({ settings: null, updateSettings: vi.fn() });
    render(<OptionsApp />);
    expect(screen.getByText('loadingText')).toBeInTheDocument();
    expect(screen.queryByTestId('options')).not.toBeInTheDocument();
  });

  it('affiche la sidebar et le header quand settings est chargé', () => {
    render(<OptionsApp />);
    expect(screen.getByTestId('options')).toBeInTheDocument();
    expect(screen.getByTestId('options-header')).toBeInTheDocument();
  });

  it('affiche la page rules par défaut (currentTab=rules)', () => {
    render(<OptionsApp />);
    expect(screen.getByTestId('page-rules-mock')).toBeInTheDocument();
  });

  it('affiche la page sessions quand currentTab=sessions', () => {
    mockedUseDeepLinking.mockReturnValue(makeDeepLinking('sessions'));
    render(<OptionsApp />);
    expect(screen.getByTestId('page-sessions-mock')).toBeInTheDocument();
  });

  it('affiche la page importexport quand currentTab=importexport', () => {
    mockedUseDeepLinking.mockReturnValue(makeDeepLinking('importexport'));
    render(<OptionsApp />);
    expect(screen.getByTestId('page-importexport-mock')).toBeInTheDocument();
  });

  it('affiche la page stats quand currentTab=stats', () => {
    mockedUseDeepLinking.mockReturnValue(makeDeepLinking('stats'));
    render(<OptionsApp />);
    expect(screen.getByTestId('page-stats-mock')).toBeInTheDocument();
  });

  it('affiche la page settings quand currentTab=settings', () => {
    mockedUseDeepLinking.mockReturnValue(makeDeepLinking('settings'));
    render(<OptionsApp />);
    expect(screen.getByTestId('page-settings-mock')).toBeInTheDocument();
  });
});

describe('OptionsContent callbacks', () => {
  it('handleTabChange appelle setCurrentTab et met à jour le hash', () => {
    const setCurrentTab = vi.fn();
    mockedUseDeepLinking.mockReturnValue({ ...makeDeepLinking('rules'), setCurrentTab });
    render(<OptionsApp />);

    fireEvent.click(screen.getByTestId('sidebar-nav-item-sessions'));
    expect(setCurrentTab).toHaveBeenCalledWith('sessions');
    expect(window.location.hash).toBe('#sessions');
  });

  it('handleResetStats ouvre le dialog de confirmation', async () => {
    mockedUseDeepLinking.mockReturnValue(makeDeepLinking('stats'));
    render(<OptionsApp />);

    fireEvent.click(screen.getByTestId('stats-reset-mock'));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });
  });

  it('sidebar se replie au clic sur le bouton collapse', () => {
    render(<OptionsApp />);
    expect(screen.getByTestId('sidebar')).toHaveStyle({ width: '280px' });
    fireEvent.click(screen.getByTestId('sidebar-collapse-btn'));
    expect(screen.getByTestId('sidebar')).toHaveStyle({ width: '80px' });
  });
});
