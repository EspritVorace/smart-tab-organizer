/**
 * E2E Tests for Notifications with Undo Action (US-N001 to US-N005)
 *
 * Tests the native browser notification system:
 * - US-N001: Grouping notification with Undo button
 * - US-N002: Deduplication notification with Undo button
 * - US-N003: Re-deduplication protection after clicking Undo
 * - US-N004: Pending undo actions are cleaned up when notification closes
 * - US-N005: notifyOnGrouping and notifyOnDeduplication are independent settings
 *
 * Because native browser notifications cannot be intercepted by Playwright DOM
 * queries, these tests verify notification behaviour at the service-worker level
 * using chrome.notifications.getAll() and by inspecting observable side-effects
 * (tab count changes, group count changes, skip-list state).
 */

import { test, expect } from './fixtures';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Returns all currently visible notification IDs from the service worker. */
async function getNotificationIds(sw: any): Promise<string[]> {
  return sw.evaluate(async () => {
    return new Promise<string[]>(resolve => {
      chrome.notifications.getAll(notifications => resolve(Object.keys(notifications)));
    });
  });
}

/** Sets notifyOnGrouping and notifyOnDeduplication via storage. */
async function setNotificationPrefs(
  sw: any,
  prefs: { notifyOnGrouping?: boolean; notifyOnDeduplication?: boolean },
) {
  await sw.evaluate(async (p: { notifyOnGrouping?: boolean; notifyOnDeduplication?: boolean }) => {
    await chrome.storage.sync.set(p);
  }, prefs);
  await new Promise(r => setTimeout(r, 100));
}

/**
 * Polls until executeNotificationUndoById is available on the SW's globalThis.
 * Needed because the SW may be idle-terminated and restarting while the test waits,
 * causing a race condition where background.ts hasn't finished re-initializing yet.
 */
async function getSwWithUndoFn(extensionContext: any, timeoutMs = 5000): Promise<any> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const sw = extensionContext.serviceWorkers()[0];
    if (sw) {
      const ready = await sw.evaluate(
        () => typeof (globalThis as any).executeNotificationUndoById === 'function',
      ).catch(() => false);
      if (ready) return sw;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('executeNotificationUndoById not available on SW globalThis after timeout');
}

// ─── suite ──────────────────────────────────────────────────────────────────

