import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mocks (hoisted before the imports).

vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      openOptionsPage: vi.fn(),
      getURL: vi.fn((path: string) => `chrome-extension://fakeid${path}`),
      getManifest: vi.fn(() => ({ version: '1.1.4' })),
    },
    tabs: {
      query: vi.fn(() => Promise.resolve([])),
      update: vi.fn(() => Promise.resolve()),
      create: vi.fn(() => Promise.resolve()),
    },
    windows: {
      update: vi.fn(() => Promise.resolve()),
    },
    i18n: {
      getMessage: vi.fn((key: string) => key),
      getUILanguage: vi.fn(() => 'en'),
    },
  },
}));

vi.mock('../../src/hooks/useSettings', () => ({
  useSettings: vi.fn(),
}));

vi.mock('../../src/components/UI/PopupToolbar/PopupToolbar', () => ({
  PopupToolbar: () => null,
}));

vi.mock('../../src/components/UI/PopupProfilesList/PopupProfilesList', () => ({
  PopupProfilesList: () => null,
}));

// Imports after the mocks.

import { browser } from 'wxt/browser';
import { useSettings } from '../../src/hooks/useSettings';
import { PopupApp } from '../../src/pages/popup';

const mockedUseSettings = useSettings as ReturnType<typeof vi.fn>;
const mockedTabsQuery = browser.tabs.query as ReturnType<typeof vi.fn>;

const defaultSettings = {
  domainRules: [],
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedTabsQuery.mockResolvedValue([]);
  mockedUseSettings.mockReturnValue({
    settings: defaultSettings,
    isLoaded: true,
    setGlobalGroupingEnabled: vi.fn(),
    setGlobalDeduplicationEnabled: vi.fn(),
  });
});

// ── Tests ─────────────────────────────────────────────────────────────────

describe('PopupApp rendu', () => {
  it('affiche le header popup', () => {
    render(<PopupApp />);
    expect(screen.getByTestId('popup-header')).toBeInTheDocument();
  });

  it('renders SettingsToggles without rules (hasRules=false)', () => {
    mockedUseSettings.mockReturnValue({
      settings: { ...defaultSettings, domainRules: [] },
      isLoaded: true,
      setGlobalGroupingEnabled: vi.fn(),
      setGlobalDeduplicationEnabled: vi.fn(),
    });
    render(<PopupApp />);
    expect(screen.queryByTestId('settings-toggles')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'popupCreateRule' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'popupImportRules' })).toBeInTheDocument();
  });

  it('renders SettingsToggles with rules (hasRules=true)', () => {
    mockedUseSettings.mockReturnValue({
      settings: { ...defaultSettings, domainRules: [{ id: '1' }] },
      isLoaded: true,
      setGlobalGroupingEnabled: vi.fn(),
      setGlobalDeduplicationEnabled: vi.fn(),
    });
    render(<PopupApp />);
    expect(screen.getByTestId('settings-toggles')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'popupCreateRule' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'popupImportRules' })).not.toBeInTheDocument();
  });

  it("n'affiche aucun SettingsToggles pendant le chargement (isLoaded=false)", () => {
    mockedUseSettings.mockReturnValue({
      settings: null,
      isLoaded: false,
      setGlobalGroupingEnabled: vi.fn(),
      setGlobalDeduplicationEnabled: vi.fn(),
    });
    render(<PopupApp />);
    expect(screen.queryByTestId('settings-toggles')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'popupCreateRule' })).not.toBeInTheDocument();
  });
});

describe('openOptionsPage', () => {
  it('appelle browser.runtime.openOptionsPage au clic sur le bouton settings', () => {
    render(<PopupApp />);
    fireEvent.click(screen.getByTestId('popup-header-btn-settings'));
    expect(browser.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
  });
});

describe('empty-state rule buttons', () => {
  beforeEach(() => {
    mockedUseSettings.mockReturnValue({
      settings: { ...defaultSettings, domainRules: [] },
      isLoaded: true,
      setGlobalGroupingEnabled: vi.fn(),
      setGlobalDeduplicationEnabled: vi.fn(),
    });
    vi.spyOn(window, 'close').mockImplementation(() => {});
  });

  it('"Create rule" opens options with #rules?action=create', async () => {
    mockedTabsQuery.mockResolvedValue([]);
    render(<PopupApp />);
    fireEvent.click(screen.getByRole('button', { name: 'popupCreateRule' }));
    await waitFor(() => {
      expect(browser.tabs.create).toHaveBeenCalledWith(
        expect.objectContaining({ url: expect.stringContaining('#rules?action=create') }),
      );
      expect(window.close).toHaveBeenCalled();
    });
  });

  it('"Import rules" opens options with #rules?action=import', async () => {
    mockedTabsQuery.mockResolvedValue([]);
    render(<PopupApp />);
    fireEvent.click(screen.getByRole('button', { name: 'popupImportRules' }));
    await waitFor(() => {
      expect(browser.tabs.create).toHaveBeenCalledWith(
        expect.objectContaining({ url: expect.stringContaining('#rules?action=import') }),
      );
      expect(window.close).toHaveBeenCalled();
    });
  });
});
