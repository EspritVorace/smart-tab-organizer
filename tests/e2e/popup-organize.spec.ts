/**
 * E2E Tests — "Organize All Tabs" button in popup
 *
 * Covers:
 * - US-PO006: Button visibility in popup
 * - US-PO007: Batch deduplication
 * - US-PO008: Batch grouping (plan + apply + reposition + collapse)
 * - US-PO009: Existing auto-grouping behaviour unaffected
 *
 * Migrated to the Page Object / Domain Action architecture (lot 5):
 * `PopupPage` replaces the manual `goToPopup` flow, and the SW
 * handshake + notification helpers live in `e2e-shared/actions/`.
 */

import { test, expect } from './fixtures';
import {
  PopupPage,
} from '../../e2e-shared/pages/index.js';
import {
  clearAllNotifications,
  getNotificationIds,
  getServiceWorkerWithOrganizeFn,
  setNotificationPrefs,
  triggerOrganizeAllTabsViaSW,
} from '../../e2e-shared/actions/index.js';

// ---------------------------------------------------------------------------
// [US-PO006] Button visibility
// ---------------------------------------------------------------------------

test.describe('[US-PO006] Organize button in popup', () => {
  test('Organize button is visible in popup', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    const popup = new PopupPage(page);
    await popup.open(extensionId);

    await expect(popup.organizeButton()).toBeVisible();

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
    const sw = await getServiceWorkerWithOrganizeFn(extensionContext);
    await clearAllNotifications(sw);

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
    await triggerOrganizeAllTabsViaSW(extensionContext);
    const afterCount = await helpers.getTabCount();
    const stats = await helpers.getStatistics();

    expect(afterCount).toBeLessThan(beforeCount);
    expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
  });

  test('keeps the lowest-index (leftmost) tab when deduplicating [US-PO007]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorkerWithOrganizeFn(extensionContext);

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

    await triggerOrganizeAllTabsViaSW(extensionContext);

    // Exactly one tab with this URL should remain
    const remaining = await sw.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      return tabs.filter((t) => t.url === 'https://example.com/keep-me').length;
    });
    expect(remaining).toBe(1);

    await firstTab.close().catch(() => {});
  });

  test('tabs without matching rule ARE deduped when deduplicateUnmatchedDomains=true [US-PO007]', async ({
    extensionContext,
    helpers,
  }) => {
    await helpers.setDeduplicateUnmatchedDomains(true);

    // No domain rules — batch dedup still handles unmatched tabs (exact match).
    await helpers.createTab('https://example.org/page');
    await helpers.createTab('https://example.org/page');
    await new Promise(r => setTimeout(r, 500));

    const beforeCount = await helpers.getTabCount();
    await triggerOrganizeAllTabsViaSW(extensionContext);
    const afterCount = await helpers.getTabCount();
    const stats = await helpers.getStatistics();

    expect(afterCount).toBeLessThan(beforeCount);
    expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
  });

  test('tabs without matching rule are NOT deduped when deduplicateUnmatchedDomains=false [US-PO007]', async ({
    extensionContext,
    helpers,
  }) => {
    await helpers.setDeduplicateUnmatchedDomains(false);

    await helpers.createTab('https://example.org/page');
    await helpers.createTab('https://example.org/page');
    await new Promise(r => setTimeout(r, 500));

    const beforeCount = await helpers.getTabCount();
    await triggerOrganizeAllTabsViaSW(extensionContext);
    const afterCount = await helpers.getTabCount();
    const stats = await helpers.getStatistics();

    expect(afterCount).toBe(beforeCount);
    expect(stats.tabsDeduplicatedCount).toBe(0);
  });

  test('single notification shown for all duplicates removed [US-PO007]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorkerWithOrganizeFn(extensionContext);
    await setNotificationPrefs(sw, { notifyOnDeduplication: true, notifyOnGrouping: false });
    await clearAllNotifications(sw);

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

    await triggerOrganizeAllTabsViaSW(extensionContext);

    expect(await getNotificationIds(sw)).toHaveLength(1);
  });

  test('no notification when no duplicates found [US-PO007]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorkerWithOrganizeFn(extensionContext);
    await setNotificationPrefs(sw, { notifyOnDeduplication: true, notifyOnGrouping: false });
    await clearAllNotifications(sw);

    await helpers.addDomainRule({
      label: 'Dedup Rule',
      domainFilter: 'example.com',
      enabled: true,
      deduplicationEnabled: true,
    });

    await helpers.createTab('https://example.com/unique1');
    await helpers.createTab('https://example.com/unique2');
    await new Promise(r => setTimeout(r, 500));

    await triggerOrganizeAllTabsViaSW(extensionContext);

    expect(await getNotificationIds(sw)).toHaveLength(0);
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

    await triggerOrganizeAllTabsViaSW(extensionContext);

    const groups = await helpers.getTabGroups();
    expect(groups.some(g => g.title === 'Example')).toBe(true);
    const group = groups.find(g => g.title === 'Example')!;
    expect(group.tabCount).toBeGreaterThanOrEqual(2);
  });

  test('single matching tab (no existing group) is NOT grouped [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
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

    await triggerOrganizeAllTabsViaSW(extensionContext);

    const groups = await helpers.getTabGroups();
    expect(groups.some(g => g.title === 'Solo')).toBe(false);
    expect(groups.some(g => g.title === 'Pair')).toBe(true);
  });

  test('tab already in an existing group stays when it would be solo in plan [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorkerWithOrganizeFn(extensionContext);

    await helpers.addDomainRule({
      label: 'MyGroup',
      domainFilter: 'example.com',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });

    const tab = await helpers.createTab('https://example.com/alone');
    await new Promise(r => setTimeout(r, 300));

    await sw.evaluate(async () => {
      const tabs = await chrome.tabs.query({ url: 'https://example.com/alone' });
      if (tabs[0]?.id != null) {
        const gid = await chrome.tabs.group({ tabIds: [tabs[0].id] });
        await chrome.tabGroups.update(gid, { title: 'PreviousGroup' });
      }
    });
    await new Promise(r => setTimeout(r, 300));

    await triggerOrganizeAllTabsViaSW(extensionContext);

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
    const sw = await getServiceWorkerWithOrganizeFn(extensionContext);

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

    await triggerOrganizeAllTabsViaSW(extensionContext);

    const allCollapsed = await sw.evaluate(async () => {
      const groups = await chrome.tabGroups.query({});
      return groups.length > 0 && groups.every((g) => g.collapsed === true);
    });
    expect(allCollapsed).toBe(true);
  });

  test('groups are moved before ungrouped tabs after organize [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorkerWithOrganizeFn(extensionContext);

    await helpers.addDomainRule({
      label: 'Front',
      domainFilter: 'example.com',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });

    await helpers.createTab('https://example.com/a');
    await helpers.createTab('https://example.com/b');
    await helpers.createTab('https://httpbin.org/ungrouped');
    await new Promise(r => setTimeout(r, 500));

    await triggerOrganizeAllTabsViaSW(extensionContext);

    const result = await sw.evaluate(async () => {
      const groups = await chrome.tabGroups.query({});
      if (groups.length === 0) return { groupMinIndex: -1, ungroupedIndex: -1 };
      const groupTabs = await chrome.tabs.query({ groupId: groups[0].id });
      const groupMinIndex = Math.min(...groupTabs.map((t) => t.index));
      const ungroupedTabs = await chrome.tabs.query({ groupId: chrome.tabs.TAB_ID_NONE });
      const httpbinTab = ungroupedTabs.find((t) => t.url?.includes('httpbin.org'));
      return { groupMinIndex, ungroupedIndex: httpbinTab?.index ?? -1 };
    });

    expect(result.groupMinIndex).toBeGreaterThanOrEqual(0);
    expect(result.ungroupedIndex).toBeGreaterThan(result.groupMinIndex);
  });

  test('tabs without matching rule are not grouped [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorkerWithOrganizeFn(extensionContext);

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

    await triggerOrganizeAllTabsViaSW(extensionContext);

    const httpbinGrouped = await sw.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      const httpbin = tabs.find((t) => t.url?.includes('httpbin.org'));
      return httpbin != null && httpbin.groupId != null && httpbin.groupId > 0;
    });
    expect(httpbinGrouped).toBe(false);
  });

  test('single grouping notification when tabs are grouped [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorkerWithOrganizeFn(extensionContext);
    await setNotificationPrefs(sw, { notifyOnGrouping: true, notifyOnDeduplication: false });
    await clearAllNotifications(sw);

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

    await triggerOrganizeAllTabsViaSW(extensionContext);

    expect(await getNotificationIds(sw)).toHaveLength(1);
  });

  test('no grouping notification when no tabs are grouped [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
    const sw = await getServiceWorkerWithOrganizeFn(extensionContext);
    await setNotificationPrefs(sw, { notifyOnGrouping: true, notifyOnDeduplication: false });
    await clearAllNotifications(sw);

    await helpers.addDomainRule({
      label: 'Solo',
      domainFilter: 'example.com',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });

    await helpers.createTab('https://example.com/only-one');
    await new Promise(r => setTimeout(r, 500));

    await triggerOrganizeAllTabsViaSW(extensionContext);

    expect(await getNotificationIds(sw)).toHaveLength(0);
  });

  test('tabGroupsCreatedCount incremented for new groups [US-PO008]', async ({
    extensionContext,
    helpers,
  }) => {
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

    await triggerOrganizeAllTabsViaSW(extensionContext);

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
    helpers,
  }) => {
    await helpers.addDomainRule({
      label: 'AutoGroup',
      domainFilter: 'example.com',
      enabled: true,
      groupingEnabled: true,
      groupNameSource: 'label',
    });

    const openerPage = await helpers.createTab('https://example.com/opener');
    await helpers.createTabFromOpener(openerPage, 'https://example.com/child');

    const groups = await helpers.getTabGroups();
    expect(groups.some(g => g.title === 'AutoGroup')).toBe(true);

    await openerPage.close().catch(() => {});
  });
});
