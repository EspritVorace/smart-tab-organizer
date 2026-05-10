import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---- Mocks (before the imports) ---------------------------------------------

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

// ---- Imports after the mocks ------------------------------------------------

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
  it('records the URL in middleClickedTabs and replies "received" when sender.tab.id is present', () => {
    const sendResponse = vi.fn();
    handleMiddleClickMessage(
      { type: 'MIDDLE_CLICK', url: 'https://example.com' },
      { tab: { id: 42 } } as any,
      sendResponse,
    );

    expect(middleClickedTabs.get('https://example.com')).toBe(42);
    expect(sendResponse).toHaveBeenCalledWith({ status: 'received' });
  });

  it('replies "error" when sender.tab is missing', () => {
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

  it('replies "error" when sender.tab.id is missing', () => {
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
  it('calls markUrlToSkipDeduplication for each URL and replies "received"', () => {
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
  it('removes entries matching the given tabId', () => {
    middleClickedTabs.set('https://a.com', 10);
    middleClickedTabs.set('https://b.com', 20);
    middleClickedTabs.set('https://c.com', 10);

    cleanupMiddleClickedTabsForTab(10);

    expect(middleClickedTabs.has('https://a.com')).toBe(false);
    expect(middleClickedTabs.has('https://c.com')).toBe(false);
    expect(middleClickedTabs.has('https://b.com')).toBe(true);
  });

  it('does nothing when no entry matches the tabId', () => {
    middleClickedTabs.set('https://a.com', 10);
    cleanupMiddleClickedTabsForTab(99);
    expect(middleClickedTabs.size).toBe(1);
  });
});

// ---- promptForGroupName ------------------------------------------------------

describe('promptForGroupName', () => {
  it('returns the trimmed name when the response is valid', async () => {
    mockedSendMessage.mockResolvedValueOnce({ name: '  My group  ' });
    const result = await promptForGroupName('Default', 5);
    expect(result).toBe('My group');
  });

  it('returns null when the response name is empty or missing', async () => {
    mockedSendMessage.mockResolvedValueOnce({ name: '   ' });
    expect(await promptForGroupName('Default', 5)).toBeNull();

    mockedSendMessage.mockResolvedValueOnce({});
    expect(await promptForGroupName('Default', 5)).toBeNull();
  });

  it('returns null and does not throw when sendMessage rejects', async () => {
    mockedSendMessage.mockRejectedValueOnce(new Error('Tab gone'));
    const result = await promptForGroupName('Default', 5);
    expect(result).toBeNull();
  });
});

// ---- findMiddleClickOpener ---------------------------------------------------

describe('findMiddleClickOpener', () => {
  it('returns null when openerTabId is missing', () => {
    const tab = { id: 1, url: 'https://example.com' } as any;
    expect(findMiddleClickOpener(tab)).toBeNull();
  });

  it('returns the openerTabId via direct lookup and clears the Map entry', () => {
    middleClickedTabs.set('https://example.com', 10);
    const tab = { id: 1, url: 'https://example.com', openerTabId: 10 } as any;

    const result = findMiddleClickOpener(tab);

    expect(result).toBe(10);
    expect(middleClickedTabs.has('https://example.com')).toBe(false);
  });

  it('returns the openerTabId via the fallback lookup when the URL does not match directly', () => {
    middleClickedTabs.set('https://other-url.com', 10);
    const tab = { id: 1, url: 'https://example.com', openerTabId: 10 } as any;

    const result = findMiddleClickOpener(tab);

    expect(result).toBe(10);
    expect(middleClickedTabs.has('https://other-url.com')).toBe(false);
  });

  it('returns null when no entry matches the openerTabId', () => {
    middleClickedTabs.set('https://other.com', 99);
    const tab = { id: 1, url: 'https://example.com', openerTabId: 10 } as any;

    expect(findMiddleClickOpener(tab)).toBeNull();
  });

  it('prefers pendingUrl over url for the direct lookup', () => {
    middleClickedTabs.set('https://pending.com', 10);
    const tab = { id: 1, pendingUrl: 'https://pending.com', url: 'about:blank', openerTabId: 10 } as any;

    const result = findMiddleClickOpener(tab);

    expect(result).toBe(10);
    expect(middleClickedTabs.has('https://pending.com')).toBe(false);
  });
});
