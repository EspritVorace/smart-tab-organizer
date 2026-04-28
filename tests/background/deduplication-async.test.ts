/**
 * Covers the async flow functions in background/deduplication.ts that
 * tests/deduplication.test.ts doesn't exercise:
 *
 *   focusAndReloadTab · removeDuplicateTab · checkAndDeduplicateTab
 *   processTabForDeduplication · startPeriodicCleanup
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { makeRule, makeSettings, type MockedBrowser } from './_helpers';

// ---- Mocks ------------------------------------------------------------------

vi.mock('wxt/browser', async () => ({ browser: (await import('./_helpers')).browserMock() }));

vi.mock('../../src/utils/statisticsUtils.js', () => ({
  incrementStat: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/background/settings.js', () => ({
  getSettings: vi.fn(),
}));

vi.mock('../../src/utils/notifications.js', () => ({
  showNotification: vi.fn(),
}));

vi.mock('../../src/utils/i18n.js', () => ({
  getMessage: vi.fn((k: string) => k),
}));

vi.mock('../../src/utils/deduplicationSkip.js', () => ({
  shouldSkipDeduplication: vi.fn(() => false),
}));

// ---- Imports after mocks ----------------------------------------------------

import {
  focusAndReloadTab,
  removeDuplicateTab,
  checkAndDeduplicateTab,
  processTabForDeduplication,
  startPeriodicCleanup,
  clearProcessedTabsCache,
  markTabAsProcessed,
} from '../../src/background/deduplication';
import { browser } from 'wxt/browser';
import { getSettings } from '../../src/background/settings';
import { showNotification } from '../../src/utils/notifications';
import { shouldSkipDeduplication } from '../../src/utils/deduplicationSkip';
import { incrementStat } from '../../src/utils/statisticsUtils';

// ---- Typed mock accessors ---------------------------------------------------

const mockedBrowser = browser as unknown as MockedBrowser;
const mockedGetSettings = getSettings as ReturnType<typeof vi.fn>;
const mockedShowNotif = showNotification as ReturnType<typeof vi.fn>;
const mockedShouldSkip = shouldSkipDeduplication as ReturnType<typeof vi.fn>;
const mockedIncrementStat = incrementStat as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  clearProcessedTabsCache();
  mockedShouldSkip.mockReturnValue(false);
  mockedBrowser.tabs.update.mockResolvedValue(undefined);
  mockedBrowser.tabs.reload.mockResolvedValue(undefined);
  mockedBrowser.tabs.remove.mockResolvedValue(undefined);
  // Default: current tab is ungrouped. Individual tests override via mockResolvedValueOnce.
  mockedBrowser.tabs.get.mockImplementation((id: number) =>
    Promise.resolve({
      id,
      url: 'https://current.example/',
      title: 'Current',
      windowId: 5,
      index: 0,
      groupId: -1,
    }),
  );
  mockedBrowser.windows.get.mockResolvedValue({ focused: true });
  mockedBrowser.windows.update.mockResolvedValue(undefined);
});

// -----------------------------------------------------------------------------

describe('focusAndReloadTab', () => {
  it('activates the tab and reloads it when the window is already focused', async () => {
    mockedBrowser.windows.get.mockResolvedValue({ focused: true });

    await focusAndReloadTab({ id: 5, windowId: 10 } as any);

    expect(mockedBrowser.tabs.update).toHaveBeenCalledWith(5, { active: true });
    expect(mockedBrowser.windows.update).not.toHaveBeenCalled();
    expect(mockedBrowser.tabs.reload).toHaveBeenCalledWith(5);
  });

  it('focuses the window when it is not the active one', async () => {
    mockedBrowser.windows.get.mockResolvedValue({ focused: false });

    await focusAndReloadTab({ id: 5, windowId: 10 } as any);

    expect(mockedBrowser.windows.update).toHaveBeenCalledWith(10, { focused: true });
  });

  it('silently ignores reload failures', async () => {
    mockedBrowser.tabs.reload.mockRejectedValue(new Error('cannot reload'));

    await expect(
      focusAndReloadTab({ id: 5, windowId: 10 } as any),
    ).resolves.toBeUndefined();

    expect(mockedBrowser.tabs.update).toHaveBeenCalled();
  });

  it('swallows update/window errors with a warning', async () => {
    mockedBrowser.tabs.update.mockRejectedValue(new Error('nope'));

    await expect(
      focusAndReloadTab({ id: 5, windowId: 10 } as any),
    ).resolves.toBeUndefined();

    expect(mockedBrowser.tabs.reload).not.toHaveBeenCalled();
  });
});

describe('removeDuplicateTab', () => {
  it('removes the tab when possible', async () => {
    await removeDuplicateTab(42);
    expect(mockedBrowser.tabs.remove).toHaveBeenCalledWith(42);
  });

  it('swallows errors', async () => {
    mockedBrowser.tabs.remove.mockRejectedValue(new Error('tab gone'));
    await expect(removeDuplicateTab(42)).resolves.toBeUndefined();
  });
});

describe('checkAndDeduplicateTab', () => {
  it('removes the current tab and shows a notification when a duplicate exists', async () => {
    mockedBrowser.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://x.com/a', title: 'Existing', windowId: 5, index: 0, groupId: -1 },
    ]);
    mockedBrowser.tabs.get.mockResolvedValue({
      id: 2,
      url: 'https://x.com/a',
      title: 'New',
      windowId: 5,
      index: 3,
      groupId: -1,
    });

    await checkAndDeduplicateTab(2, 'https://x.com/a', 'exact', 5, makeSettings());

    expect(mockedIncrementStat).toHaveBeenCalledWith('dedup', '__unmatched__');
    expect(mockedBrowser.tabs.update).toHaveBeenCalledWith(1, { active: true });
    expect(mockedBrowser.tabs.remove).toHaveBeenCalledWith(2);
    expect(mockedShowNotif).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'notificationDeduplicationTitle',
        type: 'info',
        undoAction: expect.objectContaining({
          type: 'reopen_tab',
          data: expect.objectContaining({
            url: 'https://x.com/a',
            windowId: 5,
            title: 'New',
            index: 3,
          }),
        }),
      }),
    );
  });

  it('keeps the new tab and closes the existing one when strategy=keep-new', async () => {
    mockedBrowser.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://x.com/a', title: 'Existing', windowId: 5, index: 0, groupId: -1 },
    ]);
    mockedBrowser.tabs.get.mockResolvedValue({
      id: 2,
      url: 'https://x.com/a',
      title: 'New',
      windowId: 5,
      index: 3,
      groupId: -1,
    });

    await checkAndDeduplicateTab(
      2,
      'https://x.com/a',
      'exact',
      5,
      makeSettings({ deduplicationKeepStrategy: 'keep-new' }),
    );

    expect(mockedBrowser.tabs.update).toHaveBeenCalledWith(2, { active: true });
    expect(mockedBrowser.tabs.remove).toHaveBeenCalledWith(1);
    expect(mockedBrowser.tabs.reload).not.toHaveBeenCalled();
  });

  it('keeps the grouped tab when strategy=keep-grouped and only the existing is grouped', async () => {
    mockedBrowser.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://x.com/a', title: 'Existing', windowId: 5, index: 0, groupId: 42 },
    ]);
    mockedBrowser.tabs.get.mockResolvedValue({
      id: 2,
      url: 'https://x.com/a',
      title: 'New',
      windowId: 5,
      index: 3,
      groupId: -1,
    });

    await checkAndDeduplicateTab(
      2,
      'https://x.com/a',
      'exact',
      5,
      makeSettings({ deduplicationKeepStrategy: 'keep-grouped' }),
    );

    expect(mockedBrowser.tabs.remove).toHaveBeenCalledWith(2);
  });

  it('keeps the grouped NEW tab when strategy=keep-grouped and only the new one is grouped', async () => {
    mockedBrowser.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://x.com/a', title: 'Existing', windowId: 5, index: 0, groupId: -1 },
    ]);
    mockedBrowser.tabs.get.mockResolvedValue({
      id: 2,
      url: 'https://x.com/a',
      title: 'New',
      windowId: 5,
      index: 3,
      groupId: 77,
    });

    await checkAndDeduplicateTab(
      2,
      'https://x.com/a',
      'exact',
      5,
      makeSettings({ deduplicationKeepStrategy: 'keep-grouped' }),
    );

    expect(mockedBrowser.tabs.remove).toHaveBeenCalledWith(1);
    expect(mockedShowNotif).toHaveBeenCalledWith(
      expect.objectContaining({
        undoAction: expect.objectContaining({
          data: expect.objectContaining({ groupId: -1 }),
        }),
      }),
    );
  });

  it('captures the closed grouped tab metadata in the undo payload', async () => {
    mockedBrowser.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://x.com/a', title: 'Existing', windowId: 5, index: 2, groupId: 99 },
    ]);
    mockedBrowser.tabs.get.mockResolvedValue({
      id: 2,
      url: 'https://x.com/a',
      title: 'New',
      windowId: 5,
      index: 7,
      groupId: -1,
    });

    await checkAndDeduplicateTab(
      2,
      'https://x.com/a',
      'exact',
      5,
      makeSettings({ deduplicationKeepStrategy: 'keep-new' }),
    );

    expect(mockedShowNotif).toHaveBeenCalledWith(
      expect.objectContaining({
        undoAction: expect.objectContaining({
          data: expect.objectContaining({
            url: 'https://x.com/a',
            groupId: 99,
            title: 'Existing',
            index: 2,
          }),
        }),
      }),
    );
  });

  it('uses the URL as fallback title in the notification when tab.title is empty', async () => {
    const i18n = await import('../../src/utils/i18n');
    vi.mocked(i18n.getMessage).mockImplementation((k: string) =>
      k === 'notificationDeduplicationMessage' ? 'Closed {title}' : k,
    );

    mockedBrowser.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://x.com/a', title: 'Existing', windowId: 5, index: 0, groupId: -1 },
    ]);
    // With the default keep-old strategy, the NEW tab is the one closed, so
    // we clear its title to exercise the URL fallback in the notification.
    mockedBrowser.tabs.get.mockResolvedValue({
      id: 2,
      url: 'https://x.com/a',
      title: '',
      windowId: 5,
      index: 3,
      groupId: -1,
    });

    await checkAndDeduplicateTab(2, 'https://x.com/a', 'exact', 5, makeSettings());

    const call = mockedShowNotif.mock.calls[0][0];
    expect(call.message).toBe('Closed https://x.com/a');
  });

  it('does nothing when no duplicate is found', async () => {
    mockedBrowser.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://x.com/other', windowId: 5 },
    ]);

    await checkAndDeduplicateTab(2, 'https://x.com/a', 'exact', 5, makeSettings());

    expect(mockedBrowser.tabs.remove).not.toHaveBeenCalled();
    expect(mockedIncrementStat).not.toHaveBeenCalled();
    expect(mockedShowNotif).not.toHaveBeenCalled();
  });

  it('does not show a notification when notifyOnDeduplication is false', async () => {
    mockedBrowser.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://x.com/a', title: 'Same', windowId: 5 },
    ]);

    await checkAndDeduplicateTab(
      2,
      'https://x.com/a',
      'exact',
      5,
      makeSettings({ notifyOnDeduplication: false }),
    );

    expect(mockedBrowser.tabs.remove).toHaveBeenCalled();
    expect(mockedShowNotif).not.toHaveBeenCalled();
  });

  it('logs and swallows errors from tabs.query', async () => {
    mockedBrowser.tabs.query.mockRejectedValue(new Error('query fail'));

    await expect(
      checkAndDeduplicateTab(2, 'https://x.com/a', 'exact', 5, makeSettings()),
    ).resolves.toBeUndefined();

    expect(mockedBrowser.tabs.remove).not.toHaveBeenCalled();
  });
});

describe('processTabForDeduplication', () => {
  it('skips chrome:// URLs without touching settings', async () => {
    await processTabForDeduplication(1, 'chrome://settings', 5);
    expect(mockedGetSettings).not.toHaveBeenCalled();
  });

  it('skips URLs flagged by shouldSkipDeduplication (undo)', async () => {
    mockedShouldSkip.mockReturnValue(true);
    await processTabForDeduplication(1, 'https://reopened.com', 5);
    expect(mockedGetSettings).not.toHaveBeenCalled();
  });

  it('skips tabs already processed for the same URL', async () => {
    markTabAsProcessed(1, 'https://x.com/a');
    await processTabForDeduplication(1, 'https://x.com/a', 5);
    expect(mockedGetSettings).not.toHaveBeenCalled();
  });

  it('does nothing when global deduplication is disabled', async () => {
    mockedGetSettings.mockResolvedValue(makeSettings({ globalDeduplicationEnabled: false }));
    await processTabForDeduplication(1, 'https://x.com/a', 5);
    expect(mockedBrowser.tabs.query).not.toHaveBeenCalled();
  });

  it('does nothing when the matching rule has deduplicationEnabled=false', async () => {
    mockedGetSettings.mockResolvedValue(
      makeSettings({ domainRules: [makeRule({ deduplicationEnabled: false })] }),
    );
    await processTabForDeduplication(1, 'https://example.com/x', 5);
    expect(mockedBrowser.tabs.query).not.toHaveBeenCalled();
  });

  it('runs the full pipeline when rule and global are both enabled', async () => {
    mockedGetSettings.mockResolvedValue(
      makeSettings({ domainRules: [makeRule()] }),
    );
    mockedBrowser.tabs.query.mockResolvedValue([
      { id: 9, url: 'https://example.com/x', title: 'T', windowId: 5 },
    ]);

    await processTabForDeduplication(1, 'https://example.com/x', 5);

    expect(mockedBrowser.tabs.remove).toHaveBeenCalledWith(1);
  });

  it('falls back to the global match mode when no rule matches', async () => {
    mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [] }));
    mockedBrowser.tabs.query.mockResolvedValue([]);

    await processTabForDeduplication(1, 'https://no-rule.com/x', 5);

    expect(mockedBrowser.tabs.query).toHaveBeenCalledWith({
      url: '*://*/*',
      windowId: 5,
    });
  });

  it('skips deduplication on unmatched domains when deduplicateUnmatchedDomains=false', async () => {
    mockedGetSettings.mockResolvedValue(
      makeSettings({ domainRules: [], deduplicateUnmatchedDomains: false }),
    );

    await processTabForDeduplication(1, 'https://no-rule.com/x', 5);

    expect(mockedBrowser.tabs.query).not.toHaveBeenCalled();
    expect(mockedBrowser.tabs.remove).not.toHaveBeenCalled();
  });

  it('still deduplicates unmatched domains when deduplicateUnmatchedDomains=true (default)', async () => {
    mockedGetSettings.mockResolvedValue(
      makeSettings({ domainRules: [], deduplicateUnmatchedDomains: true }),
    );
    mockedBrowser.tabs.query.mockResolvedValue([
      { id: 9, url: 'https://no-rule.com/x', title: 'T', windowId: 5 },
    ]);

    await processTabForDeduplication(1, 'https://no-rule.com/x', 5);

    expect(mockedBrowser.tabs.remove).toHaveBeenCalledWith(1);
  });

  it('still deduplicates rule-matched domains when deduplicateUnmatchedDomains=false (rule wins)', async () => {
    mockedGetSettings.mockResolvedValue(
      makeSettings({
        domainRules: [makeRule({ deduplicationEnabled: true })],
        deduplicateUnmatchedDomains: false,
      }),
    );
    mockedBrowser.tabs.query.mockResolvedValue([
      { id: 9, url: 'https://example.com/x', title: 'T', windowId: 5 },
    ]);

    await processTabForDeduplication(1, 'https://example.com/x', 5);

    expect(mockedBrowser.tabs.remove).toHaveBeenCalledWith(1);
  });

  it('catches errors bubbling up from checkAndDeduplicateTab', async () => {
    mockedGetSettings.mockResolvedValue(makeSettings({ domainRules: [makeRule()] }));
    mockedBrowser.tabs.query.mockRejectedValue(new Error('nope'));

    await expect(
      processTabForDeduplication(1, 'https://example.com/x', 5),
    ).resolves.toBeUndefined();
  });
});

describe('startPeriodicCleanup', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('clears the processed-tabs cache on each interval tick', () => {
    markTabAsProcessed(1, 'https://x.com/a');
    startPeriodicCleanup(1000);

    vi.advanceTimersByTime(1000);

    // After cleanup: re-processing the same (tabId, url) reaches getSettings
    mockedGetSettings.mockResolvedValueOnce(
      makeSettings({ globalDeduplicationEnabled: false }),
    );
    const p = processTabForDeduplication(1, 'https://x.com/a', 5);
    return p.then(() => {
      expect(mockedGetSettings).toHaveBeenCalled();
    });
  });

  it('uses a 5-minute default interval when called without arguments', () => {
    const spy = vi.spyOn(globalThis, 'setInterval');
    startPeriodicCleanup();
    expect(spy).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
  });
});
