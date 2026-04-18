import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  showNotification,
  showSuccessNotification,
  showErrorNotification,
  initNotificationListeners,
  executeNotificationUndoById,
} from '../src/utils/notifications';
import * as dedupSkip from '../src/utils/deduplicationSkip';

// tabs.ungroup is used by the "undo grouping" flow but is NOT implemented by
// fake-browser — attach a stub so we can assert on it.
const mockTabsUngroup = vi.fn();
(fakeBrowser.tabs as any).ungroup = mockTabsUngroup;

// tabs.group and tabGroups.get are used by the undo "reopen_tab" flow to
// restore a tab's group membership. Fake-browser does not ship them.
const mockTabsGroup = vi.fn();
const mockTabGroupsGet = vi.fn();
(fakeBrowser.tabs as any).group = mockTabsGroup;
(fakeBrowser as any).tabGroups = { get: mockTabGroupsGet };

beforeEach(() => {
  fakeBrowser.reset();
  mockTabsUngroup.mockReset();
  mockTabsUngroup.mockResolvedValue(undefined);
  mockTabsGroup.mockReset();
  mockTabsGroup.mockResolvedValue(undefined);
  mockTabGroupsGet.mockReset();
  mockTabGroupsGet.mockResolvedValue({ id: 1 });
  // Reattach after reset.
  (fakeBrowser.tabs as any).ungroup = mockTabsUngroup;
  (fakeBrowser.tabs as any).group = mockTabsGroup;
  (fakeBrowser as any).tabGroups = { get: mockTabGroupsGet };
});

afterEach(() => {
  vi.useRealTimers();
});

describe('showNotification', () => {
  it('creates a native notification with the extension icon, title and message', async () => {
    const id = await showNotification({ title: 'Hello', message: 'World' });

    expect(id).toMatch(/^smarttab-\d+/);
    const all = await fakeBrowser.notifications.getAll();
    const stored = (all as Record<string, any>)[id];
    expect(stored).toBeDefined();
    expect(stored.title).toBe('Hello');
    expect(stored.message).toBe('World');
    expect(stored.iconUrl).toContain('/icons/icon128.png');
    expect(stored.buttons).toBeUndefined();
  });

  it('adds an undo button when an undoAction is provided', async () => {
    const id = await showNotification({
      title: 'Grouped',
      message: 'Tabs grouped',
      undoAction: { type: 'ungroup', data: { tabIds: [1, 2] } },
    });
    const all = await fakeBrowser.notifications.getAll();
    const stored = (all as Record<string, any>)[id];
    expect(stored.buttons).toHaveLength(1);
    expect(stored.buttons[0].title).toBeTruthy();
  });

  it('auto-clears the notification after 5 seconds', async () => {
    vi.useFakeTimers();
    // Freeze system time so Date.now()-based IDs are deterministic.
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const id = await showNotification({
      title: 'Temp',
      message: 'Will vanish',
      undoAction: { type: 'ungroup', data: { tabIds: [1] } },
    });

    // Before the timeout, the notification exists and the undo is pending.
    let all = await fakeBrowser.notifications.getAll();
    expect((all as Record<string, any>)[id]).toBeDefined();

    await vi.advanceTimersByTimeAsync(5000);

    // After the timeout, the notification is cleared and the undo is gone.
    all = await fakeBrowser.notifications.getAll();
    expect((all as Record<string, any>)[id]).toBeUndefined();
    const wasExecuted = await executeNotificationUndoById(id);
    expect(wasExecuted).toBe(false);
  });
});

describe('showSuccessNotification / showErrorNotification', () => {
  it('showSuccessNotification forwards title and message', async () => {
    const id = await showSuccessNotification('Success!', 'It worked');
    const all = (await fakeBrowser.notifications.getAll()) as Record<string, any>;
    expect(all[id].title).toBe('Success!');
    expect(all[id].message).toBe('It worked');
  });

  it('showErrorNotification forwards title and message', async () => {
    const id = await showErrorNotification('Error!', 'It failed');
    const all = (await fakeBrowser.notifications.getAll()) as Record<string, any>;
    expect(all[id].title).toBe('Error!');
    expect(all[id].message).toBe('It failed');
  });
});

