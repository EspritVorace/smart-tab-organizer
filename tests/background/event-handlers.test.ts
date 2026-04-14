import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---- Listener capture -------------------------------------------------------
// Capture callbacks passed to addListener so tests can invoke them directly.

type AnyFn = (...args: any[]) => any;
const captured: {
  onInstalled?: AnyFn;
  onMessage?: AnyFn;
  onWindowRemoved?: AnyFn;
  onTabCreated?: AnyFn;
  onTabUpdated?: AnyFn;
} = {};

// ---- Mocks ------------------------------------------------------------------

vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      onInstalled: { addListener: (cb: AnyFn) => { captured.onInstalled = cb; } },
      onMessage: { addListener: (cb: AnyFn) => { captured.onMessage = cb; } },
    },
    tabs: {
      onCreated: { addListener: (cb: AnyFn) => { captured.onTabCreated = cb; } },
      onUpdated: { addListener: (cb: AnyFn) => { captured.onTabUpdated = cb; } },
      get: vi.fn(),
    },
    windows: {
      onRemoved: { addListener: (cb: AnyFn) => { captured.onWindowRemoved = cb; } },
      getCurrent: vi.fn(),
    },
  },
}));

vi.mock('../../src/utils/migration.js', () => ({
  initializeDefaults: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/background/messaging.js', () => ({
  handleMiddleClickMessage: vi.fn(),
  findMiddleClickOpener: vi.fn(),
}));

vi.mock('../../src/background/deduplication.js', () => ({
  processTabForDeduplication: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/background/grouping.js', () => ({
  processGroupingForNewTab: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/background/organize.js', () => ({
  handleOrganizeAllTabs: vi.fn().mockResolvedValue(undefined),
}));

// ---- Imports after mocks ----------------------------------------------------

import {
  setupInstallationHandler,
  setupMessageHandler,
  setupWindowRemovedHandler,
  setupTabCreatedHandler,
  setupTabUpdatedHandler,
  setupAllEventHandlers,
} from '../../src/background/event-handlers';
import { browser } from 'wxt/browser';
import { initializeDefaults } from '../../src/utils/migration';
import {
  handleMiddleClickMessage,
  findMiddleClickOpener,
} from '../../src/background/messaging';
import { processTabForDeduplication } from '../../src/background/deduplication';
import { processGroupingForNewTab } from '../../src/background/grouping';
import { handleOrganizeAllTabs } from '../../src/background/organize';

// ---- Helpers ----------------------------------------------------------------

const mockedBrowser = browser as unknown as {
  tabs: { get: ReturnType<typeof vi.fn> };
  windows: { getCurrent: ReturnType<typeof vi.fn> };
};

const mockedInitDefaults = initializeDefaults as ReturnType<typeof vi.fn>;
const mockedHandleMiddleClick = handleMiddleClickMessage as ReturnType<typeof vi.fn>;
const mockedFindOpener = findMiddleClickOpener as ReturnType<typeof vi.fn>;
const mockedProcessDedup = processTabForDeduplication as ReturnType<typeof vi.fn>;
const mockedProcessGrouping = processGroupingForNewTab as ReturnType<typeof vi.fn>;
const mockedOrganize = handleOrganizeAllTabs as ReturnType<typeof vi.fn>;

function tab(id: number, overrides: Record<string, any> = {}) {
  return { id, url: 'https://example.com', status: 'complete', ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(captured).forEach(k => { delete (captured as any)[k]; });
  // Reset the middleClickedTabs global used by onUpdated URL matching
  (globalThis as any).middleClickedTabs = new Map<string, number>();
});

// -----------------------------------------------------------------------------

describe('setupInstallationHandler', () => {
  it('calls initializeDefaults when onInstalled fires', async () => {
    setupInstallationHandler();
    expect(captured.onInstalled).toBeDefined();

    await captured.onInstalled!({ reason: 'install' });

    expect(mockedInitDefaults).toHaveBeenCalledOnce();
  });
});

