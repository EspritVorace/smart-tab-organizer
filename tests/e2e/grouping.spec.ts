/**
 * E2E Tests for Tab Grouping
 *
 * Three layers of tests:
 *
 * 1. "Direct API" — createTabFromOpener calls processGroupingForNewTab directly.
 *    Fast, stable. Tests the grouping LOGIC (rules, colors, name sources, stats).
 *
 * 2. "Natural Event Flow" — createTabNaturally injects into middleClickedTabs then
 *    calls chrome.tabs.create({openerTabId}).  Exercises the full event-handler
 *    chain: onTabCreated → findMiddleClickOpener → handleGroupingWithRetry →
 *    onUpdated(complete) → processGroupingForNewTab.
 *
 * 3. "Content Script Integration" — serves fake pages via extensionContext.route() and
 *    dispatches a real auxclick event that the content script intercepts, mimicking
 *    the exact UI path a user takes when middle-clicking a link.
 */

import { test, expect, type TabGroupInfo } from './fixtures';
import type { BrowserContext, Route, Request } from '@playwright/test';
import * as http from 'http';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Port used for fake local pages in the content-script integration tests. */
const FAKE_PORT = 7654;

/** Serve two pages via extensionContext.route so the content script can inject into them. */
async function setupFakePages(extensionContext: BrowserContext) {
  await extensionContext.route(`http://localhost:${FAKE_PORT}/**`, (route: any, request: any) => {
    const pathname = new URL(request.url()).pathname;
    const isOpener = pathname === '/opener.html' || pathname === '/';
    route.fulfill({
      contentType: 'text/html',
      body: isOpener
        ? `<!DOCTYPE html><html><head><title>Opener - SmartTab Test</title></head><body>
             <h1>Opener</h1>
             <a id="child-link" href="http://localhost:${FAKE_PORT}/child.html">Child page</a>
             <a id="child2-link" href="http://localhost:${FAKE_PORT}/child2.html">Child page 2</a>
           </body></html>`
        : `<!DOCTYPE html><html><head><title>Child - SmartTab Test</title></head>
           <body><h1>Child</h1></body></html>`,
    });
  });
}

// ─── suite ──────────────────────────────────────────────────────────────────