describe('executeNotificationUndoById', () => {
  it('returns false for an unknown notification ID', async () => {
    const result = await executeNotificationUndoById('nope');
    expect(result).toBe(false);
    expect(mockTabsUngroup).not.toHaveBeenCalled();
  });

  it('executes an ungroup undo action and clears the notification', async () => {
    const id = await showNotification({
      title: 'Grouped',
      message: 'Tabs grouped',
      undoAction: { type: 'ungroup', data: { tabIds: [10, 11, 12] } },
    });

    const result = await executeNotificationUndoById(id);

    expect(result).toBe(true);
    expect(mockTabsUngroup).toHaveBeenCalledExactlyOnceWith([10, 11, 12]);

    const all = (await fakeBrowser.notifications.getAll()) as Record<string, any>;
    expect(all[id]).toBeUndefined();
  });

  it('does nothing for an ungroup action with an empty tabIds list', async () => {
    const id = await showNotification({
      title: 'Grouped',
      message: 'No tabs',
      undoAction: { type: 'ungroup', data: { tabIds: [] } },
    });

    const result = await executeNotificationUndoById(id);

    expect(result).toBe(true); // still marks as executed (code path ran)
    expect(mockTabsUngroup).not.toHaveBeenCalled();
  });

  it('executes a reopen_tab undo action and marks URL to skip deduplication', async () => {
    await fakeBrowser.windows.create({ focused: true });
    const markSpy = vi.spyOn(dedupSkip, 'markUrlToSkipDeduplication');

    const id = await showNotification({
      title: 'Deduped',
      message: 'Tab closed',
      undoAction: {
        type: 'reopen_tab',
        data: { url: 'https://example.com', windowId: 1 },
      },
    });

    const result = await executeNotificationUndoById(id);

    expect(result).toBe(true);
    expect(markSpy).toHaveBeenCalledWith('https://example.com');
    const tabs = await fakeBrowser.tabs.query({});
    expect(tabs.some(t => t.url === 'https://example.com')).toBe(true);
    // No groupId provided: group APIs are not invoked.
    expect(mockTabsGroup).not.toHaveBeenCalled();
    expect(mockTabGroupsGet).not.toHaveBeenCalled();

    markSpy.mockRestore();
  });

  it('re-attaches the reopened tab to its original group when the group still exists', async () => {
    await fakeBrowser.windows.create({ focused: true });

    const id = await showNotification({
      title: 'Deduped',
      message: 'Tab closed',
      undoAction: {
        type: 'reopen_tab',
        data: { url: 'https://example.com', windowId: 1, groupId: 42, title: 'T', index: 2 },
      },
    });

    await executeNotificationUndoById(id);

    expect(mockTabGroupsGet).toHaveBeenCalledWith(42);
    expect(mockTabsGroup).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: 42, tabIds: expect.arrayContaining([expect.any(Number)]) }),
    );
  });

  it('falls back to a standalone group when the original group is gone', async () => {
    await fakeBrowser.windows.create({ focused: true });
    mockTabGroupsGet.mockRejectedValueOnce(new Error('No group with id 42'));

    const id = await showNotification({
      title: 'Deduped',
      message: 'Tab closed',
      undoAction: {
        type: 'reopen_tab',
        data: { url: 'https://example.com', windowId: 1, groupId: 42 },
      },
    });

    await executeNotificationUndoById(id);

    expect(mockTabGroupsGet).toHaveBeenCalledWith(42);
    // Second call is the fallback without groupId.
    const fallbackCall = mockTabsGroup.mock.calls.find(
      (args) => !('groupId' in (args[0] ?? {})),
    );
    expect(fallbackCall).toBeDefined();
  });

  it('skips re-grouping when the closed tab was ungrouped', async () => {
    await fakeBrowser.windows.create({ focused: true });

    const id = await showNotification({
      title: 'Deduped',
      message: 'Tab closed',
      undoAction: {
        type: 'reopen_tab',
        data: { url: 'https://example.com', windowId: 1, groupId: -1 },
      },
    });

    await executeNotificationUndoById(id);

    expect(mockTabsGroup).not.toHaveBeenCalled();
    expect(mockTabGroupsGet).not.toHaveBeenCalled();
  });

  it('returns false on a second call with the same ID (idempotent)', async () => {
    const id = await showNotification({
      title: 'Grouped',
      message: 'Tabs grouped',
      undoAction: { type: 'ungroup', data: { tabIds: [1] } },
    });

    const first = await executeNotificationUndoById(id);
    const second = await executeNotificationUndoById(id);

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(mockTabsUngroup).toHaveBeenCalledOnce();
  });

  it('swallows errors thrown by the underlying browser action', async () => {
    mockTabsUngroup.mockRejectedValueOnce(new Error('boom'));
    const id = await showNotification({
      title: 'Grouped',
      message: 'Tabs grouped',
      undoAction: { type: 'ungroup', data: { tabIds: [1] } },
    });

    // Should not throw — executeUndoAction catches errors internally.
    await expect(executeNotificationUndoById(id)).resolves.toBe(true);
  });
});

describe('initNotificationListeners', () => {
  it('triggers the pending undo when the user clicks the undo button', async () => {
    initNotificationListeners();

    const id = await showNotification({
      title: 'Grouped',
      message: 'Tabs grouped',
      undoAction: { type: 'ungroup', data: { tabIds: [42] } },
    });

    // Simulate the user clicking the first button on that notification.
    await (fakeBrowser.notifications.onButtonClicked as any).trigger(id, 0);

    expect(mockTabsUngroup).toHaveBeenCalledWith([42]);

    // After the click, the notification should be cleared and the undo gone.
    const stillPending = await executeNotificationUndoById(id);
    expect(stillPending).toBe(false);
  });

  it('does not trigger the undo when a non-undo button is clicked', async () => {
    initNotificationListeners();

    const id = await showNotification({
      title: 'Grouped',
      message: 'Tabs grouped',
      undoAction: { type: 'ungroup', data: { tabIds: [42] } },
    });

    await (fakeBrowser.notifications.onButtonClicked as any).trigger(id, 1);

    expect(mockTabsUngroup).not.toHaveBeenCalled();
    // The undo is still pending until another clean-up path runs.
    const stillPending = await executeNotificationUndoById(id);
    expect(stillPending).toBe(true);
  });

  it('cleans up the pending undo when the notification is closed', async () => {
    initNotificationListeners();

    const id = await showNotification({
      title: 'Grouped',
      message: 'Tabs grouped',
      undoAction: { type: 'ungroup', data: { tabIds: [42] } },
    });

    await (fakeBrowser.notifications.onClosed as any).trigger(id, true);

    // Undo should no longer be available.
    const result = await executeNotificationUndoById(id);
    expect(result).toBe(false);
    expect(mockTabsUngroup).not.toHaveBeenCalled();
  });
});