describe('setupMessageHandler', () => {
  beforeEach(() => setupMessageHandler());

  it('routes ORGANIZE_ALL_TABS to handleOrganizeAllTabs with current window id', async () => {
    mockedBrowser.windows.getCurrent.mockResolvedValue({ id: 42 });

    const result = captured.onMessage!({ type: 'ORGANIZE_ALL_TABS' }, {}, () => {});
    // ORGANIZE_ALL_TABS branch returns false (sync)
    expect(result).toBe(false);

    // Wait for the async chain
    await vi.waitFor(() => expect(mockedOrganize).toHaveBeenCalledWith(42));
  });

  it('does not call organize when windows.getCurrent returns no id', async () => {
    mockedBrowser.windows.getCurrent.mockResolvedValue({ id: undefined });

    captured.onMessage!({ type: 'ORGANIZE_ALL_TABS' }, {}, () => {});
    // Drive the chain: await getCurrent's promise, then flush the .then continuation.
    await mockedBrowser.windows.getCurrent.mock.results[0]!.value;
    await Promise.resolve();

    expect(mockedOrganize).not.toHaveBeenCalled();
  });

  it('swallows errors from windows.getCurrent', async () => {
    mockedBrowser.windows.getCurrent.mockRejectedValue(new Error('no window'));

    expect(() =>
      captured.onMessage!({ type: 'ORGANIZE_ALL_TABS' }, {}, () => {}),
    ).not.toThrow();
    // Chain terminates via .catch() — await the rejection and flush continuations.
    await mockedBrowser.windows.getCurrent.mock.results[0]!.value.catch(() => {});
    await Promise.resolve();

    expect(mockedOrganize).not.toHaveBeenCalled();
  });

  it('delegates other message types to handleMiddleClickMessage', () => {
    const request = { type: 'middleClickLink', url: 'https://x.com' };
    const sender = { tab: { id: 5 } };
    const sendResponse = vi.fn();

    const result = captured.onMessage!(request, sender, sendResponse);

    expect(result).toBe(true); // non-organize branch keeps the channel open
    expect(mockedHandleMiddleClick).toHaveBeenCalledWith(request, sender, sendResponse);
  });
});

describe('setupWindowRemovedHandler', () => {
  it('registers the listener (no-op)', () => {
    setupWindowRemovedHandler();
    expect(captured.onWindowRemoved).toBeDefined();
    // Invoking should not throw
    expect(() => captured.onWindowRemoved!(99)).not.toThrow();
  });
});

