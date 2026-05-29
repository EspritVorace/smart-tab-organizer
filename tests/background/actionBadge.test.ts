import { describe, it, expect, beforeEach, vi } from 'vitest';

type AnyFn = (...args: any[]) => any;

const hoisted = vi.hoisted(() => ({
  setBadgeText: vi.fn(async () => undefined),
  setBadgeBackgroundColor: vi.fn(async () => undefined),
  workspaceWatchers: [] as Array<(next: string) => void>,
}));

vi.mock('wxt/browser', () => ({
  browser: {
    action: {
      setBadgeText: hoisted.setBadgeText,
      setBadgeBackgroundColor: hoisted.setBadgeBackgroundColor,
    },
  },
}));

const settingsState = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
};

const fieldWatchers: Partial<Record<string, AnyFn>> = {};

vi.mock('@/utils/settingsUtils.js', () => ({
  getSettings: vi.fn(async () => ({ ...settingsState })),
  watchSettingsField: vi.fn((field: string, cb: AnyFn) => {
    fieldWatchers[field] = cb;
    return () => {
      if (fieldWatchers[field] === cb) delete fieldWatchers[field];
    };
  }),
}));

vi.mock('@/utils/workspaceContext.js', () => ({
  initWorkspaceContext: vi.fn(async () => undefined),
}));

vi.mock('@/utils/workspaceStorage.js', () => ({
  activeWorkspaceIdItem: {
    watch: (cb: (next: string) => void) => {
      hoisted.workspaceWatchers.push(cb);
      return () => {
        const i = hoisted.workspaceWatchers.indexOf(cb);
        if (i !== -1) hoisted.workspaceWatchers.splice(i, 1);
      };
    },
  },
}));

import {
  computeBadge,
  applyActionBadge,
  updateActionBadge,
  setupActionBadge,
} from '../../src/background/actionBadge';
import { watchSettingsField } from '@/utils/settingsUtils.js';

const mockedWatchSettingsField = watchSettingsField as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(fieldWatchers).forEach(k => { delete fieldWatchers[k]; });
  hoisted.workspaceWatchers.length = 0;
  settingsState.globalGroupingEnabled = true;
  settingsState.globalDeduplicationEnabled = true;
});

describe('computeBadge', () => {
  it('returns empty badge when both features are active', () => {
    expect(computeBadge(true, true)).toEqual({ text: '', color: '#00000000' });
  });

  it('returns orange G when grouping is inactive and dedup active', () => {
    expect(computeBadge(false, true)).toEqual({ text: 'G', color: '#F76B15' });
  });

  it('returns orange D when dedup is inactive and grouping active', () => {
    expect(computeBadge(true, false)).toEqual({ text: 'D', color: '#F76B15' });
  });

  it('returns red X when both features are inactive', () => {
    expect(computeBadge(false, false)).toEqual({ text: 'X', color: '#E5484D' });
  });
});

