import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';

vi.mock('../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

beforeEach(() => {
  fakeBrowser.reset();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('workspaceContext', () => {
  it('defaults to DEFAULT_WORKSPACE_ID before init', async () => {
    const { getActiveWsIdSync, _resetWorkspaceContextForTests } = await import(
      '../../src/utils/workspaceContext'
    );
    const { DEFAULT_WORKSPACE_ID, _resetWorkspaceItemsCacheForTests } = await import(
      '../../src/utils/workspaceStorage'
    );
    _resetWorkspaceContextForTests();
    _resetWorkspaceItemsCacheForTests();

    expect(getActiveWsIdSync()).toBe(DEFAULT_WORKSPACE_ID);
  });

  it('reads the persisted active workspace id during init', async () => {
    await fakeBrowser.storage.local.set({ activeWorkspaceId: 'ws-alpha' });

    const { initWorkspaceContext, getActiveWsIdSync, _resetWorkspaceContextForTests } =
      await import('../../src/utils/workspaceContext');
    _resetWorkspaceContextForTests();

    await initWorkspaceContext();
    expect(getActiveWsIdSync()).toBe('ws-alpha');
  });

  it('only loads once for concurrent init calls', async () => {
    await fakeBrowser.storage.local.set({ activeWorkspaceId: 'ws-beta' });

    const { initWorkspaceContext, _resetWorkspaceContextForTests } = await import(
      '../../src/utils/workspaceContext'
    );
    const { activeWorkspaceIdItem } = await import('../../src/utils/workspaceStorage');
    _resetWorkspaceContextForTests();

    const getValueSpy = vi.spyOn(activeWorkspaceIdItem, 'getValue');
    await Promise.all([initWorkspaceContext(), initWorkspaceContext(), initWorkspaceContext()]);

    expect(getValueSpy).toHaveBeenCalledTimes(1);
  });

  it('reflects later writes via the storage watcher', async () => {
    await fakeBrowser.storage.local.set({ activeWorkspaceId: 'ws-one' });

    const { initWorkspaceContext, getActiveWsIdSync, _resetWorkspaceContextForTests } =
      await import('../../src/utils/workspaceContext');
    _resetWorkspaceContextForTests();

    await initWorkspaceContext();
    expect(getActiveWsIdSync()).toBe('ws-one');

    await fakeBrowser.storage.local.set({ activeWorkspaceId: 'ws-two' });
    expect(getActiveWsIdSync()).toBe('ws-two');
  });

  it('falls back to DEFAULT_WORKSPACE_ID when stored value is null', async () => {
    await fakeBrowser.storage.local.set({ activeWorkspaceId: null });

    const { initWorkspaceContext, getActiveWsIdSync, _resetWorkspaceContextForTests } =
      await import('../../src/utils/workspaceContext');
    const { DEFAULT_WORKSPACE_ID } = await import('../../src/utils/workspaceStorage');
    _resetWorkspaceContextForTests();

    await initWorkspaceContext();
    expect(getActiveWsIdSync()).toBe(DEFAULT_WORKSPACE_ID);
  });

  it('getActiveScopedItems resolves scoped items for current workspace', async () => {
    await fakeBrowser.storage.local.set({ activeWorkspaceId: 'ws-scoped' });

    const { getActiveScopedItems, _resetWorkspaceContextForTests } = await import(
      '../../src/utils/workspaceContext'
    );
    const { _resetWorkspaceItemsCacheForTests } = await import('../../src/utils/workspaceStorage');
    _resetWorkspaceContextForTests();
    _resetWorkspaceItemsCacheForTests();

    const items = await getActiveScopedItems();
    expect(items.domainRulesItem.key).toBe('local:ws:ws-scoped:domainRules');
    expect(items.statisticsItem.key).toBe('local:ws:ws-scoped:statistics');
  });

  it('getActiveScopedItemsSync returns items for the cached workspace id', async () => {
    const { getActiveScopedItemsSync, _resetWorkspaceContextForTests } = await import(
      '../../src/utils/workspaceContext'
    );
    const { _resetWorkspaceItemsCacheForTests } = await import('../../src/utils/workspaceStorage');
    _resetWorkspaceContextForTests();
    _resetWorkspaceItemsCacheForTests();

    const items = getActiveScopedItemsSync();
    expect(items.domainRulesItem.key).toBe('local:domainRules');
  });

  it('falls back to default when load throws an error', async () => {
    const { initWorkspaceContext, getActiveWsIdSync, _resetWorkspaceContextForTests } =
      await import('../../src/utils/workspaceContext');
    const { activeWorkspaceIdItem, DEFAULT_WORKSPACE_ID } = await import(
      '../../src/utils/workspaceStorage'
    );
    _resetWorkspaceContextForTests();

    vi.spyOn(activeWorkspaceIdItem, 'getValue').mockRejectedValue(new Error('storage down'));

    await initWorkspaceContext();
    expect(getActiveWsIdSync()).toBe(DEFAULT_WORKSPACE_ID);
  });
});