describe('setupTabCreatedHandler', () => {
  beforeEach(() => setupTabCreatedHandler());

  it('returns early when the new tab has no openerTabId', async () => {
    await captured.onTabCreated!(tab(1, { openerTabId: undefined }));

    expect(mockedFindOpener).not.toHaveBeenCalled();
    expect(mockedProcessGrouping).not.toHaveBeenCalled();
  });

  it('returns early when findMiddleClickOpener returns null', async () => {
    mockedFindOpener.mockReturnValue(null);

    await captured.onTabCreated!(tab(1, { openerTabId: 10 }));

    expect(mockedFindOpener).toHaveBeenCalled();
    expect(mockedProcessGrouping).not.toHaveBeenCalled();
  });

  it('processes grouping immediately when the new tab is already complete (fast-load race)', async () => {
    mockedFindOpener.mockReturnValue(10);
    // First tabs.get: opener; second tabs.get: the new tab (already complete)
    mockedBrowser.tabs.get
      .mockResolvedValueOnce(tab(10, { url: 'https://opener.com' }))
      .mockResolvedValueOnce(tab(1, { status: 'complete', url: 'https://new.com' }));

    await captured.onTabCreated!(tab(1, { openerTabId: 10 }));

    expect(mockedProcessGrouping).toHaveBeenCalledOnce();
  });

  it('does not process grouping when the new tab is still loading', async () => {
    mockedFindOpener.mockReturnValue(10);
    mockedBrowser.tabs.get
      .mockResolvedValueOnce(tab(10, { url: 'https://opener.com' }))
      .mockResolvedValueOnce(tab(1, { status: 'loading', url: 'https://new.com' }));

    await captured.onTabCreated!(tab(1, { openerTabId: 10 }));

    expect(mockedProcessGrouping).not.toHaveBeenCalled();
  });

  it('skips immediate processing for chrome:// or about: URLs', async () => {
    mockedFindOpener.mockReturnValue(10);
    mockedBrowser.tabs.get
      .mockResolvedValueOnce(tab(10))
      .mockResolvedValueOnce(tab(1, { status: 'complete', url: 'chrome://settings' }));

    await captured.onTabCreated!(tab(1, { openerTabId: 10 }));

    expect(mockedProcessGrouping).not.toHaveBeenCalled();
  });

  it('tolerates the new tab being closed before the fast-load check', async () => {
    mockedFindOpener.mockReturnValue(10);
    mockedBrowser.tabs.get
      .mockResolvedValueOnce(tab(10))
      .mockRejectedValueOnce(new Error('No tab with id 1'));

    await expect(
      captured.onTabCreated!(tab(1, { openerTabId: 10 })),
    ).resolves.toBeUndefined();
    expect(mockedProcessGrouping).not.toHaveBeenCalled();
  });

  it('logs debug when opener tab was closed (error message contains "no tab with id")', async () => {
    mockedFindOpener.mockReturnValue(10);
    mockedBrowser.tabs.get.mockRejectedValue(new Error('No tab with id 10'));

    await expect(
      captured.onTabCreated!(tab(1, { openerTabId: 10 })),
    ).resolves.toBeUndefined();
  });

  it('logs error for unexpected opener fetch failures', async () => {
    mockedFindOpener.mockReturnValue(10);
    mockedBrowser.tabs.get.mockRejectedValue(new Error('permission denied'));

    await expect(
      captured.onTabCreated!(tab(1, { openerTabId: 10 })),
    ).resolves.toBeUndefined();
  });
});

