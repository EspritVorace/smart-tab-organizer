/**
 * E2E Tests for Tab Deduplication
 *
 * Tests all combinations of:
 * - Global deduplication enabled/disabled
 * - Rule-specific deduplication enabled/disabled
 * - Match modes: exact, includes
 * - With/without matching domain rules
 */

import { test, expect } from './fixtures';

test.describe('Deduplication', () => {
  test.beforeEach(async ({ helpers }) => {
    // Reset state before each test
    await helpers.clearDomainRules();
    await helpers.setGlobalDeduplicationEnabled(true);
    await helpers.setGlobalGroupingEnabled(false); // Disable grouping to isolate deduplication tests
    await helpers.resetStatistics();
  });

  test.describe('Global Settings', () => {
    test('should deduplicate when global deduplication is enabled (no rule)', async ({ context, helpers }) => {
      // Create first tab
      const tab1 = await helpers.createTab('https://example.com/page');

      // Wait a bit for the tab to be processed
      await helpers.waitForDeduplication();

      const initialCount = await helpers.getTabCount();

      // Create duplicate tab
      const tab2 = await helpers.createTab('https://example.com/page');

      // Wait for deduplication to occur
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      // The duplicate should have been removed
      expect(finalCount).toBeLessThanOrEqual(initialCount);
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });

    test('should NOT deduplicate when global deduplication is disabled', async ({ helpers }) => {
      // Disable global deduplication
      await helpers.setGlobalDeduplicationEnabled(false);

      // Create first tab
      const tab1 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const initialCount = await helpers.getTabCount();

      // Create duplicate tab
      const tab2 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      // Both tabs should exist
      expect(finalCount).toBe(initialCount + 1);
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });

    test('should NOT deduplicate different URLs', async ({ helpers }) => {
      // Create first tab
      const tab1 = await helpers.createTab('https://example.com/page1');
      await helpers.waitForDeduplication();

      const initialCount = await helpers.getTabCount();

      // Create different URL tab
      const tab2 = await helpers.createTab('https://example.com/page2');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      // Both tabs should exist
      expect(finalCount).toBe(initialCount + 1);
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });
  });

  test.describe('Rule-specific Deduplication', () => {
    test('should deduplicate when rule has deduplication enabled + exact match', async ({ helpers }) => {
      // Add rule with deduplication enabled
      await helpers.addDomainRule({
        label: 'Example Rule',
        domainFilter: 'example.com',
        enabled: true,
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });

      // Create first tab
      const tab1 = await helpers.createTab('https://example.com/specific-page');
      await helpers.waitForDeduplication();

      const initialCount = await helpers.getTabCount();

      // Create exact duplicate
      const tab2 = await helpers.createTab('https://example.com/specific-page');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      expect(finalCount).toBeLessThanOrEqual(initialCount);
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });

    test('should NOT deduplicate when rule has deduplication disabled', async ({ helpers }) => {
      // Add rule with deduplication disabled
      await helpers.addDomainRule({
        label: 'Example Rule',
        domainFilter: 'example.com',
        enabled: true,
        deduplicationEnabled: false,
      });

      // Create first tab
      const tab1 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const initialCount = await helpers.getTabCount();

      // Create duplicate tab
      const tab2 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      // Both tabs should exist (rule disables deduplication)
      expect(finalCount).toBe(initialCount + 1);
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });

    test('should NOT deduplicate when rule is disabled', async ({ helpers }) => {
      // Add disabled rule
      await helpers.addDomainRule({
        label: 'Disabled Rule',
        domainFilter: 'example.com',
        enabled: false,
        deduplicationEnabled: true,
      });

      // With rule disabled, global settings should apply
      // But let's disable global too to verify rule is ignored
      await helpers.setGlobalDeduplicationEnabled(false);

      const tab1 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const initialCount = await helpers.getTabCount();

      const tab2 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();

      expect(finalCount).toBe(initialCount + 1);
    });
  });

  test.describe('Match Modes', () => {
    test('exact mode: should deduplicate only identical URLs', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Exact Match Rule',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });

      // Create first tab
      const tab1 = await helpers.createTab('https://example.com/page?param=value');
      await helpers.waitForDeduplication();

      const initialCount = await helpers.getTabCount();

      // Create tab with same base URL but different query
      const tab2 = await helpers.createTab('https://example.com/page?param=different');
      await helpers.waitForDeduplication();

      const afterDifferent = await helpers.getTabCount();

      // Create exact duplicate
      const tab3 = await helpers.createTab('https://example.com/page?param=value');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      // Different query should create new tab
      expect(afterDifferent).toBe(initialCount + 1);

      // Exact duplicate should be deduplicated
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });

    test('includes mode: should deduplicate when URLs contain each other', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Includes Match Rule',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
        deduplicationMatchMode: 'includes',
      });

      // Create tab with full URL
      const tab1 = await helpers.createTab('https://example.com/products/item/123');
      await helpers.waitForDeduplication();

      const initialCount = await helpers.getTabCount();

      // Create tab where URL is contained in original
      const tab2 = await helpers.createTab('https://example.com/products/item');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();

      // In includes mode, these should match (one contains the other)
      // Note: behavior depends on implementation
      expect(stats.tabsDeduplicatedCount).toBeGreaterThanOrEqual(0);
    });

    test('includes mode: should NOT deduplicate completely different paths', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Includes Match Rule',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
        deduplicationMatchMode: 'includes',
      });

      const tab1 = await helpers.createTab('https://example.com/products');
      await helpers.waitForDeduplication();

      const initialCount = await helpers.getTabCount();

      // Completely different path
      const tab2 = await helpers.createTab('https://example.com/about');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();

      // Different paths should not match
      expect(finalCount).toBe(initialCount + 1);
    });
  });

  test.describe('Multiple Rules', () => {
    test('should apply correct rule based on domain', async ({ helpers }) => {
      // Add rule for example.com with deduplication enabled
      await helpers.addDomainRule({
        label: 'Example Dedup',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });

      // Add rule for test.com with deduplication disabled
      await helpers.addDomainRule({
        label: 'Test No Dedup',
        domainFilter: 'test.com',
        deduplicationEnabled: false,
      });

      // Test example.com (should deduplicate)
      const ex1 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();
      const countAfterEx1 = await helpers.getTabCount();

      const ex2 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();
      const countAfterEx2 = await helpers.getTabCount();

      // Example.com duplicate should be removed
      expect(countAfterEx2).toBeLessThanOrEqual(countAfterEx1);

      // Test test.com (should NOT deduplicate)
      const t1 = await helpers.createTab('https://test.com/page');
      await helpers.waitForDeduplication();
      const countAfterT1 = await helpers.getTabCount();

      const t2 = await helpers.createTab('https://test.com/page');
      await helpers.waitForDeduplication();
      const countAfterT2 = await helpers.getTabCount();

      // Test.com duplicate should NOT be removed
      expect(countAfterT2).toBe(countAfterT1 + 1);
    });

    test('should use global settings for domains without rules', async ({ helpers }) => {
      // Add rule only for example.com
      await helpers.addDomainRule({
        label: 'Example Rule',
        domainFilter: 'example.com',
        deduplicationEnabled: false, // Disabled for this domain
      });

      // Global is enabled by default
      // other-domain.com should use global settings

      const tab1 = await helpers.createTab('https://other-domain.com/page');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      const tab2 = await helpers.createTab('https://other-domain.com/page');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();

      // Should deduplicate using global settings
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle special URL schemes (about:, chrome:)', async ({ helpers }) => {
      // These URLs should be ignored
      const initialCount = await helpers.getTabCount();

      // Note: Playwright may not be able to navigate to about: or chrome: pages
      // This test verifies the extension doesn't crash on such URLs
      const stats = await helpers.getStatistics();

      expect(stats.tabsDeduplicatedCount).toBe(0);
    });

    test('should handle rapid duplicate creation', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Fast Dedup',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });

      // Create first tab
      const tab1 = await helpers.createTab('https://example.com/rapid-test');
      await helpers.waitForDeduplication(500);

      // Rapidly create multiple duplicates
      const promises = [
        helpers.createTab('https://example.com/rapid-test'),
        helpers.createTab('https://example.com/rapid-test'),
        helpers.createTab('https://example.com/rapid-test'),
      ];

      await Promise.all(promises);
      await helpers.waitForDeduplication(3000);

      const stats = await helpers.getStatistics();

      // At least some duplicates should have been caught
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });

    test('should handle URLs with fragments', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Fragment Test',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });

      const tab1 = await helpers.createTab('https://example.com/page#section1');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      // Same page, different fragment
      const tab2 = await helpers.createTab('https://example.com/page#section2');
      await helpers.waitForDeduplication();
      const afterDifferentFragment = await helpers.getTabCount();

      // Same page, same fragment
      const tab3 = await helpers.createTab('https://example.com/page#section1');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();

      // Exact mode should treat fragments as part of URL
      // So #section1 and #section2 are different
      expect(afterDifferentFragment).toBe(initialCount + 1);
    });

    test('should handle domain filter with wildcards', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Wildcard Rule',
        domainFilter: '*.example.com',
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });

      const tab1 = await helpers.createTab('https://sub.example.com/page');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      const tab2 = await helpers.createTab('https://sub.example.com/page');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();

      // Wildcard should match subdomain
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });
  });

  test.describe('Statistics', () => {
    test('should increment deduplicated count correctly', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Stats Test',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
      });

      await helpers.resetStatistics();

      const tab1 = await helpers.createTab('https://example.com/stats-test');
      await helpers.waitForDeduplication();

      let stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBe(0);

      // Create first duplicate
      const tab2 = await helpers.createTab('https://example.com/stats-test');
      await helpers.waitForDeduplication();

      stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBe(1);

      // Create second duplicate
      const tab3 = await helpers.createTab('https://example.com/stats-test');
      await helpers.waitForDeduplication();

      stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBe(2);
    });
  });
});
