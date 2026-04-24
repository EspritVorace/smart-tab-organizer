import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mocks (hoissés avant les imports) ──────────────────────────────────────

vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      openOptionsPage: vi.fn(),
      getURL: vi.fn((path: string) => `chrome-extension://fakeid${path}`),
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

vi.mock('../../src/utils/mountExtensionApp.js', () => ({
  mountExtensionApp: vi.fn(),
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

// ── Imports après mocks ───────────────────────────────────────────────────

import { browser } from 'wxt/browser';
import { mountExtensionApp } from '../../src/utils/mountExtensionApp.js';
import { useSettings } from '../../src/hooks/useSettings';
import '../../src/pages/popup';

const mockedMount = mountExtensionApp as ReturnType<typeof vi.fn>;
const mockedUseSettings = useSettings as ReturnType<typeof vi.fn>;
const mockedTabsQuery = browser.tabs.query as ReturnType<typeof vi.fn>;

const appElement = mockedMount.mock.calls[0][1];

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

describe('popup.tsx IIFE', () => {
  it("monte un composant React sur 'popup-app'", () => {
    expect(appElement).toBeTruthy();
  });
});

describe('PopupApp rendu', () => {
  it('affiche le header popup', () => {
    render(appElement);
    expect(screen.getByTestId('popup-header')).toBeInTheDocument();
  });

  it('affiche SettingsToggles sans règles (hasRules=false)', () => {
    mockedUseSettings.mockReturnValue({
      settings: { ...defaultSettings, domainRules: [] },
      isLoaded: true,
      setGlobalGroupingEnabled: vi.fn(),
      setGlobalDeduplicationEnabled: vi.fn(),
    });
    render(appElement);
    expect(screen.queryByTestId('settings-toggles')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'popupGoToRules' })).toBeInTheDocument();
  });

  it('affiche SettingsToggles avec règles (hasRules=true)', () => {
    mockedUseSettings.mockReturnValue({
      settings: { ...defaultSettings, domainRules: [{ id: '1' }] },
      isLoaded: true,
      setGlobalGroupingEnabled: vi.fn(),
      setGlobalDeduplicationEnabled: vi.fn(),
    });
    render(appElement);
    expect(screen.getByTestId('settings-toggles')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'popupGoToRules' })).not.toBeInTheDocument();
  });

  it("n'affiche aucun SettingsToggles pendant le chargement (isLoaded=false)", () => {
    mockedUseSettings.mockReturnValue({
      settings: null,
      isLoaded: false,
      setGlobalGroupingEnabled: vi.fn(),
      setGlobalDeduplicationEnabled: vi.fn(),
    });
    render(appElement);
    expect(screen.queryByTestId('settings-toggles')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'popupGoToRules' })).not.toBeInTheDocument();
  });
});

describe('openOptionsPage', () => {
  it('appelle browser.runtime.openOptionsPage au clic sur le bouton settings', () => {
    render(appElement);
    fireEvent.click(screen.getByTestId('popup-header-btn-settings'));
    expect(browser.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
  });
});

describe('openRulesPage', () => {
  beforeEach(() => {
    mockedUseSettings.mockReturnValue({
      settings: { ...defaultSettings, domainRules: [] },
      isLoaded: true,
      setGlobalGroupingEnabled: vi.fn(),
      setGlobalDeduplicationEnabled: vi.fn(),
    });
    vi.spyOn(window, 'close').mockImplementation(() => {});
  });

  it("crée un nouvel onglet si aucun onglet options n'est ouvert", async () => {
    mockedTabsQuery.mockResolvedValue([]);
    render(appElement);
    fireEvent.click(screen.getByRole('button', { name: 'popupGoToRules' }));
    await waitFor(() => {
      expect(browser.tabs.create).toHaveBeenCalledWith(
        expect.objectContaining({ url: expect.stringContaining('#rules') }),
      );
    });
    expect(window.close).toHaveBeenCalled();
  });

  it("met à jour l'onglet existant si un onglet options est déjà ouvert", async () => {
    mockedTabsQuery.mockResolvedValue([{ id: 42, windowId: 1 }]);
    render(appElement);
    fireEvent.click(screen.getByRole('button', { name: 'popupGoToRules' }));
    await waitFor(() => {
      expect(browser.tabs.update).toHaveBeenCalledWith(
        42,
        expect.objectContaining({ active: true }),
      );
    });
    expect(browser.windows.update).toHaveBeenCalledWith(1, { focused: true });
    expect(window.close).toHaveBeenCalled();
  });
});