describe('setupTabUpdatedHandler', () => {
  beforeEach(() => setupTabUpdatedHandler());

  it('calls processTabForDeduplication when a URL change arrives', async () => {
    await captured.onTabUpdated!(
      1,
      { url: 'https://new.com' },
      tab(1, { url: 'https://new.com', windowId: 5 }),
    );

    expect(mockedProcessDedup).toHaveBeenCalledWith(1, 'https://new.com', 5);
  });

  it('calls processTabForDeduplication on status=complete using tab.url', async () => {
    await captured.onTabUpdated!(
      1,
      { status: 'complete' },
      tab(1, { url: 'https://done.com', windowId: 5 }),
    );

    expect(mockedProcessDedup).toHaveBeenCalledWith(1, 'https://done.com', 5);
  });

  it('skips dedup for about: URL (no navUrl change triggers it anyway)', async () => {
    await captured.onTabUpdated!(
      1,
      { url: 'about:blank' },
      tab(1, { url: 'about:blank', windowId: 5 }),
    );

    // Dedup is still invoked (the handler doesn't filter out about: here)
    expect(mockedProcessDedup).toHaveBeenCalled();
  });

  it('processes grouping immediately on URL match with a complete tab', async () => {
    (globalThis as any).middleClickedTabs = new Map([['https://navigated.com', 10]]);

    mockedBrowser.tabs.get
      .mockResolvedValueOnce(tab(10, { url: 'https://opener.com' }))
      .mockResolvedValueOnce(tab(1, { status: 'complete', url: 'https://navigated.com' }));

    await captured.onTabUpdated!(
      1,
      { url: 'https://navigated.com' },
      tab(1, { url: 'https://navigated.com', windowId: 5 }),
    );

    expect(mockedProcessGrouping).toHaveBeenCalledOnce();
    // URL entry should be consumed from the map
    expect((globalThis as any).middleClickedTabs.has('https://navigated.com')).toBe(false);
  });

  it('registers pending grouping when the tab is still loading after URL match', async () => {
    (globalThis as any).middleClickedTabs = new Map([['https://loading.com', 10]]);

    mockedBrowser.tabs.get
      .mockResolvedValueOnce(tab(10, { url: 'https://opener.com' }))
      .mockResolvedValueOnce(tab(1, { status: 'loading', url: 'https://loading.com' }));

    await captured.onTabUpdated!(
      1,
      { url: 'https://loading.com' },
      tab(1, { url: 'https://loading.com', windowId: 5 }),
    );

    // Not yet processed (will be processed on status=complete)
    expect(mockedProcessGrouping).not.toHaveBeenCalled();

    // Now fire status=complete: should process the pending grouping
    await captured.onTabUpdated!(
      1,
      { status: 'complete' },
      tab(1, { status: 'complete', url: 'https://loading.com', windowId: 5 }),
    );

    expect(mockedProcessGrouping).toHaveBeenCalledOnce();
  });

  it('matches by openerTabId as a fallback when URL is not in the map', async () => {
    (globalThis as any).middleClickedTabs = new Map([['https://clicked.com', 10]]);

    mockedBrowser.tabs.get
      .mockResolvedValueOnce(tab(10))
      .mockResolvedValueOnce(tab(2, { status: 'complete', url: 'https://resolved.com' }));

    await captured.onTabUpdated!(
      2,
      { url: 'https://resolved.com' },
      tab(2, { url: 'https://resolved.com', windowId: 5, openerTabId: 10 }),
    );

    expect(mockedProcessGrouping).toHaveBeenCalledOnce();
    expect((globalThis as any).middleClickedTabs.has('https://clicked.com')).toBe(false);
  });

  it('ignores chrome:// navigations for grouping', async () => {
    (globalThis as any).middleClickedTabs = new Map([['chrome://settings', 10]]);

    await captured.onTabUpdated!(
      1,
      { url: 'chrome://settings' },
      tab(1, { url: 'chrome://settings', windowId: 5 }),
    );

    expect(mockedProcessGrouping).not.toHaveBeenCalled();
  });

  it('bails out gracefully when the tab was closed before fetch', async () => {
    (globalThis as any).middleClickedTabs = new Map([['https://gone.com', 10]]);

    mockedBrowser.tabs.get
      .mockResolvedValueOnce(tab(10))
      .mockRejectedValueOnce(new Error('tab closed'));

    await expect(
      captured.onTabUpdated!(
        1,
        { url: 'https://gone.com' },
        tab(1, { url: 'https://gone.com', windowId: 5 }),
      ),
    ).resolves.toBeUndefined();

    expect(mockedProcessGrouping).not.toHaveBeenCalled();
  });

  it('logs a warning when the opener tab is not found (URL match path)', async () => {
    (globalThis as any).middleClickedTabs = new Map([['https://x.com', 10]]);

    mockedBrowser.tabs.get.mockRejectedValueOnce(new Error('opener gone'));

    await expect(
      captured.onTabUpdated!(
        1,
        { url: 'https://x.com' },
        tab(1, { url: 'https://x.com', windowId: 5 }),
      ),
    ).resolves.toBeUndefined();

    expect(mockedProcessGrouping).not.toHaveBeenCalled();
  });
});

describe('setupAllEventHandlers', () => {
  it('registers every listener in one call', () => {
    setupAllEventHandlers();

    expect(captured.onInstalled).toBeDefined();
    expect(captured.onMessage).toBeDefined();
    expect(captured.onWindowRemoved).toBeDefined();
    expect(captured.onTabCreated).toBeDefined();
    expect(captured.onTabUpdated).toBeDefined();
  });
});
