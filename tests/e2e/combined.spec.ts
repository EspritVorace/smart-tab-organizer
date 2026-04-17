/**
 * E2E Tests for Combined Deduplication and Grouping
 *
 * Tests scenarios where both features work together or interact with each other.
 */

import { test, expect } from './fixtures';

test.describe('Combined Deduplication and Grouping', () => {
  test.beforeEach(async ({ helpers }) => {
    await helpers.closeAllTestTabs();
    await helpers.clearAllTabGroups();
    await helpers.clearDomainRules();
    await helpers.setGlobalGroupingEnabled(true);
    await helpers.setGlobalDeduplicationEnabled(true);
    // Pin the legacy dedup defaults these combined scenarios were written
    // against (unmatched-domain dedup on, keep-old tie-breaker).
    await helpers.setDeduplicateUnmatchedDomains(true);
    await helpers.setDeduplicationKeepStrategy('keep-old');
    await helpers.resetStatistics();
  });

  // ── 1. Both Features Enabled ──────────────────────────────────────────────

  test.describe('Both Features Enabled', () => {
    test('groups a child tab AND deduplicates a subsequent duplicate [US-C001]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Combined Rule',
        domainFilter: 'example.com',
        enabled: true,
        groupingEnabled: true,
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
        color: 'blue',
        groupNameSource: 'label',
      });

      // Opener + child → group is created
      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');
      await helpers.waitForGrouping();

      let stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(1);

      // Duplicate of child → deduplicated
      await helpers.createTab('https://example.com/child');
      await helpers.waitForDeduplication();

      stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });

    test('duplicate of a plain tab is removed before it can be grouped [US-C001]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Dedup First',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
        groupingEnabled: true,
      });

      const tab1 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();
      const initialTabCount = await helpers.getTabCount();

      // Duplicate → should be removed, NOT grouped
      await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      const finalTabCount = await helpers.getTabCount();

      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
      expect(finalTabCount).toBeLessThanOrEqual(initialTabCount);
    });
  });

  // ── 2. Different Settings Per Feature ────────────────────────────────────

  test.describe('Different Settings Per Feature', () => {
    test('grouping enabled, deduplication disabled: groups child, keeps duplicate [US-C002]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Group Only',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        color: 'green',
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      await helpers.createTabFromOpener(opener, 'https://example.com/child');
      await helpers.waitForGrouping();

      // Duplicate of opener — should NOT be deduplicated
      await helpers.createTab('https://example.com/opener');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(1);
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });

    test('deduplication enabled, grouping disabled: deduplicates but creates no groups [US-C002]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Dedup Only',
        domainFilter: 'example.com',
        groupingEnabled: false,
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      await helpers.createTabFromOpener(opener, 'https://example.com/child');
      await helpers.waitForGrouping();

      // Duplicate of child → deduplicated
      await helpers.createTab('https://example.com/child');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      const groups = await helpers.getTabGroups();

      expect(stats.tabGroupsCreatedCount).toBe(0);
      expect(groups).toHaveLength(0);
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });
  });

  // ── 3. Multiple Rules with Mixed Settings ────────────────────────────────

  test.describe('Multiple Rules with Mixed Settings', () => {
    test('each domain follows its own rule settings [US-C003]', async ({ helpers }) => {
      // example.com → group only
      await helpers.addDomainRule({
        label: 'Example Group Only',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        color: 'blue',
        groupNameSource: 'label',
      });

      // httpbin.org → dedup only
      await helpers.addDomainRule({
        label: 'Test Dedup Only',
        domainFilter: 'httpbin.org',
        groupingEnabled: false,
        deduplicationEnabled: true,
      });

      // Test example.com: group + allow duplicate
      const exampleOpener = await helpers.createTab('https://example.com/page');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(exampleOpener, 'https://example.com/child');
      await helpers.waitForGrouping();

      let stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBeGreaterThan(0);

      // Duplicate of example.com opener — rule says no dedup
      await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      // Test httpbin.org: no group, but dedup
      const t1 = await helpers.createTab('https://httpbin.org/page');
      await helpers.waitForDeduplication();
      const t2 = await helpers.createTab('https://httpbin.org/page');
      await helpers.waitForDeduplication();

      stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });
  });

  // ── 4. Global vs Rule Settings ────────────────────────────────────────────

  test.describe('Global vs Rule Settings', () => {
    test('rule settings override global: both disabled per rule → no action [US-C004]', async ({ helpers }) => {
      await helpers.setGlobalGroupingEnabled(true);
      await helpers.setGlobalDeduplicationEnabled(true);

      await helpers.addDomainRule({
        label: 'Disabled Both',
        domainFilter: 'example.com',
        enabled: true,
        groupingEnabled: false,
        deduplicationEnabled: false,
      });

      const opener = await helpers.createTab('https://example.com/page');
      await helpers.waitForGrouping();

      await helpers.createTabFromOpener(opener, 'https://example.com/child');
      await helpers.waitForGrouping();

      await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(0);
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });

    test('unmatched domains fall back to global settings [US-C004]', async ({ helpers }) => {
      await helpers.setGlobalGroupingEnabled(true);
      await helpers.setGlobalDeduplicationEnabled(true);

      // Rule only for example.com — both features disabled for it
      await helpers.addDomainRule({
        label: 'Example Only',
        domainFilter: 'example.com',
        groupingEnabled: false,
        deduplicationEnabled: false,
      });

      // example.net has no rule → global (enabled) applies
      const tab1 = await helpers.createTab('https://example.net/page');
      await helpers.waitForDeduplication();

      const tab2 = await helpers.createTab('https://example.net/page');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });
  });

  // ── 5. Complex Workflows ──────────────────────────────────────────────────

  test.describe('Complex Workflows', () => {
    test('simulate browsing a GitHub repo: group files, dedup duplicate tabs [US-C005]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'GitHub Project',
        domainFilter: 'github.com',
        groupingEnabled: true,
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
        color: 'purple',
        groupNameSource: 'url',
        urlParsingRegEx: 'github\\.com/([^/]+/[^/]+)',
      });

      // Main repo page
      const repoPage = await helpers.createTab('https://github.com/facebook/react');
      await helpers.waitForGrouping();

      // Open README (should be grouped)
      await helpers.createTabFromOpener(repoPage, 'https://github.com/facebook/react/blob/main/README.md');
      await helpers.waitForGrouping();

      // Open another file (added to group)
      await helpers.createTabFromOpener(repoPage, 'https://github.com/facebook/react/blob/main/src/index.ts');
      await helpers.waitForGrouping();

      // Try to open duplicate of README → deduplicated
      await helpers.createTab('https://github.com/facebook/react/blob/main/README.md');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      const groups = await helpers.getTabGroups();

      expect(stats.tabGroupsCreatedCount).toBe(1);
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
      expect(groups).toHaveLength(1);
    });

    test('simulate two projects each getting their own group [US-C005]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Multi-Project',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: true,
        color: 'blue',
        groupNameSource: 'url',
        urlParsingRegEx: 'example\\.com/projects/(\\w+)',
      });

      // Project A
      const projectA = await helpers.createTab('https://example.com/projects/alpha/main');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(projectA, 'https://example.com/projects/alpha/settings');
      await helpers.waitForGrouping();

      // Project B
      const projectB = await helpers.createTab('https://example.com/projects/beta/main');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(projectB, 'https://example.com/projects/beta/settings');
      await helpers.waitForGrouping();

      const groups = await helpers.getTabGroups();
      const stats = await helpers.getStatistics();

      expect(groups).toHaveLength(2);
      expect(stats.tabGroupsCreatedCount).toBe(2);
    });
  });
});