describe('applyActionBadge', () => {
  it('calls setBadgeText and setBadgeBackgroundColor for a non-empty badge', async () => {
    await applyActionBadge({ text: 'G', color: '#F76B15' });
    expect(hoisted.setBadgeText).toHaveBeenCalledWith({ text: 'G' });
    expect(hoisted.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#F76B15' });
  });

  it('clears the badge text but skips color when text is empty', async () => {
    await applyActionBadge({ text: '', color: '#00000000' });
    expect(hoisted.setBadgeText).toHaveBeenCalledWith({ text: '' });
    expect(hoisted.setBadgeBackgroundColor).not.toHaveBeenCalled();
  });

  it('swallows errors from the underlying API', async () => {
    hoisted.setBadgeText.mockRejectedValueOnce(new Error('boom'));
    await expect(applyActionBadge({ text: 'X', color: '#E5484D' })).resolves.toBeUndefined();
  });
});

describe('updateActionBadge', () => {
  it('reads settings and applies the matching badge', async () => {
    settingsState.globalGroupingEnabled = false;
    settingsState.globalDeduplicationEnabled = true;

    await updateActionBadge();

    expect(hoisted.setBadgeText).toHaveBeenCalledWith({ text: 'G' });
    expect(hoisted.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#F76B15' });
  });

  it('applies the red X badge when both flags are off', async () => {
    settingsState.globalGroupingEnabled = false;
    settingsState.globalDeduplicationEnabled = false;

    await updateActionBadge();

    expect(hoisted.setBadgeText).toHaveBeenCalledWith({ text: 'X' });
    expect(hoisted.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#E5484D' });
  });
});

describe('setupActionBadge', () => {
  it('renders the initial badge from persisted settings', async () => {
    settingsState.globalGroupingEnabled = true;
    settingsState.globalDeduplicationEnabled = false;

    await setupActionBadge();

    expect(hoisted.setBadgeText).toHaveBeenCalledWith({ text: 'D' });
  });

  it('subscribes to both grouping and dedup settings', async () => {
    await setupActionBadge();
    expect(mockedWatchSettingsField).toHaveBeenCalledWith('globalGroupingEnabled', expect.any(Function));
    expect(mockedWatchSettingsField).toHaveBeenCalledWith('globalDeduplicationEnabled', expect.any(Function));
  });

  it('updates the badge when grouping is toggled off', async () => {
    await setupActionBadge();
    hoisted.setBadgeText.mockClear();

    settingsState.globalGroupingEnabled = false;
    await fieldWatchers.globalGroupingEnabled?.(false);
    // updateActionBadge is async; flush microtasks
    await Promise.resolve();
    await Promise.resolve();

    expect(hoisted.setBadgeText).toHaveBeenCalledWith({ text: 'G' });
  });

  it('updates the badge when deduplication is toggled off', async () => {
    await setupActionBadge();
    hoisted.setBadgeText.mockClear();

    settingsState.globalDeduplicationEnabled = false;
    await fieldWatchers.globalDeduplicationEnabled?.(false);
    await Promise.resolve();
    await Promise.resolve();

    expect(hoisted.setBadgeText).toHaveBeenCalledWith({ text: 'D' });
  });

  it('re-subscribes to settings and re-renders when the active workspace changes', async () => {
    await setupActionBadge();
    const initialCalls = mockedWatchSettingsField.mock.calls.length;
    hoisted.setBadgeText.mockClear();

    settingsState.globalGroupingEnabled = false;
    settingsState.globalDeduplicationEnabled = false;
    hoisted.workspaceWatchers[0]?.('another-ws');
    await Promise.resolve();
    await Promise.resolve();

    // Two new subscriptions (grouping + dedup) plus a badge refresh.
    expect(mockedWatchSettingsField.mock.calls.length).toBe(initialCalls + 2);
    expect(hoisted.setBadgeText).toHaveBeenCalledWith({ text: 'X' });
  });

  it('teardown removes the workspace watcher and settings watchers', async () => {
    const teardown = await setupActionBadge();
    expect(hoisted.workspaceWatchers).toHaveLength(1);
    expect(fieldWatchers.globalGroupingEnabled).toBeDefined();
    expect(fieldWatchers.globalDeduplicationEnabled).toBeDefined();

    teardown();

    expect(hoisted.workspaceWatchers).toHaveLength(0);
    expect(fieldWatchers.globalGroupingEnabled).toBeUndefined();
    expect(fieldWatchers.globalDeduplicationEnabled).toBeUndefined();
  });
});

describe('applyActionBadge — Firefox MV2 fallback', () => {
  it('falls back to browser.browserAction when browser.action is absent', async () => {
    vi.resetModules();
    const browserActionSetText = vi.fn(async () => undefined);
    const browserActionSetColor = vi.fn(async () => undefined);
    vi.doMock('wxt/browser', () => ({
      browser: {
        browserAction: {
          setBadgeText: browserActionSetText,
          setBadgeBackgroundColor: browserActionSetColor,
        },
      },
    }));
    const mod = await import('../../src/background/actionBadge');
    await mod.applyActionBadge({ text: 'G', color: '#F76B15' });
    expect(browserActionSetText).toHaveBeenCalledWith({ text: 'G' });
    expect(browserActionSetColor).toHaveBeenCalledWith({ color: '#F76B15' });
  });

  it('no-ops when neither browser.action nor browser.browserAction is available', async () => {
    vi.resetModules();
    vi.doMock('wxt/browser', () => ({ browser: {} }));
    const mod = await import('../../src/background/actionBadge');
    await expect(mod.applyActionBadge({ text: 'X', color: '#E5484D' })).resolves.toBeUndefined();
  });
});
