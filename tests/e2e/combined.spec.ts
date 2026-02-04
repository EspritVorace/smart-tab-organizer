/**
 * E2E Tests for Combined Deduplication and Grouping
 *
 * Tests scenarios where both features work together
 */

import { test, expect } from './fixtures';

test.describe('Combined Deduplication and Grouping', () => {
  test.beforeEach(async ({ helpers }) => {
    // Reset state before each test
    await helpers.clearDomainRules();
    await helpers.setGlobalGroupingEnabled(true);
    await helpers.setGlobalDeduplicationEnabled(true);
    await helpers.resetStatistics();
  });

  test.describe('Both Features Enabled', () => {
    test('should both group and deduplicate with same rule', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Combined Rule',
        domainFilter: 'example.com',
        enabled: true,
        groupingEnabled: true,
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
        color: 'blue',
      });

      // Create opener tab
      const openerPage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      // Create child tab (should be grouped)
      const childPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      let stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(1);

      // Create duplicate of child (should be deduplicated)
      const duplicatePage = await helpers.createTab('https://example.com/child');
      await helpers.waitForDeduplication();

      stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });

    test('should deduplicate before grouping can occur', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Dedup First',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
        groupingEnabled: true,
      });

      // Create first tab
      const tab1 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const initialTabCount = await helpers.getTabCount();

      // Create duplicate - should be deduplicated, not grouped
      const tab2 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      const finalTabCount = await helpers.getTabCount();

      // Duplicate should be removed
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
      // Tab count should not increase
      expect(finalTabCount).toBeLessThanOrEqual(initialTabCount);
    });
  });

  test.describe('Different Settings Per Feature', () => {
    test('grouping enabled, deduplication disabled', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Group Only',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        color: 'green',
      });

      const openerPage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      // Create child (should be grouped)
      const childPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      // Create duplicate of opener (should NOT be deduplicated)
      const duplicatePage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();

      expect(stats.tabGroupsCreatedCount).toBe(1);
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });

    test('deduplication enabled, grouping disabled', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Dedup Only',
        domainFilter: 'example.com',
        groupingEnabled: false,
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });

      const openerPage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      // Create child (should NOT be grouped)
      const childPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      // Create duplicate (should be deduplicated)
      const duplicatePage = await helpers.createTab('https://example.com/child');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      const groups = await helpers.getTabGroups();

      expect(stats.tabGroupsCreatedCount).toBe(0);
      expect(groups.length).toBe(0);
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });
  });

  test.describe('Multiple Rules with Different Settings', () => {
    test('should apply correct settings per domain', async ({ helpers }) => {
      // Rule 1: example.com - group only
      await helpers.addDomainRule({
        label: 'Example Group Only',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        color: 'blue',
      });

      // Rule 2: test.com - dedup only
      await helpers.addDomainRule({
        label: 'Test Dedup Only',
        domainFilter: 'test.com',
        groupingEnabled: false,
        deduplicationEnabled: true,
      });

      // Rule 3: other.com - both enabled
      await helpers.addDomainRule({
        label: 'Other Both',
        domainFilter: 'other.com',
        groupingEnabled: true,
        deduplicationEnabled: true,
        color: 'red',
      });

      // Test example.com (group only)
      const exampleOpener = await helpers.createTab('https://example.com/page');
      await helpers.waitForGrouping();
      const exampleChild = await helpers.createTabFromOpener(exampleOpener, 'https://example.com/child');
      await helpers.waitForGrouping();
      const exampleDup = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      let stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBeGreaterThan(0);

      // Test test.com (dedup only)
      const testTab1 = await helpers.createTab('https://test.com/page');
      await helpers.waitForDeduplication();
      const testTab2 = await helpers.createTab('https://test.com/page');
      await helpers.waitForDeduplication();

      stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);

      // Test other.com (both)
      const otherOpener = await helpers.createTab('https://other.com/page');
      await helpers.waitForGrouping();
      const otherChild = await helpers.createTabFromOpener(otherOpener, 'https://other.com/child');
      await helpers.waitForGrouping();
    });
  });

  test.describe('Global vs Rule Settings', () => {
    test('rule settings should override global settings', async ({ helpers }) => {
      // Global: both enabled
      await helpers.setGlobalGroupingEnabled(true);
      await helpers.setGlobalDeduplicationEnabled(true);

      // Rule: both disabled for specific domain
      await helpers.addDomainRule({
        label: 'Disabled Both',
        domainFilter: 'example.com',
        enabled: true,
        groupingEnabled: false,
        deduplicationEnabled: false,
      });

      const openerPage = await helpers.createTab('https://example.com/page');
      await helpers.waitForGrouping();

      const childPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      const duplicatePage = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();

      // Rule overrides global - neither should happen
      expect(stats.tabGroupsCreatedCount).toBe(0);
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });

    test('domains without rules should use global settings', async ({ helpers }) => {
      // Global: both enabled
      await helpers.setGlobalGroupingEnabled(true);
      await helpers.setGlobalDeduplicationEnabled(true);

      // Rule only for example.com
      await helpers.addDomainRule({
        label: 'Example Only',
        domainFilter: 'example.com',
        groupingEnabled: false,
        deduplicationEnabled: false,
      });

      // Test on unmatched domain (should use global settings)
      const tab1 = await helpers.createTab('https://unmatched.com/page');
      await helpers.waitForDeduplication();
      const tab2 = await helpers.createTab('https://unmatched.com/page');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();

      // Should deduplicate using global settings
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });
  });

  test.describe('Complex Workflows', () => {
    test('workflow: open project, browse files, avoid duplicates', async ({ helpers }) => {
      // Simulate a dev workflow with GitHub
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

      // Open main repo page
      const repoPage = await helpers.createTab('https://github.com/user/project');
      await helpers.waitForGrouping();

      // Open file from repo (should be grouped)
      const filePage = await helpers.createTabFromOpener(repoPage, 'https://github.com/user/project/blob/main/README.md');
      await helpers.waitForGrouping();

      // Open another file (should be added to group)
      const file2Page = await helpers.createTabFromOpener(repoPage, 'https://github.com/user/project/blob/main/src/index.ts');
      await helpers.waitForGrouping();

      // Try to open duplicate of first file (should be deduplicated)
      const dupPage = await helpers.createTab('https://github.com/user/project/blob/main/README.md');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      const groups = await helpers.getTabGroups();

      expect(stats.tabGroupsCreatedCount).toBe(1);
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
      expect(groups.length).toBe(1);
    });

    test('workflow: multiple projects, each with own group', async ({ helpers }) => {
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
      const projectAOpener = await helpers.createTab('https://example.com/projects/alpha/main');
      await helpers.waitForGrouping();
      const projectAChild = await helpers.createTabFromOpener(projectAOpener, 'https://example.com/projects/alpha/settings');
      await helpers.waitForGrouping();

      // Project B
      const projectBOpener = await helpers.createTab('https://example.com/projects/beta/main');
      await helpers.waitForGrouping();
      const projectBChild = await helpers.createTabFromOpener(projectBOpener, 'https://example.com/projects/beta/settings');
      await helpers.waitForGrouping();

      const groups = await helpers.getTabGroups();
      const stats = await helpers.getStatistics();

      // Should have 2 separate groups (one per project)
      expect(groups.length).toBe(2);
      expect(stats.tabGroupsCreatedCount).toBe(2);
    });
  });
});