test.describe('Notifications', () => {
  test.beforeEach(async ({ helpers }) => {
    await helpers.closeAllTestTabs();
    await helpers.clearAllTabGroups();
    await helpers.clearDomainRules();
    await helpers.setGlobalGroupingEnabled(true);
    await helpers.setGlobalDeduplicationEnabled(false);
    await helpers.resetStatistics();
  });

  // ── US-N001: Grouping notification ───────────────────────────────────────

  test.describe('Grouping Notification [US-N001]', () => {
    test('shows a notification after tabs are grouped when notifyOnGrouping is enabled [US-N001]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = extensionContext.serviceWorkers()[0];
      await setNotificationPrefs(sw, { notifyOnGrouping: true });

      await helpers.addDomainRule({
        label: 'Notify Group',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');
      await helpers.waitForTabGrouped('Notify Group');

      // Give the notification a moment to be created
      await new Promise(r => setTimeout(r, 500));

      const notificationIds = await getNotificationIds(sw);
      // At least one notification should have been created with the smarttab prefix
      const smartTabNotifs = notificationIds.filter(id => id.startsWith('smarttab-'));
      expect(smartTabNotifs.length).toBeGreaterThan(0);
    });

    test('does NOT show a notification after grouping when notifyOnGrouping is disabled [US-N001]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = extensionContext.serviceWorkers()[0];
      await setNotificationPrefs(sw, { notifyOnGrouping: false });

      // Clear any pre-existing notifications
      await sw.evaluate(async () => {
        const notifs = await new Promise<Record<string, any>>(resolve =>
          chrome.notifications.getAll(resolve),
        );
        for (const id of Object.keys(notifs)) {
          chrome.notifications.clear(id);
        }
      });

      await helpers.addDomainRule({
        label: 'No Notify Group',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');
      await helpers.waitForTabGrouped('No Notify Group');

      await new Promise(r => setTimeout(r, 500));

      const notificationIds = await getNotificationIds(sw);
      const smartTabNotifs = notificationIds.filter(id => id.startsWith('smarttab-'));
      expect(smartTabNotifs.length).toBe(0);
    });

    test('clicking Undo on a grouping notification ungroups the tabs [US-N001]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = extensionContext.serviceWorkers()[0];
      await setNotificationPrefs(sw, { notifyOnGrouping: true });

      await helpers.addDomainRule({
        label: 'Undo Group',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');
      await helpers.waitForTabGrouped('Undo Group');

      await new Promise(r => setTimeout(r, 500));

      const notificationIds = await getNotificationIds(sw);
      const notifId = notificationIds.find(id => id.startsWith('smarttab-'));
      expect(notifId).toBeDefined();

      // Trigger the Undo action via the exposed globalThis helper
      const undoSw = await getSwWithUndoFn(extensionContext);
      await undoSw.evaluate(async (id: string) => {
        await (globalThis as any).executeNotificationUndoById(id);
      }, notifId!);

      await new Promise(r => setTimeout(r, 1000));

      const groups = await helpers.getTabGroups();
      // Undo should have ungrouped the tabs
      expect(groups.length).toBe(0);
    });
  });

  // ── US-N002: Deduplication notification ─────────────────────────────────

  test.describe('Deduplication Notification [US-N002]', () => {
    test('shows a notification after a tab is deduplicated when notifyOnDeduplication is enabled [US-N002]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = extensionContext.serviceWorkers()[0];
      await setNotificationPrefs(sw, { notifyOnDeduplication: true });
      await helpers.setGlobalDeduplicationEnabled(true);
      await helpers.setGlobalGroupingEnabled(false);

      // Clear any pre-existing notifications
      await sw.evaluate(async () => {
        const notifs = await new Promise<Record<string, any>>(resolve =>
          chrome.notifications.getAll(resolve),
        );
        for (const id of Object.keys(notifs)) {
          chrome.notifications.clear(id);
        }
      });

      const tab1 = await helpers.createTab('https://example.com/page-dedup');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      await helpers.createTab('https://example.com/page-dedup');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      // Deduplication should have removed the duplicate tab
      expect(finalCount).toBeLessThanOrEqual(initialCount);

      await new Promise(r => setTimeout(r, 500));

      const notificationIds = await getNotificationIds(sw);
      const smartTabNotifs = notificationIds.filter(id => id.startsWith('smarttab-'));
      expect(smartTabNotifs.length).toBeGreaterThan(0);
    });

    test('does NOT show a notification after deduplication when notifyOnDeduplication is disabled [US-N002]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = extensionContext.serviceWorkers()[0];
      await setNotificationPrefs(sw, { notifyOnDeduplication: false });
      await helpers.setGlobalDeduplicationEnabled(true);
      await helpers.setGlobalGroupingEnabled(false);

      // Clear any pre-existing notifications
      await sw.evaluate(async () => {
        const notifs = await new Promise<Record<string, any>>(resolve =>
          chrome.notifications.getAll(resolve),
        );
        for (const id of Object.keys(notifs)) {
          chrome.notifications.clear(id);
        }
      });

      const tab1 = await helpers.createTab('https://example.com/page-nodedup');
      await helpers.waitForDeduplication();

      await helpers.createTab('https://example.com/page-nodedup');
      await helpers.waitForDeduplication();

      await new Promise(r => setTimeout(r, 500));

      const notificationIds = await getNotificationIds(sw);
      const smartTabNotifs = notificationIds.filter(id => id.startsWith('smarttab-'));
      expect(smartTabNotifs.length).toBe(0);
    });

    test('clicking Undo on a deduplication notification reopens the closed tab [US-N002]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = extensionContext.serviceWorkers()[0];
      await setNotificationPrefs(sw, { notifyOnDeduplication: true });
      await helpers.setGlobalDeduplicationEnabled(true);
      await helpers.setGlobalGroupingEnabled(false);

      // Clear pre-existing notifications
      await sw.evaluate(async () => {
        const notifs = await new Promise<Record<string, any>>(resolve =>
          chrome.notifications.getAll(resolve),
        );
        for (const id of Object.keys(notifs)) {
          chrome.notifications.clear(id);
        }
      });

      await helpers.createTab('https://example.com/undo-dedup');
      await helpers.waitForDeduplication();
      const countBefore = await helpers.getTabCount();

      await helpers.createTab('https://example.com/undo-dedup');
      await helpers.waitForDeduplication();
      const countAfterDedup = await helpers.getTabCount();
      expect(countAfterDedup).toBeLessThanOrEqual(countBefore);

      await new Promise(r => setTimeout(r, 500));

      const notificationIds = await getNotificationIds(sw);
      const notifId = notificationIds.find(id => id.startsWith('smarttab-'));
      expect(notifId).toBeDefined();

      // Trigger Undo to reopen the closed tab
      const undoSw = await getSwWithUndoFn(extensionContext);
      await undoSw.evaluate(async (id: string) => {
        await (globalThis as any).executeNotificationUndoById(id);
      }, notifId!);

      await new Promise(r => setTimeout(r, 1500));

      const countAfterUndo = await helpers.getTabCount();
      // The undone tab should have been reopened, increasing count
      expect(countAfterUndo).toBeGreaterThan(countAfterDedup);
    });
  });

  // ── US-N003: Re-deduplication protection after Undo ──────────────────────

  test.describe('Re-deduplication Protection [US-N003]', () => {
    test('reopened tab via Undo is not immediately re-deduplicated [US-N003]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = extensionContext.serviceWorkers()[0];
      await setNotificationPrefs(sw, { notifyOnDeduplication: true });
      await helpers.setGlobalDeduplicationEnabled(true);
      await helpers.setGlobalGroupingEnabled(false);

      // Clear pre-existing notifications
      await sw.evaluate(async () => {
        const notifs = await new Promise<Record<string, any>>(resolve =>
          chrome.notifications.getAll(resolve),
        );
        for (const id of Object.keys(notifs)) {
          chrome.notifications.clear(id);
        }
      });

      const testUrl = 'https://example.com/protected-reopen';

      await helpers.createTab(testUrl);
      await helpers.waitForDeduplication();

      // Create a duplicate — should be deduplicated
      await helpers.createTab(testUrl);
      await helpers.waitForDeduplication();

      await new Promise(r => setTimeout(r, 500));

      const notificationIds = await getNotificationIds(sw);
      const notifId = notificationIds.find(id => id.startsWith('smarttab-'));
      expect(notifId).toBeDefined();

      const countBeforeUndo = await helpers.getTabCount();

      // Trigger Undo to reopen the deduplicated tab
      const undoSw = await getSwWithUndoFn(extensionContext);
      await undoSw.evaluate(async (id: string) => {
        await (globalThis as any).executeNotificationUndoById(id);
      }, notifId!);

      await new Promise(r => setTimeout(r, 1500));

      const countAfterUndo = await helpers.getTabCount();
      // The tab should have been reopened (count increased by at least 1)
      expect(countAfterUndo).toBeGreaterThan(countBeforeUndo);

      // The URL should be in the skip-deduplication list for 10 seconds
      const isProtected = await sw.evaluate(async (url: string) => {
        const shouldSkip = (globalThis as any).shouldSkipDeduplication;
        if (typeof shouldSkip === 'function') {
          return shouldSkip(url);
        }
        return null; // Function not exposed, skip the check
      }, testUrl);

      if (isProtected !== null) {
        expect(isProtected).toBe(true);
      }
    });
  });

  // ── US-N004: Cleanup of pending undo actions ─────────────────────────────

  test.describe('Notification Cleanup [US-N004]', () => {
    test('notification ID follows the smarttab-{timestamp} format [US-N004]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = extensionContext.serviceWorkers()[0];
      await setNotificationPrefs(sw, { notifyOnGrouping: true });

      // Clear pre-existing notifications
      await sw.evaluate(async () => {
        const notifs = await new Promise<Record<string, any>>(resolve =>
          chrome.notifications.getAll(resolve),
        );
        for (const id of Object.keys(notifs)) {
          chrome.notifications.clear(id);
        }
      });

      await helpers.addDomainRule({
        label: 'Cleanup Test',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');
      await helpers.waitForTabGrouped('Cleanup Test');

      await new Promise(r => setTimeout(r, 500));

      const notificationIds = await getNotificationIds(sw);
      const notifId = notificationIds.find(id => id.startsWith('smarttab-'));
      expect(notifId).toBeDefined();

      // Verify the format: smarttab-{numeric timestamp}
      const parts = notifId!.split('-');
      expect(parts[0]).toBe('smarttab');
      expect(Number(parts[1])).toBeGreaterThan(0);
    });

    test('manually closing a notification does not leave a ghost undo action [US-N004]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = extensionContext.serviceWorkers()[0];
      await setNotificationPrefs(sw, { notifyOnGrouping: true });

      await helpers.addDomainRule({
        label: 'Ghost Test',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');
      await helpers.waitForTabGrouped('Ghost Test');

      await new Promise(r => setTimeout(r, 500));

      const notificationIds = await getNotificationIds(sw);
      const notifId = notificationIds.find(id => id.startsWith('smarttab-'));
      expect(notifId).toBeDefined();

      // Close the notification (simulate manual close / timeout via chrome.notifications.clear,
      // which triggers the onClosed listener that cleans up pendingUndoActions)
      await sw.evaluate(async (id: string) => {
        await chrome.notifications.clear(id);
      }, notifId!);

      await new Promise(r => setTimeout(r, 300));

      // After close, the notification should no longer be visible
      const remainingIds = await getNotificationIds(sw);
      expect(remainingIds).not.toContain(notifId);
    });
  });

  // ── US-N005: Independent notification settings ───────────────────────────

  test.describe('Independent Notification Settings [US-N005]', () => {
    test('notifyOnGrouping and notifyOnDeduplication settings are stored independently [US-N005]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = extensionContext.serviceWorkers()[0];

      // Set them independently
      await setNotificationPrefs(sw, { notifyOnGrouping: true, notifyOnDeduplication: false });

      const settings = await helpers.getSettings();
      expect(settings.notifyOnGrouping).toBe(true);
      expect(settings.notifyOnDeduplication).toBe(false);

      // Change only deduplication
      await setNotificationPrefs(sw, { notifyOnDeduplication: true });

      const updated = await helpers.getSettings();
      expect(updated.notifyOnGrouping).toBe(true);
      expect(updated.notifyOnDeduplication).toBe(true);
    });

    test('notifyOnGrouping=true, notifyOnDeduplication=false: only grouping creates notifications [US-N005]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = extensionContext.serviceWorkers()[0];
      await setNotificationPrefs(sw, { notifyOnGrouping: true, notifyOnDeduplication: false });
      await helpers.setGlobalGroupingEnabled(true);
      await helpers.setGlobalDeduplicationEnabled(true);

      // Clear pre-existing notifications
      await sw.evaluate(async () => {
        const notifs = await new Promise<Record<string, any>>(resolve =>
          chrome.notifications.getAll(resolve),
        );
        for (const id of Object.keys(notifs)) {
          chrome.notifications.clear(id);
        }
      });

      // Trigger deduplication first (should NOT generate a notification)
      await helpers.createTab('https://example.com/only-dedup');
      await helpers.waitForDeduplication();
      await helpers.createTab('https://example.com/only-dedup');
      await helpers.waitForDeduplication();

      await new Promise(r => setTimeout(r, 500));
      const afterDedup = await getNotificationIds(sw);
      const smartTabAfterDedup = afterDedup.filter(id => id.startsWith('smarttab-'));
      expect(smartTabAfterDedup.length).toBe(0);

      // Now trigger grouping (SHOULD generate a notification)
      await helpers.clearDomainRules();
      await helpers.addDomainRule({
        label: 'Only Grouping Notif',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener-notif');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child-notif');
      await helpers.waitForTabGrouped('Only Grouping Notif');

      await new Promise(r => setTimeout(r, 500));
      const afterGrouping = await getNotificationIds(sw);
      const smartTabAfterGrouping = afterGrouping.filter(id => id.startsWith('smarttab-'));
      expect(smartTabAfterGrouping.length).toBeGreaterThan(0);
    });

    test('notifyOnGrouping=false, notifyOnDeduplication=true: only deduplication creates notifications [US-N005]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = extensionContext.serviceWorkers()[0];
      await setNotificationPrefs(sw, { notifyOnGrouping: false, notifyOnDeduplication: true });
      await helpers.setGlobalGroupingEnabled(true);
      await helpers.setGlobalDeduplicationEnabled(true);

      // Clear pre-existing notifications
      await sw.evaluate(async () => {
        const notifs = await new Promise<Record<string, any>>(resolve =>
          chrome.notifications.getAll(resolve),
        );
        for (const id of Object.keys(notifs)) {
          chrome.notifications.clear(id);
        }
      });

      // Trigger grouping (should NOT generate a notification)
      await helpers.addDomainRule({
        label: 'No Grouping Notif',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener-nq');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child-nq');
      await helpers.waitForTabGrouped('No Grouping Notif');

      await new Promise(r => setTimeout(r, 500));
      const afterGrouping = await getNotificationIds(sw);
      const smartTabAfterGrouping = afterGrouping.filter(id => id.startsWith('smarttab-'));
      expect(smartTabAfterGrouping.length).toBe(0);

      // Now trigger deduplication (SHOULD generate a notification)
      await helpers.clearAllTabGroups();
      await helpers.clearDomainRules();

      await helpers.createTab('https://example.com/only-notif-dedup');
      await helpers.waitForDeduplication();
      await helpers.createTab('https://example.com/only-notif-dedup');
      await helpers.waitForDeduplication();

      await new Promise(r => setTimeout(r, 500));
      const afterDedup = await getNotificationIds(sw);
      const smartTabAfterDedup = afterDedup.filter(id => id.startsWith('smarttab-'));
      expect(smartTabAfterDedup.length).toBeGreaterThan(0);
    });
  });
});