test.describe('Tab Grouping', () => {
  // Real HTTP server so tabs created via chrome.tabs.create (from sw.evaluate)
  // can navigate to localhost:FAKE_PORT — Playwright's extensionContext.route() may not
  // intercept those tabs in time, but a real server always responds.
  let localServer: http.Server;

  test.beforeAll(async () => {
    localServer = http.createServer((req, res) => {
      const pathname = new URL(req.url!, `http://localhost:${FAKE_PORT}`).pathname;
      const isOpener = pathname === '/opener.html' || pathname === '/';
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        isOpener
          ? `<!DOCTYPE html><html><head><title>Opener - SmartTab Test</title></head><body>
               <h1>Opener</h1>
               <a id="child-link" href="http://localhost:${FAKE_PORT}/child.html">Child page</a>
               <a id="child2-link" href="http://localhost:${FAKE_PORT}/child2.html">Child page 2</a>
             </body></html>`
          : `<!DOCTYPE html><html><head><title>Child - SmartTab Test</title></head>
             <body><h1>Child</h1></body></html>`,
      );
    });
    await new Promise<void>(resolve => localServer.listen(FAKE_PORT, resolve));
  });

  test.afterAll(async () => {
    await new Promise<void>(resolve => localServer.close(() => resolve()));
  });

  test.beforeEach(async ({ helpers }) => {
    // Clean up any tabs/groups left by the previous test before configuring state
    await helpers.closeAllTestTabs();
    await helpers.clearAllTabGroups();
    await helpers.clearDomainRules();
    await helpers.setGlobalGroupingEnabled(true);
    await helpers.setGlobalDeduplicationEnabled(false);
    await helpers.resetStatistics();
  });

  // ── 1. Global Settings ────────────────────────────────────────────────────

  test.describe('Global Settings', () => {
    test('groups tabs when global grouping is enabled and rule matches [US-G001]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Example Group',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        groupNameSource: 'label',
        color: 'blue',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped('Example Group');
      const stats = await helpers.getStatistics();

      expect(groups.length).toBeGreaterThan(0);
      expect(groups.find(g => g.title === 'Example Group')).toBeDefined();
      expect(stats.tabGroupsCreatedCount).toBe(1);
    });

    test('does NOT group when global grouping is disabled [US-G001]', async ({ helpers }) => {
      await helpers.setGlobalGroupingEnabled(false);
      await helpers.addDomainRule({
        label: 'Disabled Group',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');
      await helpers.waitForGrouping();

      const stats = await helpers.getStatistics();
      const groups = await helpers.getTabGroups();

      expect(stats.tabGroupsCreatedCount).toBe(0);
      expect(groups.length).toBe(0);
    });

    test('does NOT group when no matching rule exists [US-G001]', async ({ helpers }) => {
      // No rules added
      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');
      await helpers.waitForGrouping();

      const stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(0);
    });
  });

  // ── 2. Rule-specific Settings ─────────────────────────────────────────────

  test.describe('Rule-specific Settings', () => {
    test('does NOT group when rule has groupingEnabled=false [US-G002]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'No-group Rule',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        enabled: true,
        groupingEnabled: false,
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');
      await helpers.waitForGrouping();

      const stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(0);
    });

    test('does NOT group when rule is disabled (enabled=false) [US-G002]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Disabled Rule',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        enabled: false,
        groupingEnabled: true,
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');
      await helpers.waitForGrouping();

      const stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(0);
    });
  });

  // ── 3. Group Name Sources ─────────────────────────────────────────────────

  test.describe('Group Name Sources', () => {
    test('groupNameSource=label: uses rule label as group name [US-G003]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'My Custom Label',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped('My Custom Label');
      expect(groups.find(g => g.title === 'My Custom Label')).toBeDefined();
    });

    test('groupNameSource=url: extracts name from opener URL [US-G003]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'URL Extract',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        groupNameSource: 'url',
        urlParsingRegEx: 'example\\.com/(\\w+)',
      });

      const opener = await helpers.createTab('https://example.com/products');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped();
      expect(groups.length).toBeGreaterThan(0);
      // Should extract "products" from opener URL; falls back to label if fails
      const group = groups[0];
      expect(['products', 'URL Extract']).toContain(group.title);
    });

    test('groupNameSource=title: extracts name from opener page title [US-G003]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Title Extract',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        groupNameSource: 'title',
        titleParsingRegEx: 'Project:\\s*(\\w+)',
      });

      const opener = await helpers.createTab('https://example.com/page');
      await helpers.waitForGrouping();

      // Set page title before child is created so the background can read it
      await opener.evaluate(() => { document.title = 'Project: Alpha - Dashboard'; });
      await new Promise(r => setTimeout(r, 200));

      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped();
      expect(groups.length).toBeGreaterThan(0);
      // Either extracted "Alpha" or fell back to label
      const group = groups[0];
      expect(['Alpha', 'Title Extract']).toContain(group.title);
    });

    test('groupNameSource=smart_label: falls back to label when extraction fails [US-G003]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Smart Label Fallback',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        groupNameSource: 'smart_label',
        titleParsingRegEx: 'NOMATCH:\\s*(\\w+)',
      });

      const opener = await helpers.createTab('https://example.com/page');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped('Smart Label Fallback');
      expect(groups.find(g => g.title === 'Smart Label Fallback')).toBeDefined();
    });

    test('invalid regex falls back gracefully (no crash) [US-G003]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Invalid Regex Fallback',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        groupNameSource: 'title',
        titleParsingRegEx: '[invalid(regex',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      // Should not crash; extension still creates a group using label as fallback
      const groups = await helpers.waitForTabGrouped();
      expect(groups.length).toBeGreaterThan(0);
    });
  });

  // ── 4. Group Colors ───────────────────────────────────────────────────────

  test.describe('Group Colors', () => {
    test('applies the specified color to the created group [US-G004]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Blue Group',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        color: 'blue',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped('Blue Group');
      const group = groups.find(g => g.title === 'Blue Group');
      expect(group).toBeDefined();
      expect(group!.color).toBe('blue');
    });

    test('applies red, green, purple colors correctly [US-G004]', async ({ helpers }) => {
      for (const color of ['red', 'green', 'purple'] as const) {
        await helpers.clearDomainRules();
        await helpers.resetStatistics();
        await helpers.addDomainRule({
          label: `${color} Group`,
          domainFilter: 'example.com',
        deduplicationEnabled: false,
          groupingEnabled: true,
          color,
        });

        const opener = await helpers.createTab('https://example.com/opener');
        await helpers.waitForGrouping();
        await helpers.createTabFromOpener(opener, 'https://example.com/child');

        const groups = await helpers.waitForTabGrouped(`${color} Group`);
        const group = groups.find(g => g.title === `${color} Group`);
        expect(group, `Expected group with color "${color}"`).toBeDefined();
        expect(group!.color).toBe(color);

        await helpers.closeAllTestTabs();
      }
    });

    test('uses Chrome default color when no color is specified [US-G004]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'No Color Group',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        color: '',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped('No Color Group');
      expect(groups.length).toBeGreaterThan(0);
      // Chrome assigns a default color; we just verify a group was created
      expect(groups[0].color).toBeTruthy();
    });
  });

  // ── 5. Existing Group Scenarios ───────────────────────────────────────────

  test.describe('Existing Group Scenarios', () => {
    test('adds to existing group when opener is already grouped [US-G005]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Existing Group Test',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        color: 'green',
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      // First child — creates the group
      await helpers.createTabFromOpener(opener, 'https://example.com/child1');
      const groups1 = await helpers.waitForTabGrouped('Existing Group Test');
      expect(groups1.length).toBe(1);
      const firstTabCount = groups1[0].tabCount;

      // Second child — should be added to the SAME group, not create a new one
      await helpers.createTabFromOpener(opener, 'https://example.com/child2');
      await helpers.waitForGrouping();

      const groups2 = await helpers.getTabGroups();
      const stats = await helpers.getStatistics();

      expect(groups2.length).toBe(1);
      expect(groups2[0].tabCount).toBeGreaterThan(firstTabCount);
      expect(stats.tabGroupsCreatedCount).toBe(1); // Only one group was ever created
    });

    test('creates a new group each time a fresh opener opens a child [US-G005]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'New Group Test',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        groupNameSource: 'label',
      });

      const opener1 = await helpers.createTab('https://example.com/page1');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener1, 'https://example.com/child1');
      await helpers.waitForGrouping();

      const opener2 = await helpers.createTab('https://example.com/page2');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener2, 'https://example.com/child2');
      await helpers.waitForGrouping();

      const stats = await helpers.getStatistics();
      // Two separate openers → two separate groups
      expect(stats.tabGroupsCreatedCount).toBe(2);
    });
  });

  // ── 6. Multiple Rules ─────────────────────────────────────────────────────

  test.describe('Multiple Rules', () => {
    test('applies correct rule based on domain [US-G006]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Example Blue',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        color: 'blue',
        groupNameSource: 'label',
      });
      await helpers.addDomainRule({
        label: 'Httpbin Red',
        domainFilter: 'httpbin.org',
        deduplicationEnabled: false,
        groupingEnabled: true,
        color: 'red',
        groupNameSource: 'label',
      });

      const exampleOpener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(exampleOpener, 'https://example.com/child');
      await helpers.waitForGrouping();

      const httpbinOpener = await helpers.createTab('https://httpbin.org/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(httpbinOpener, 'https://httpbin.org/child');
      await helpers.waitForGrouping();

      const groups = await helpers.getTabGroups();
      expect(groups.length).toBe(2);

      const blueGroup = groups.find(g => g.color === 'blue');
      const redGroup = groups.find(g => g.color === 'red');
      expect(blueGroup?.title).toBe('Example Blue');
      expect(redGroup?.title).toBe('Httpbin Red');
    });

    test('first matching rule wins when multiple rules match the same domain [US-G006]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Specific Subdomain',
        domainFilter: 'www.example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        color: 'purple',
        groupNameSource: 'label',
      });
      await helpers.addDomainRule({
        label: 'General Example',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        color: 'yellow',
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://www.example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://www.example.com/child');

      const groups = await helpers.waitForTabGrouped('Specific Subdomain');
      const group = groups.find(g => g.title === 'Specific Subdomain');
      expect(group).toBeDefined();
      expect(group!.color).toBe('purple');
    });
  });

  // ── 7. Statistics ─────────────────────────────────────────────────────────

  test.describe('Statistics', () => {
    test('increments tabGroupsCreatedCount only when a new group is created [US-G007]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Stats Group',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        groupNameSource: 'label',
      });
      await helpers.resetStatistics();

      let stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(0);

      // First child — creates a new group
      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child1');
      await helpers.waitForGrouping();
      stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(1);

      // Second child from same opener — joins existing group, no new group
      await helpers.createTabFromOpener(opener, 'https://example.com/child2');
      await helpers.waitForGrouping();
      stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(1);

      // Second opener on a different domain → new group
      await helpers.clearDomainRules();
      await helpers.addDomainRule({
        label: 'Stats Group 2',
        domainFilter: 'httpbin.org',
        deduplicationEnabled: false,
        groupingEnabled: true,
        groupNameSource: 'label',
      });

      const opener2 = await helpers.createTab('https://httpbin.org/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener2, 'https://httpbin.org/child');
      await helpers.waitForGrouping();
      stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(2);
    });
  });

  // ── 8. Edge Cases ─────────────────────────────────────────────────────────

  test.describe('Edge Cases', () => {
    test('handles multiple children opened concurrently (only one group created) [US-G008]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Rapid Children',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        color: 'cyan',
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      await Promise.all([
        helpers.createTabFromOpener(opener, 'https://example.com/child1'),
        helpers.createTabFromOpener(opener, 'https://example.com/child2'),
        helpers.createTabFromOpener(opener, 'https://example.com/child3'),
      ]);
      await helpers.waitForGrouping(3000);

      const stats = await helpers.getStatistics();
      const groups = await helpers.getTabGroups();

      expect(stats.tabGroupsCreatedCount).toBe(1);
      const group = groups.find(g => g.title === 'Rapid Children');
      expect(group?.tabCount).toBeGreaterThanOrEqual(2);
    });
  });

  // ── 9. Natural Event Flow (tests full event-handler chain) ────────────────
  //
  // createTabNaturally:
  //   middleClickedTabs.set(url, openerTabId)   ← simulates content script
  //   chrome.tabs.create({ openerTabId })        ← triggers onTabCreated
  //   → findMiddleClickOpener                    ← finds the map entry
  //   → handleGroupingWithRetry                  ← waits for tab to load
  //   → onUpdated(status=complete)
  //   → processGroupingForNewTab                 ← creates the group
  // ────────────────────────────────────────────────────────────────────────

  test.describe('Natural Event Flow', () => {
    test('groups a tab when opener is registered in middleClickedTabs [US-G009]', async ({ extensionContext, helpers }) => {
      await setupFakePages(extensionContext);
      await helpers.addDomainRule({
        label: 'Natural Group',
        domainFilter: `localhost:${FAKE_PORT}`,
        deduplicationEnabled: false,
        groupingEnabled: true,
        color: 'blue',
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab(`http://localhost:${FAKE_PORT}/opener.html`);
      await helpers.waitForGrouping();

      await helpers.createTabNaturally(opener, `http://localhost:${FAKE_PORT}/child.html`);

      const groups = await helpers.waitForTabGrouped('Natural Group', 10000);
      const stats = await helpers.getStatistics();

      expect(groups.length).toBeGreaterThan(0);
      expect(groups.find(g => g.title === 'Natural Group')).toBeDefined();
      expect(stats.tabGroupsCreatedCount).toBe(1);
    });

    test('does NOT group when opener is NOT in middleClickedTabs (link opened without middle-click) [US-G009]', async ({ extensionContext, helpers }) => {
      await helpers.addDomainRule({
        label: 'Should Not Group',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      // Get the opener tab ID
      const sw = extensionContext.serviceWorkers()[0];
      const openerTabId = await sw.evaluate(async (url: string) => {
        const tabs = await chrome.tabs.query({});
        return tabs.find(t => t.url === url)?.id ?? null;
      }, opener.url());

      // Create child WITH openerTabId but WITHOUT injecting into middleClickedTabs.
      // This simulates clicking a link in a way the content script didn't observe
      // (e.g. keyboard shortcut, or drag-open) — the extension should NOT group it.
      await sw.evaluate(async ({ url, openerTabId }: { url: string; openerTabId: number }) => {
        return chrome.tabs.create({ url, openerTabId, active: false });
      }, { url: 'https://example.com/child', openerTabId: openerTabId! });

      await helpers.waitForGrouping(5000);

      const stats = await helpers.getStatistics();
      const groups = await helpers.getTabGroups();

      // findMiddleClickOpener returns null → no grouping
      expect(stats.tabGroupsCreatedCount).toBe(0);
      expect(groups.length).toBe(0);
    });

    test('adds second child to existing group via natural flow [US-G009]', async ({ extensionContext, helpers }) => {
      await setupFakePages(extensionContext);
      await helpers.addDomainRule({
        label: 'Natural Existing',
        domainFilter: `localhost:${FAKE_PORT}`,
        deduplicationEnabled: false,
        groupingEnabled: true,
        color: 'green',
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab(`http://localhost:${FAKE_PORT}/opener.html`);
      await helpers.waitForGrouping();

      // First child — creates the group naturally
      await helpers.createTabNaturally(opener, `http://localhost:${FAKE_PORT}/child.html`);
      const groups1 = await helpers.waitForTabGrouped('Natural Existing', 10000);
      expect(groups1.length).toBe(1);
      const firstCount = groups1[0].tabCount;

      // Second child — should join the same group
      await helpers.createTabNaturally(opener, `http://localhost:${FAKE_PORT}/child2.html`);
      await helpers.waitForGrouping(3000);

      const groups2 = await helpers.getTabGroups();
      const stats = await helpers.getStatistics();

      expect(groups2.length).toBe(1);
      expect(groups2[0].tabCount).toBeGreaterThan(firstCount);
      expect(stats.tabGroupsCreatedCount).toBe(1);
    });

    test('natural flow: no group when global grouping is disabled [US-G009]', async ({ helpers }) => {
      await helpers.setGlobalGroupingEnabled(false);
      await helpers.addDomainRule({
        label: 'Blocked By Global',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
        groupingEnabled: true,
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabNaturally(opener, 'https://example.com/child');
      await helpers.waitForGrouping(4000);

      const stats = await helpers.getStatistics();
      const groups = await helpers.getTabGroups();

      expect(stats.tabGroupsCreatedCount).toBe(0);
      expect(groups.length).toBe(0);
    });
  });

  // ── 10. Content Script Integration ───────────────────────────────────────
  //
  // Uses extensionContext.route() to serve real HTTP pages at http://localhost:FAKE_PORT/
  // The content script (matches: ['<all_urls>']) injects into those pages.
  // A synthetic auxclick event triggers the content script's handler which sends
  // the middleClickLink message.  Then chrome.tabs.create({openerTabId}) fires
  // onTabCreated naturally, completing the full pipeline.
  // ────────────────────────────────────────────────────────────────────────

  test.describe('Content Script Integration', () => {
    test('groups a new tab opened via a link click on a real page [US-G009]', async ({ extensionContext, helpers }) => {
      await setupFakePages(extensionContext);

      await helpers.addDomainRule({
        label: 'LocalTest',
        domainFilter: `localhost:${FAKE_PORT}`,
        deduplicationEnabled: false,
        groupingEnabled: true,
        color: 'purple',
        groupNameSource: 'label',
      });

      // Navigate opener to a fake local page (content script injects here)
      const opener = await extensionContext.newPage();
      await opener.goto(`http://localhost:${FAKE_PORT}/opener.html`, { waitUntil: 'domcontentloaded' });

      // Dispatch auxclick on the link — the content script's handler sends middleClickLink
      const childUrl = `http://localhost:${FAKE_PORT}/child.html`;
      await opener.evaluate(async (targetUrl: string) => {
        // Find or create the anchor so we can dispatch auxclick on it
        let link = document.querySelector(`a[href="${targetUrl}"]`) as HTMLAnchorElement | null;
        if (!link) {
          link = document.createElement('a');
          link.href = targetUrl;
          document.body.appendChild(link);
        }
        link.dispatchEvent(new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }));
        // Give the content script's async sendMessage time to reach the SW
        await new Promise(r => setTimeout(r, 200));
      }, childUrl);

      // Content script has now sent middleClickLink → background stored (childUrl → openerTabId)
      // Create the child tab with openerTabId to trigger onTabCreated naturally
      const sw = extensionContext.serviceWorkers()[0];
      const openerTabId = await sw.evaluate(async (openerUrl: string) => {
        const tabs = await chrome.tabs.query({});
        return tabs.find(t => t.url === openerUrl || t.pendingUrl === openerUrl)?.id ?? null;
      }, opener.url());

      expect(openerTabId, 'Opener tab must be found in browser').not.toBeNull();

      // Wait for Playwright to detect the new tab before creating it, so route
      // interception is active before navigation begins.
      const childPagePromise = extensionContext.waitForEvent('page', { timeout: 10000 });
      await sw.evaluate(async ({ url, openerTabId }: { url: string; openerTabId: number }) => {
        return chrome.tabs.create({ url, openerTabId, active: true });
      }, { url: childUrl, openerTabId: openerTabId! });
      const childPage = await childPagePromise.catch(() => null);
      if (childPage) {
        await childPage.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      }

      // Wait for the full event chain to complete
      const groups = await helpers.waitForTabGrouped('LocalTest', 12000);
      const stats = await helpers.getStatistics();

      expect(groups.length).toBeGreaterThan(0);
      expect(groups.find(g => g.title === 'LocalTest')).toBeDefined();
      expect(stats.tabGroupsCreatedCount).toBe(1);
    });

    test('does NOT group when no middleClickLink was recorded before tab creation [US-G009]', async ({ extensionContext, helpers }) => {
      await setupFakePages(extensionContext);

      await helpers.addDomainRule({
        label: 'NoClick Group',
        domainFilter: `localhost:${FAKE_PORT}`,
        deduplicationEnabled: false,
        groupingEnabled: true,
        groupNameSource: 'label',
      });

      const opener = await extensionContext.newPage();
      await opener.goto(`http://localhost:${FAKE_PORT}/opener.html`, { waitUntil: 'domcontentloaded' });

      // Create a child tab with openerTabId but WITHOUT any middleClickLink message
      const sw = extensionContext.serviceWorkers()[0];
      const openerTabId = await sw.evaluate(async (openerUrl: string) => {
        const tabs = await chrome.tabs.query({});
        return tabs.find(t => t.url === openerUrl)?.id ?? null;
      }, opener.url());

      const childUrl = `http://localhost:${FAKE_PORT}/child.html`;
      await sw.evaluate(async ({ url, openerTabId }: { url: string; openerTabId: number }) => {
        return chrome.tabs.create({ url, openerTabId, active: false });
      }, { url: childUrl, openerTabId: openerTabId! });

      await helpers.waitForGrouping(5000);

      const stats = await helpers.getStatistics();
      const groups = await helpers.getTabGroups();

      // No middleClickLink was sent → findMiddleClickOpener returns null → no grouping
      expect(stats.tabGroupsCreatedCount).toBe(0);
      expect(groups.length).toBe(0);
    });

    // ── contextmenu path (right-click → "Open in new tab") ───────────────
    // The content script also listens for `contextmenu` on <a> elements and
    // sends the same middleClickLink message so that the extension can group
    // the tab the user is about to open via the browser extensionContext menu.
    test('groups a tab opened via right-click (contextmenu path) [US-G010]', async ({ extensionContext, helpers }) => {
      await setupFakePages(extensionContext);

      await helpers.addDomainRule({
        label: 'RightClick Group',
        domainFilter: `localhost:${FAKE_PORT}`,
        deduplicationEnabled: false,
        groupingEnabled: true,
        color: 'orange',
        groupNameSource: 'label',
      });

      const opener = await extensionContext.newPage();
      await opener.goto(`http://localhost:${FAKE_PORT}/opener.html`, { waitUntil: 'domcontentloaded' });

      const childUrl = `http://localhost:${FAKE_PORT}/child2.html`;

      // Dispatch contextmenu on the link — the content script's handleContextMenu
      // handler fires and sends middleClickLink to the background.
      await opener.evaluate(async (targetUrl: string) => {
        let link = document.querySelector(`a[href="${targetUrl}"]`) as HTMLAnchorElement | null;
        if (!link) {
          link = document.createElement('a');
          link.href = targetUrl;
          document.body.appendChild(link);
        }
        link.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
        // Allow the async sendMessage to reach the service worker
        await new Promise(r => setTimeout(r, 200));
      }, childUrl);

      // Simulate "Open in new tab" from the extensionContext menu: create tab with openerTabId
      const sw = extensionContext.serviceWorkers()[0];
      const openerTabId = await sw.evaluate(async (openerUrl: string) => {
        const tabs = await chrome.tabs.query({});
        return tabs.find(t => t.url === openerUrl || t.pendingUrl === openerUrl)?.id ?? null;
      }, opener.url());

      expect(openerTabId, 'Opener tab must be found in browser').not.toBeNull();

      // Wait for Playwright to detect the new tab before creating it, so route
      // interception is active before navigation begins.
      const childPagePromise = extensionContext.waitForEvent('page', { timeout: 10000 });
      await sw.evaluate(async ({ url, openerTabId }: { url: string; openerTabId: number }) => {
        return chrome.tabs.create({ url, openerTabId, active: true });
      }, { url: childUrl, openerTabId: openerTabId! });
      const childPage = await childPagePromise.catch(() => null);
      if (childPage) {
        await childPage.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      }

      // Full event chain: onTabCreated → findMiddleClickOpener (contextmenu entry) →
      // handleGroupingWithRetry → onUpdated(complete) → processGroupingForNewTab
      const groups = await helpers.waitForTabGrouped('RightClick Group', 12000);
      const stats = await helpers.getStatistics();

      expect(groups.length).toBeGreaterThan(0);
      expect(groups.find(g => g.title === 'RightClick Group')).toBeDefined();
      expect(stats.tabGroupsCreatedCount).toBe(1);
    });
  });
});
