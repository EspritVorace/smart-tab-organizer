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
 * using `chrome.notifications.getAll()` and by inspecting observable
 * side-effects (tab count changes, group count changes, skip-list state).
 *
 * Migrated to the Page Object / Domain Action architecture (lot 5):
 * the SW handshake, the smarttab-id filter and the undo trigger now live
 * in `e2e-shared/actions/notifications.ts`.
 */

import { test, expect } from './fixtures';
import {
  clearAllNotifications,
  executeNotificationUndo,
  getServiceWorker,
  getSmartTabNotificationIds,
  setNotificationPrefs,
} from '../../e2e-shared/actions/index.js';

// ─── suite ──────────────────────────────────────────────────────────────────

test.describe('Notifications', () => {
  test.beforeEach(async ({ helpers }) => {
    await helpers.closeAllTestTabs();
    await helpers.clearAllTabGroups();
    await helpers.clearDomainRules();
    await helpers.setGlobalGroupingEnabled(true);
    await helpers.setGlobalDeduplicationEnabled(false);
    // Pin the legacy dedup defaults these scenarios were written against
    // (unmatched-domain dedup on, keep-old tie-breaker) so notification-count
    // assertions stay stable regardless of production default changes.
    await helpers.setDeduplicateUnmatchedDomains(true);
    await helpers.setDeduplicationKeepStrategy('keep-old');
    await helpers.resetStatistics();
  });

  // ── US-N001: Grouping notification ───────────────────────────────────────

  test.describe('Grouping Notification [US-N001]', () => {
    test('shows a notification after tabs are grouped when notifyOnGrouping is enabled [US-N001]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = await getServiceWorker(extensionContext);
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

      const smartTabNotifs = await getSmartTabNotificationIds(sw);
      expect(smartTabNotifs.length).toBeGreaterThan(0);
    });

    test('does NOT show a notification after grouping when notifyOnGrouping is disabled [US-N001]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = await getServiceWorker(extensionContext);
      await setNotificationPrefs(sw, { notifyOnGrouping: false });
      await clearAllNotifications(sw);

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

      const smartTabNotifs = await getSmartTabNotificationIds(sw);
      expect(smartTabNotifs).toHaveLength(0);
    });

    test('clicking Undo on a grouping notification ungroups the tabs [US-N001]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = await getServiceWorker(extensionContext);
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

      const smartTabNotifs = await getSmartTabNotificationIds(sw);
      const notifId = smartTabNotifs[0];
      expect(notifId).toBeDefined();

      await executeNotificationUndo(extensionContext, notifId);
      await new Promise(r => setTimeout(r, 1000));

      const groups = await helpers.getTabGroups();
      expect(groups).toHaveLength(0);
    });
  });

  // ── US-N002: Deduplication notification ─────────────────────────────────

  test.describe('Deduplication Notification [US-N002]', () => {
    test('shows a notification after a tab is deduplicated when notifyOnDeduplication is enabled [US-N002]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = await getServiceWorker(extensionContext);
      await setNotificationPrefs(sw, { notifyOnDeduplication: true });
      await helpers.setGlobalDeduplicationEnabled(true);
      await helpers.setGlobalGroupingEnabled(false);
      await clearAllNotifications(sw);

      const _tab1 = await helpers.createTab('https://example.com/page-dedup');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      await helpers.createTab('https://example.com/page-dedup');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      expect(finalCount).toBeLessThanOrEqual(initialCount);

      await new Promise(r => setTimeout(r, 500));

      const smartTabNotifs = await getSmartTabNotificationIds(sw);
      expect(smartTabNotifs.length).toBeGreaterThan(0);
    });

    test('does NOT show a notification after deduplication when notifyOnDeduplication is disabled [US-N002]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = await getServiceWorker(extensionContext);
      await setNotificationPrefs(sw, { notifyOnDeduplication: false });
      await helpers.setGlobalDeduplicationEnabled(true);
      await helpers.setGlobalGroupingEnabled(false);
      await clearAllNotifications(sw);

      await helpers.createTab('https://example.com/page-nodedup');
      await helpers.waitForDeduplication();
      await helpers.createTab('https://example.com/page-nodedup');
      await helpers.waitForDeduplication();

      await new Promise(r => setTimeout(r, 500));

      const smartTabNotifs = await getSmartTabNotificationIds(sw);
      expect(smartTabNotifs).toHaveLength(0);
    });

    test('clicking Undo on a deduplication notification reopens the closed tab [US-N002]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = await getServiceWorker(extensionContext);
      await setNotificationPrefs(sw, { notifyOnDeduplication: true });
      await helpers.setGlobalDeduplicationEnabled(true);
      await helpers.setGlobalGroupingEnabled(false);
      await clearAllNotifications(sw);

      await helpers.createTab('https://example.com/undo-dedup');
      await helpers.waitForDeduplication();
      const countBefore = await helpers.getTabCount();

      await helpers.createTab('https://example.com/undo-dedup');
      await helpers.waitForDeduplication();
      const countAfterDedup = await helpers.getTabCount();
      expect(countAfterDedup).toBeLessThanOrEqual(countBefore);

      await new Promise(r => setTimeout(r, 500));

      const notifId = (await getSmartTabNotificationIds(sw))[0];
      expect(notifId).toBeDefined();

      await executeNotificationUndo(extensionContext, notifId);
      await new Promise(r => setTimeout(r, 1500));

      const countAfterUndo = await helpers.getTabCount();
      expect(countAfterUndo).toBeGreaterThan(countAfterDedup);
    });
  });

  // ── US-N003: Re-deduplication protection after Undo ──────────────────────

  test.describe('Re-deduplication Protection [US-N003]', () => {
    test('reopened tab via Undo is not immediately re-deduplicated [US-N003]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = await getServiceWorker(extensionContext);
      await setNotificationPrefs(sw, { notifyOnDeduplication: true });
      await helpers.setGlobalDeduplicationEnabled(true);
      await helpers.setGlobalGroupingEnabled(false);
      await clearAllNotifications(sw);

      const testUrl = 'https://example.com/protected-reopen';

      await helpers.createTab(testUrl);
      await helpers.waitForDeduplication();

      await helpers.createTab(testUrl);
      await helpers.waitForDeduplication();

      await new Promise(r => setTimeout(r, 500));

      const notifId = (await getSmartTabNotificationIds(sw))[0];
      expect(notifId).toBeDefined();

      const countBeforeUndo = await helpers.getTabCount();
      await executeNotificationUndo(extensionContext, notifId);
      await new Promise(r => setTimeout(r, 1500));

      const countAfterUndo = await helpers.getTabCount();
      expect(countAfterUndo).toBeGreaterThan(countBeforeUndo);

      // The URL should be in the skip-deduplication list for 10 seconds.
      // Re-resolve the SW to evaluate `shouldSkipDeduplication` on the
      // same instance that owns the in-memory skip list.
      const undoSw = await getServiceWorker(extensionContext);
      const isProtected = await undoSw.evaluate((url: string) => {
        return (globalThis as unknown as {
          shouldSkipDeduplication: (url: string) => boolean;
        }).shouldSkipDeduplication(url);
      }, testUrl);
      expect(isProtected).toBe(true);
    });
  });

  // ── US-N004: Cleanup of pending undo actions ─────────────────────────────

  test.describe('Notification Cleanup [US-N004]', () => {
    test('notification ID follows the smarttab-{timestamp} format [US-N004]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = await getServiceWorker(extensionContext);
      await setNotificationPrefs(sw, { notifyOnGrouping: true });
      await clearAllNotifications(sw);

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

      const notifId = (await getSmartTabNotificationIds(sw))[0];
      expect(notifId).toBeDefined();

      const parts = notifId.split('-');
      expect(parts[0]).toBe('smarttab');
      expect(Number(parts[1])).toBeGreaterThan(0);
    });

    test('manually closing a notification does not leave a ghost undo action [US-N004]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = await getServiceWorker(extensionContext);
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

      const notifId = (await getSmartTabNotificationIds(sw))[0];
      expect(notifId).toBeDefined();

      // Close the notification (simulate manual close / timeout via
      // chrome.notifications.clear, which triggers the onClosed listener
      // that cleans up pendingUndoActions).
      await sw.evaluate(async (id: string) => {
        await chrome.notifications.clear(id);
      }, notifId);

      await new Promise(r => setTimeout(r, 300));

      const remainingIds = await getSmartTabNotificationIds(sw);
      expect(remainingIds).not.toContain(notifId);
    });
  });

  // ── US-N005: Independent notification settings ───────────────────────────

  test.describe('Independent Notification Settings [US-N005]', () => {
    test('notifyOnGrouping and notifyOnDeduplication settings are stored independently [US-N005]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = await getServiceWorker(extensionContext);
      await setNotificationPrefs(sw, { notifyOnGrouping: true, notifyOnDeduplication: false });

      const settings = await helpers.getSettings();
      expect(settings.notifyOnGrouping).toBe(true);
      expect(settings.notifyOnDeduplication).toBe(false);

      await setNotificationPrefs(sw, { notifyOnDeduplication: true });

      const updated = await helpers.getSettings();
      expect(updated.notifyOnGrouping).toBe(true);
      expect(updated.notifyOnDeduplication).toBe(true);
    });

    test('notifyOnGrouping=true, notifyOnDeduplication=false: only grouping creates notifications [US-N005]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = await getServiceWorker(extensionContext);
      await setNotificationPrefs(sw, { notifyOnGrouping: true, notifyOnDeduplication: false });
      await helpers.setGlobalGroupingEnabled(true);
      await helpers.setGlobalDeduplicationEnabled(true);
      await clearAllNotifications(sw);

      // Trigger deduplication first (should NOT generate a notification)
      await helpers.createTab('https://example.com/only-dedup');
      await helpers.waitForDeduplication();
      await helpers.createTab('https://example.com/only-dedup');
      await helpers.waitForDeduplication();

      await new Promise(r => setTimeout(r, 500));
      expect(await getSmartTabNotificationIds(sw)).toHaveLength(0);

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
      const afterGrouping = await getSmartTabNotificationIds(sw);
      expect(afterGrouping.length).toBeGreaterThan(0);
    });

    test('notifyOnGrouping=false, notifyOnDeduplication=true: only deduplication creates notifications [US-N005]', async ({
      helpers,
      extensionContext,
    }) => {
      const sw = await getServiceWorker(extensionContext);
      await setNotificationPrefs(sw, { notifyOnGrouping: false, notifyOnDeduplication: true });
      await helpers.setGlobalGroupingEnabled(true);
      await helpers.setGlobalDeduplicationEnabled(true);
      await clearAllNotifications(sw);

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
      expect(await getSmartTabNotificationIds(sw)).toHaveLength(0);

      // Now trigger deduplication (SHOULD generate a notification)
      await helpers.clearAllTabGroups();
      await helpers.clearDomainRules();

      await helpers.createTab('https://example.com/only-notif-dedup');
      await helpers.waitForDeduplication();
      await helpers.createTab('https://example.com/only-notif-dedup');
      await helpers.waitForDeduplication();

      await new Promise(r => setTimeout(r, 500));
      const afterDedup = await getSmartTabNotificationIds(sw);
      expect(afterDedup.length).toBeGreaterThan(0);
    });
  });
});
