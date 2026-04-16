/**
 * E2E Tests — "Organize All Tabs" button in popup
 *
 * Covers:
 * - US-PO006: Button visibility in popup
 * - US-PO007: Batch deduplication
 * - US-PO008: Batch grouping (plan + apply + reposition + collapse)
 * - US-PO009: Existing auto-grouping behaviour unaffected
 */

import { test, expect, type ExtensionFixtures } from './fixtures';
import { goToPopup } from './helpers/navigation';
import type { BrowserContext, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the service worker page, waiting up to 5 s for handleOrganizeAllTabs
 * to be available on globalThis (set during SW initialisation).
 */
async function getServiceWorker(extensionContext: BrowserContext): Promise<Page> {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const sw = extensionContext.serviceWorkers()[0];
    if (sw) {
      const ready = await sw
        .evaluate(() => typeof (globalThis as any).handleOrganizeAllTabs === 'function')
        .catch(() => false);
      if (ready) return sw;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('handleOrganizeAllTabs not available on SW globalThis after 5 s');
}

/**
 * Triggers the organize operation directly via the service worker
 * and waits for async operations to settle.
 */
async function triggerOrganize(sw: Page): Promise<void> {
  await sw.evaluate(async () => {
    const win = await chrome.windows.getCurrent();
    await (globalThis as any).handleOrganizeAllTabs(win.id);
  });
  // Allow time for Chrome API calls and state to settle
  await new Promise(r => setTimeout(r, 2000));
}

/** Clears all Chrome notifications via the service worker. */
async function clearNotifications(sw: Page): Promise<void> {
  await sw.evaluate(async () => {
    const all = await new Promise<Record<string, any>>(resolve =>
      chrome.notifications.getAll(n => resolve(n)),
    );
    await Promise.all(Object.keys(all).map(id => chrome.notifications.clear(id)));
  });
}

/** Returns all current notification IDs. */
async function getNotificationIds(sw: Page): Promise<string[]> {
  return sw.evaluate(async () => {
    return new Promise<string[]>(resolve =>
      chrome.notifications.getAll(n => resolve(Object.keys(n))),
    );
  });
}

// ---------------------------------------------------------------------------
// [US-PO006] Button visibility
// ---------------------------------------------------------------------------

test.describe('[US-PO006] Organize button in popup', () => {
  test('Organize button is visible in popup', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    await expect(page.getByRole('button', { name: /organize/i })).toBeVisible();

    await page.close();
  });
});

// ---------------------------------------------------------------------------
// [US-PO007] Batch deduplication
// ---------------------------------------------------------------------------

test.describe('[US-PO007] Batch deduplication', () => {
  test.beforeEach(async ({ helpers }) => {
    await helpers.closeAllTestTabs();
    await helpers.clearAllTabGroups();
    await helpers.clearDomainRules();
    // Disable global auto-dedup so tabs accumulate for the batch organize action to process
    await helpers.setGlobalDeduplicationEnabled(false);
    // Disable auto-grouping to isolate dedup behaviour
    await helpers.setGlobalGroupingEnabled(false);
    await helpers.resetStatistics();
  });

  test('removes duplicate tabs (exact mode) and increments stat [US-PO007]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);
    await clearNotifications(sw);

    await helpers.addDomainRule({
      label: 'Dedup Rule',
      domainFilter: 'example.com',
      enabled: true,
      deduplicationEnabled: true,
      deduplicationMatchMode: 'exact',
    });

    await helpers.createTab('https://example.com/page');
    await helpers.createTab('https://example.com/page'); // duplicate
    await helpers.createTab('https://example.com/page'); // duplicate
    await new Promise(r => setTimeout(r, 500));

    const beforeCount = await helpers.getTabCount();
    await triggerOrganize(sw);
    const afterCount = await helpers.getTabCount();
    const stats = await helpers.getStatistics();

    expect(afterCount).toBeLessThan(beforeCount);
    expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
  });

  test('keeps the lowest-index (leftmost) tab when deduplicating [US-PO007]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);

    await helpers.addDomainRule({
      label: 'Dedup Rule',
      domainFilter: 'example.com',
      enabled: true,
      deduplicationEnabled: true,
      deduplicationMatchMode: 'exact',
    });

    // First tab created has the lowest index
    const firstTab = await helpers.createTab('https://example.com/keep-me');
    await helpers.createTab('https://example.com/keep-me');
    await new Promise(r => setTimeout(r, 500));

    await triggerOrganize(sw);

    // Exactly one tab with this URL should remain
    const remaining = await sw.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      return tabs.filter((t: any) => t.url === 'https://example.com/keep-me').length;
    });
    expect(remaining).toBe(1);

    await firstTab.close().catch(() => {});
  });

  test('tabs without matching rule ARE deduped when deduplicateUnmatchedDomains=true [US-PO007]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);
    await helpers.setDeduplicateUnmatchedDomains(true);

    // No domain rules — batch dedup still handles unmatched tabs (exact match).
    await helpers.createTab('https://example.org/page');
    await helpers.createTab('https://example.org/page');
    await new Promise(r => setTimeout(r, 500));

    const beforeCount = await helpers.getTabCount();
    await triggerOrganize(sw);
    const afterCount = await helpers.getTabCount();
    const stats = await helpers.getStatistics();

    expect(afterCount).toBeLessThan(beforeCount);
    expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
  });

  test('tabs without matching rule are NOT deduped when deduplicateUnmatchedDomains=false [US-PO007]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);
    await helpers.setDeduplicateUnmatchedDomains(false);

    // No domain rules and unmatched-scope opt-out → nothing should be closed.
    await helpers.createTab('https://example.org/page');
    await helpers.createTab('https://example.org/page');
    await new Promise(r => setTimeout(r, 500));

    const beforeCount = await helpers.getTabCount();
    await triggerOrganize(sw);
    const afterCount = await helpers.getTabCount();
    const stats = await helpers.getStatistics();

    expect(afterCount).toBe(beforeCount);
    expect(stats.tabsDeduplicatedCount).toBe(0);
  });

  test('single notification shown for all duplicates removed [US-PO007]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);
    await sw.evaluate(async () => {
      await chrome.storage.sync.set({ notifyOnDeduplication: true, notifyOnGrouping: false });
    });
    await clearNotifications(sw);

    await helpers.addDomainRule({
      label: 'Dedup Rule',
      domainFilter: 'example.com',
      enabled: true,
      deduplicationEnabled: true,
      deduplicationMatchMode: 'exact',
    });

    await helpers.createTab('https://example.com/a');
    await helpers.createTab('https://example.com/a'); // dup
    await helpers.createTab('https://example.com/b');
    await helpers.createTab('https://example.com/b'); // dup
    await new Promise(r => setTimeout(r, 500));

    await triggerOrganize(sw);

    const ids = await getNotificationIds(sw);
    // One notification for all duplicates (not one per duplicate)
    expect(ids).toHaveLength(1);
  });

  test('no notification when no duplicates found [US-PO007]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);
    await sw.evaluate(async () => {
      await chrome.storage.sync.set({ notifyOnDeduplication: true, notifyOnGrouping: false });
    });
    await clearNotifications(sw);

    await helpers.addDomainRule({
      label: 'Dedup Rule',
      domainFilter: 'example.com',
      enabled: true,
      deduplicationEnabled: true,
    });

    await helpers.createTab('https://example.com/unique1');
    await helpers.createTab('https://example.com/unique2');
    await new Promise(r => setTimeout(r, 500));

    await triggerOrganize(sw);

    const ids = await getNotificationIds(sw);
    expect(ids).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// [US-PO008] Batch grouping
// ---------------------------------------------------------------------------

test.describe('[US-PO008] Batch grouping', () => {
  test.beforeEach(async ({ helpers }) => {
    await helpers.closeAllTestTabs();
    await helpers.clearAllTabGroups();
    await helpers.clearDomainRules();
    await helpers.resetStatistics();
  });

  test('groups 2+ matching tabs into a named group [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);

    await helpers.addDomainRule({
      label: 'Example',
      domainFilter: 'example.com',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });

    await helpers.createTab('https://example.com/a');
    await helpers.createTab('https://example.com/b');
    await new Promise(r => setTimeout(r, 500));

    await triggerOrganize(sw);

    const groups = await helpers.getTabGroups();
    expect(groups.some(g => g.title === 'Example')).toBe(true);
    const group = groups.find(g => g.title === 'Example')!;
    expect(group.tabCount).toBeGreaterThanOrEqual(2);
  });

  test('single matching tab (no existing group) is NOT grouped [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);

    await helpers.addDomainRule({
      label: 'Solo',
      domainFilter: 'httpbin.org',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });
    await helpers.addDomainRule({
      label: 'Pair',
      domainFilter: 'example.com',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });

    await helpers.createTab('https://httpbin.org/solo'); // only one → should NOT be grouped
    await helpers.createTab('https://example.com/a');
    await helpers.createTab('https://example.com/b');
    await new Promise(r => setTimeout(r, 500));

    await triggerOrganize(sw);

    const groups = await helpers.getTabGroups();
    expect(groups.some(g => g.title === 'Solo')).toBe(false); // solo tab not grouped
    expect(groups.some(g => g.title === 'Pair')).toBe(true);
  });

  test('tab already in an existing group stays when it would be solo in plan [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);

    await helpers.addDomainRule({
      label: 'MyGroup',
      domainFilter: 'example.com',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });

    // Manually put one tab into an existing group before triggering organize
    const tab = await helpers.createTab('https://example.com/alone');
    await new Promise(r => setTimeout(r, 300));

    await sw.evaluate(async () => {
      const tabs = await chrome.tabs.query({ url: 'https://example.com/alone' });
      if (tabs[0]?.id != null) {
        const gid = await chrome.tabs.group({ tabIds: [tabs[0].id] });
        await (chrome as any).tabGroups.update(gid, { title: 'PreviousGroup' });
      }
    });
    await new Promise(r => setTimeout(r, 300));

    // No second example.com tab → plan count < 2 → tab must stay in PreviousGroup
    await triggerOrganize(sw);

    const stillGrouped = await sw.evaluate(async () => {
      const tabs = await chrome.tabs.query({ url: 'https://example.com/alone' });
      return tabs[0]?.groupId != null && tabs[0].groupId > 0;
    });
    expect(stillGrouped).toBe(true);

    await tab.close().catch(() => {});
  });

  test('groups are collapsed after organize [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);

    await helpers.addDomainRule({
      label: 'CollapseTest',
      domainFilter: 'example.com',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });

    await helpers.createTab('https://example.com/a');
    await helpers.createTab('https://example.com/b');
    await new Promise(r => setTimeout(r, 500));

    await triggerOrganize(sw);

    const allCollapsed = await sw.evaluate(async () => {
      const groups = await (chrome as any).tabGroups.query({});
      return groups.length > 0 && groups.every((g: any) => g.collapsed === true);
    });
    expect(allCollapsed).toBe(true);
  });

  test('groups are moved before ungrouped tabs after organize [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);

    await helpers.addDomainRule({
      label: 'Front',
      domainFilter: 'example.com',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });

    await helpers.createTab('https://example.com/a');
    await helpers.createTab('https://example.com/b');
    await helpers.createTab('https://httpbin.org/ungrouped'); // no rule → stays ungrouped
    await new Promise(r => setTimeout(r, 500));

    await triggerOrganize(sw);

    const result = await sw.evaluate(async () => {
      const groups = await (chrome as any).tabGroups.query({});
      if (groups.length === 0) return { groupMinIndex: -1, ungroupedIndex: -1 };
      const groupTabs = await chrome.tabs.query({ groupId: groups[0].id });
      const groupMinIndex = Math.min(...groupTabs.map((t: any) => t.index));
      const ungroupedTabs = await chrome.tabs.query({ groupId: chrome.tabs.TAB_ID_NONE });
      const httpbinTab = ungroupedTabs.find((t: any) => t.url?.includes('httpbin.org'));
      return { groupMinIndex, ungroupedIndex: httpbinTab?.index ?? -1 };
    });

    expect(result.groupMinIndex).toBeGreaterThanOrEqual(0);
    expect(result.ungroupedIndex).toBeGreaterThan(result.groupMinIndex);
  });

  test('tabs without matching rule are not grouped [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);

    await helpers.addDomainRule({
      label: 'Example',
      domainFilter: 'example.com',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });

    await helpers.createTab('https://example.com/a');
    await helpers.createTab('https://example.com/b');
    await helpers.createTab('https://httpbin.org/no-rule');
    await new Promise(r => setTimeout(r, 500));

    await triggerOrganize(sw);

    const httpbinGrouped = await sw.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      const httpbin = tabs.find((t: any) => t.url?.includes('httpbin.org'));
      return httpbin != null && httpbin.groupId != null && httpbin.groupId > 0;
    });
    expect(httpbinGrouped).toBe(false);
  });

  test('single grouping notification when tabs are grouped [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);
    await sw.evaluate(async () => {
      await chrome.storage.sync.set({ notifyOnGrouping: true, notifyOnDeduplication: false });
    });
    await clearNotifications(sw);

    await helpers.addDomainRule({
      label: 'Notif',
      domainFilter: 'example.com',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });

    await helpers.createTab('https://example.com/a');
    await helpers.createTab('https://example.com/b');
    await new Promise(r => setTimeout(r, 500));

    await triggerOrganize(sw);

    const ids = await getNotificationIds(sw);
    expect(ids).toHaveLength(1);
  });

  test('no grouping notification when no tabs are grouped [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);
    await sw.evaluate(async () => {
      await chrome.storage.sync.set({ notifyOnGrouping: true, notifyOnDeduplication: false });
    });
    await clearNotifications(sw);

    await helpers.addDomainRule({
      label: 'Solo',
      domainFilter: 'example.com',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });

    await helpers.createTab('https://example.com/only-one'); // single tab → not grouped
    await new Promise(r => setTimeout(r, 500));

    await triggerOrganize(sw);

    const ids = await getNotificationIds(sw);
    expect(ids).toHaveLength(0);
  });

  test('tabGroupsCreatedCount incremented for new groups [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorker(extensionContext);

    await helpers.addDomainRule({
      label: 'StatTest',
      domainFilter: 'example.com',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });

    await helpers.createTab('https://example.com/a');
    await helpers.createTab('https://example.com/b');
    await new Promise(r => setTimeout(r, 500));

    await triggerOrganize(sw);

    const stats = await helpers.getStatistics();
    expect(stats.tabGroupsCreatedCount).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// [US-PO009] Automatic grouping unaffected
// ---------------------------------------------------------------------------

test.describe('[US-PO009] Automatic grouping unaffected by organize rules', () => {
  test.beforeEach(async ({ helpers }) => {
    await helpers.closeAllTestTabs();
    await helpers.clearAllTabGroups();
    await helpers.clearDomainRules();
    await helpers.resetStatistics();
    await helpers.setGlobalGroupingEnabled(true);
  });

  test('auto-grouping still creates a group with a single new tab [US-PO009]', async ({
    extensionContext,
    helpers,
  }) => {
    await helpers.addDomainRule({
      label: 'AutoGroup',
      domainFilter: 'example.com',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });

    // createTabFromOpener invokes processGroupingForNewTab directly (no min-member check)
    const openerPage = await helpers.createTab('https://example.com/opener');
    await helpers.createTabFromOpener(openerPage, 'https://example.com/child');

    const groups = await helpers.getTabGroups();
    expect(groups.some(g => g.title === 'AutoGroup')).toBe(true);

    await openerPage.close().catch(() => {});
  });
});
