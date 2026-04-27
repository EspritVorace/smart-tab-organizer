import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---- Mocks (avant les imports) -----------------------------------------------

vi.mock('wxt/browser', () => ({
  browser: {
    tabs: {
      sendMessage: vi.fn(),
    },
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../src/utils/deduplicationSkip.js', () => ({
  markUrlToSkipDeduplication: vi.fn(),
}));

// ---- Imports après mocks -------------------------------------------------------

import { browser } from 'wxt/browser';
import { markUrlToSkipDeduplication } from '../../src/utils/deduplicationSkip.js';
import {
  middleClickedTabs,
  handleMiddleClickMessage,
  handleSessionRestoreSkipDedupMessage,
  cleanupMiddleClickedTabsForTab,
  promptForGroupName,
  findMiddleClickOpener,
} from '../../src/background/messaging.js';

const mockedSendMessage = browser.tabs.sendMessage as ReturnType<typeof vi.fn>;
const mockedMarkUrl = markUrlToSkipDeduplication as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  middleClickedTabs.clear();
});

// ---- handleMiddleClickMessage ------------------------------------------------

describe('handleMiddleClickMessage', () => {
  it('enregistre l\'URL dans middleClickedTabs et répond "received" quand sender.tab.id est présent', () => {
    const sendResponse = vi.fn();
    handleMiddleClickMessage(
      { type: 'MIDDLE_CLICK', url: 'https://example.com' },
      { tab: { id: 42 } } as any,
      sendResponse,
    );

    expect(middleClickedTabs.get('https://example.com')).toBe(42);
    expect(sendResponse).toHaveBeenCalledWith({ status: 'received' });
  });

  it('répond "error" quand sender.tab est absent', () => {
    const sendResponse = vi.fn();
    handleMiddleClickMessage(
      { type: 'MIDDLE_CLICK', url: 'https://example.com' },
      {} as any,
      sendResponse,
    );

    expect(middleClickedTabs.size).toBe(0);
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' }),
    );
  });

  it('répond "error" quand sender.tab.id est absent', () => {
    const sendResponse = vi.fn();
    handleMiddleClickMessage(
      { type: 'MIDDLE_CLICK', url: 'https://example.com' },
      { tab: {} } as any,
      sendResponse,
    );

    expect(middleClickedTabs.size).toBe(0);
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' }),
    );
  });
});

// ---- handleSessionRestoreSkipDedupMessage ------------------------------------

describe('handleSessionRestoreSkipDedupMessage', () => {
  it('appelle markUrlToSkipDeduplication pour chaque URL et répond "received"', () => {
    const sendResponse = vi.fn();
    handleSessionRestoreSkipDedupMessage(
      { type: 'SESSION_RESTORE_SKIP_DEDUP', urls: ['https://a.com', 'https://b.com'] },
      sendResponse,
    );

    expect(mockedMarkUrl).toHaveBeenCalledWith('https://a.com');
    expect(mockedMarkUrl).toHaveBeenCalledWith('https://b.com');
    expect(sendResponse).toHaveBeenCalledWith({ status: 'received' });
  });
});

// ---- cleanupMiddleClickedTabsForTab ------------------------------------------

describe('cleanupMiddleClickedTabsForTab', () => {
  it('supprime les entrées correspondant au tabId donné', () => {
    middleClickedTabs.set('https://a.com', 10);
    middleClickedTabs.set('https://b.com', 20);
    middleClickedTabs.set('https://c.com', 10);

    cleanupMiddleClickedTabsForTab(10);

    expect(middleClickedTabs.has('https://a.com')).toBe(false);
    expect(middleClickedTabs.has('https://c.com')).toBe(false);
    expect(middleClickedTabs.has('https://b.com')).toBe(true);
  });

  it('ne fait rien si aucune entrée ne correspond au tabId', () => {
    middleClickedTabs.set('https://a.com', 10);
    cleanupMiddleClickedTabsForTab(99);
    expect(middleClickedTabs.size).toBe(1);
  });
});

// ---- promptForGroupName ------------------------------------------------------

describe('promptForGroupName', () => {
  it('retourne le nom trimé quand la réponse est valide', async () => {
    mockedSendMessage.mockResolvedValueOnce({ name: '  Mon groupe  ' });
    const result = await promptForGroupName('Default', 5);
    expect(result).toBe('Mon groupe');
  });

  it('retourne null quand la réponse name est vide ou absent', async () => {
    mockedSendMessage.mockResolvedValueOnce({ name: '   ' });
    expect(await promptForGroupName('Default', 5)).toBeNull();

    mockedSendMessage.mockResolvedValueOnce({});
    expect(await promptForGroupName('Default', 5)).toBeNull();
  });

  it('retourne null et ne lève pas d\'erreur si sendMessage rejette', async () => {
    mockedSendMessage.mockRejectedValueOnce(new Error('Tab gone'));
    const result = await promptForGroupName('Default', 5);
    expect(result).toBeNull();
  });
});

// ---- findMiddleClickOpener ---------------------------------------------------

describe('findMiddleClickOpener', () => {
  it('retourne null quand openerTabId est absent', () => {
    const tab = { id: 1, url: 'https://example.com' } as any;
    expect(findMiddleClickOpener(tab)).toBeNull();
  });

  it('retourne l\'openerTabId via correspondance directe et nettoie la Map', () => {
    middleClickedTabs.set('https://example.com', 10);
    const tab = { id: 1, url: 'https://example.com', openerTabId: 10 } as any;

    const result = findMiddleClickOpener(tab);

    expect(result).toBe(10);
    expect(middleClickedTabs.has('https://example.com')).toBe(false);
  });

  it('retourne l\'openerTabId via la recherche de secours quand l\'URL ne correspond pas directement', () => {
    middleClickedTabs.set('https://other-url.com', 10);
    const tab = { id: 1, url: 'https://example.com', openerTabId: 10 } as any;

    const result = findMiddleClickOpener(tab);

    expect(result).toBe(10);
    expect(middleClickedTabs.has('https://other-url.com')).toBe(false);
  });

  it('retourne null si aucune entrée ne correspond à l\'openerTabId', () => {
    middleClickedTabs.set('https://other.com', 99);
    const tab = { id: 1, url: 'https://example.com', openerTabId: 10 } as any;

    expect(findMiddleClickOpener(tab)).toBeNull();
  });

  it('utilise pendingUrl en priorité sur url pour la correspondance directe', () => {
    middleClickedTabs.set('https://pending.com', 10);
    const tab = { id: 1, pendingUrl: 'https://pending.com', url: 'about:blank', openerTabId: 10 } as any;

    const result = findMiddleClickOpener(tab);

    expect(result).toBe(10);
    expect(middleClickedTabs.has('https://pending.com')).toBe(false);
  });
});
