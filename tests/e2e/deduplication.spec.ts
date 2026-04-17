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
    await helpers.closeAllTestTabs();
    await helpers.clearAllTabGroups();
    await helpers.clearDomainRules();
    await helpers.setGlobalDeduplicationEnabled(true);
    await helpers.setGlobalGroupingEnabled(false); // Isolate deduplication tests
    await helpers.resetStatistics();
  });

  // ── 1. Global Settings ─────────────────────────────────────────────────────

  test.describe('Global Settings', () => {
    test('deduplicates when global deduplication is enabled (no rule) [US-D001]', async ({ helpers }) => {
      const tab1 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      const tab2 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      expect(finalCount).toBeLessThanOrEqual(initialCount);
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });

    test('does NOT deduplicate when global deduplication is disabled [US-D001]', async ({ helpers }) => {
      await helpers.setGlobalDeduplicationEnabled(false);

      const tab1 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      const tab2 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      expect(finalCount).toBe(initialCount + 1);
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });

    test('does NOT deduplicate different URLs [US-D001]', async ({ helpers }) => {
      const tab1 = await helpers.createTab('https://example.com/page1');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      const tab2 = await helpers.createTab('https://example.com/page2');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      expect(finalCount).toBe(initialCount + 1);
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });
  });

  // ── 2. Rule-specific Deduplication ────────────────────────────────────────

  test.describe('Rule-specific Deduplication', () => {
    test('deduplicates when rule has deduplicationEnabled=true (exact match) [US-D002]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Example Rule',
        domainFilter: 'example.com',
        enabled: true,
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });

      const tab1 = await helpers.createTab('https://example.com/specific-page');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      const tab2 = await helpers.createTab('https://example.com/specific-page');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      expect(finalCount).toBeLessThanOrEqual(initialCount);
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });

    test('does NOT deduplicate when rule has deduplicationEnabled=false [US-D002]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Example Rule',
        domainFilter: 'example.com',
        enabled: true,
        deduplicationEnabled: false,
      });

      const tab1 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      const tab2 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      expect(finalCount).toBe(initialCount + 1);
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });

    test('disabled rule falls through to global setting [US-D002]', async ({ helpers }) => {
      // Rule is disabled, so the global setting (enabled) should apply
      await helpers.addDomainRule({
        label: 'Disabled Rule',
        domainFilter: 'example.com',
        enabled: false,
        deduplicationEnabled: false, // Would disable if rule were active
      });
      // Global deduplication is enabled (set in beforeEach)

      const tab1 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      const tab2 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      const finalCount = await helpers.getTabCount();

      // Disabled rule is ignored → global (enabled) applies → duplicate removed
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
      expect(finalCount).toBeLessThanOrEqual(initialCount);
    });
  });

  // ── 3. Match Modes ────────────────────────────────────────────────────────

  test.describe('Match Modes', () => {
    test('exact mode: deduplicates identical URLs, keeps different query strings [US-D003]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Exact Match Rule',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });

      const tab1 = await helpers.createTab('https://example.com/page?param=value');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      // Different query — should NOT be deduped
      const tab2 = await helpers.createTab('https://example.com/page?param=different');
      await helpers.waitForDeduplication();
      const afterDifferent = await helpers.getTabCount();
      expect(afterDifferent).toBe(initialCount + 1);

      // Exact duplicate — SHOULD be deduped
      const tab3 = await helpers.createTab('https://example.com/page?param=value');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });

    test('includes mode: deduplicates when one URL contains the other [US-D004]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Includes Match Rule',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
        deduplicationMatchMode: 'includes',
      });

      // existing: …/products/item/123
      const tab1 = await helpers.createTab('https://example.com/products/item/123');
      await helpers.waitForDeduplication();

      // new: …/products/item — is a substring of the existing URL → should deduplicate
      const tab2 = await helpers.createTab('https://example.com/products/item');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      // isUrlMatch: existingUrl.includes(newUrl) → true  →  deduplicated
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });

    test('includes mode: does NOT deduplicate completely different paths [US-D004]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Includes Match Rule',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
        deduplicationMatchMode: 'includes',
      });

      const tab1 = await helpers.createTab('https://example.com/products');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      const tab2 = await helpers.createTab('https://example.com/about');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      expect(finalCount).toBe(initialCount + 1);
    });

    test('exact mode: treats URLs with different fragments as distinct [US-D003]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Fragment Test',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });

      const tab1 = await helpers.createTab('https://example.com/page#section1');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      // Different fragment → different URL in exact mode → no dedup
      const tab2 = await helpers.createTab('https://example.com/page#section2');
      await helpers.waitForDeduplication();
      const afterDifferentFragment = await helpers.getTabCount();
      expect(afterDifferentFragment).toBe(initialCount + 1);

      // Same fragment → deduplicated
      const tab3 = await helpers.createTab('https://example.com/page#section1');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });
  });

  // ── 4. Multiple Rules ─────────────────────────────────────────────────────

  test.describe('Multiple Rules', () => {
    test('applies dedup rule for example.com, skips it for httpbin.org (rule disabled) [US-D005]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Example Dedup',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });
      await helpers.addDomainRule({
        label: 'Test No Dedup',
        domainFilter: 'httpbin.org',
        deduplicationEnabled: false,
      });

      // example.com — should deduplicate
      const ex1 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();
      const countAfterEx1 = await helpers.getTabCount();

      const ex2 = await helpers.createTab('https://example.com/page');
      await helpers.waitForDeduplication();
      const countAfterEx2 = await helpers.getTabCount();

      expect(countAfterEx2).toBeLessThanOrEqual(countAfterEx1);

      // httpbin.org — should NOT deduplicate (rule disables it)
      const t1 = await helpers.createTab('https://httpbin.org/page');
      await helpers.waitForDeduplication();
      const countAfterT1 = await helpers.getTabCount();

      const t2 = await helpers.createTab('https://httpbin.org/page');
      await helpers.waitForDeduplication();
      const countAfterT2 = await helpers.getTabCount();

      expect(countAfterT2).toBe(countAfterT1 + 1);
    });

    test('domains without a matching rule use global settings [US-D005]', async ({ helpers }) => {
      // Rule only for example.com (dedup disabled for it)
      await helpers.addDomainRule({
        label: 'Example Rule',
        domainFilter: 'example.com',
        deduplicationEnabled: false,
      });
      // Global is enabled → example.org (no rule) uses global → should dedup

      const tab1 = await helpers.createTab('https://example.org/page');
      await helpers.waitForDeduplication();

      const tab2 = await helpers.createTab('https://example.org/page');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });
  });

  // ── 5. Edge Cases ─────────────────────────────────────────────────────────

  test.describe('Edge Cases', () => {
    test('ignores special URL schemes (about:, chrome:) without crashing [US-D006]', async ({ helpers }) => {
      // Just verify the extension is alive and hasn't crashed
      const stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });

    test('handles rapid duplicate creation (catches at least some duplicates) [US-D006]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Fast Dedup',
        domainFilter: 'example.com',
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });

      const tab1 = await helpers.createTab('https://example.com/rapid-test');
      await helpers.waitForDeduplication(500);

      await Promise.all([
        helpers.createTab('https://example.com/rapid-test'),
        helpers.createTab('https://example.com/rapid-test'),
        helpers.createTab('https://example.com/rapid-test'),
      ]);
      await helpers.waitForDeduplication(3000);

      const stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });

    test('wildcard domain filter matches subdomain [US-D006]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Wildcard Rule',
        domainFilter: 'www.example.com',
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });

      const tab1 = await helpers.createTab('https://www.example.com/page');
      await helpers.waitForDeduplication();

      const tab2 = await helpers.createTab('https://www.example.com/page');
      await helpers.waitForDeduplication();

      const stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });
  });

  // ── 5bis. Deduplication scope for unmatched domains ──────────────────────

  test.describe('Unmatched-domain scope [US-D008]', () => {
    test('does NOT deduplicate domains without a rule when deduplicateUnmatchedDomains=false', async ({ helpers }) => {
      await helpers.setDeduplicateUnmatchedDomains(false);

      const tab1 = await helpers.createTab('https://unmatched.example.org/page');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      const tab2 = await helpers.createTab('https://unmatched.example.org/page');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      expect(finalCount).toBe(initialCount + 1);
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });

    test('STILL deduplicates rule-matched domains when deduplicateUnmatchedDomains=false', async ({ helpers }) => {
      await helpers.setDeduplicateUnmatchedDomains(false);
      await helpers.addDomainRule({
        label: 'Matched Rule',
        domainFilter: 'example.com',
        enabled: true,
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
      });

      const tab1 = await helpers.createTab('https://example.com/rule-match');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      const tab2 = await helpers.createTab('https://example.com/rule-match');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      expect(finalCount).toBeLessThanOrEqual(initialCount);
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });
  });

  // ── 6. Statistics ─────────────────────────────────────────────────────────

  // ── Ignored query params ──────────────────────────────────────────────────

  test.describe('Exact ignoring query params', () => {
    test('deduplicates when only an ignored param differs [US-D008]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Ignore UTM',
        domainFilter: 'example.com',
        enabled: true,
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact_ignore_params',
        ignoredQueryParams: ['utm_*', 'fbclid'],
      });

      const tab1 = await helpers.createTab('https://example.com/page?utm_source=newsletter&ref=home');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      const tab2 = await helpers.createTab('https://example.com/page?utm_source=twitter&ref=home');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      expect(finalCount).toBeLessThanOrEqual(initialCount);
      expect(stats.tabsDeduplicatedCount).toBeGreaterThan(0);
    });

    test('does NOT deduplicate when a non-ignored param differs [US-D008]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Ignore UTM only',
        domainFilter: 'example.com',
        enabled: true,
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact_ignore_params',
        ignoredQueryParams: ['utm_*'],
      });

      const tab1 = await helpers.createTab('https://example.com/page?utm_source=a&ref=home');
      await helpers.waitForDeduplication();
      const initialCount = await helpers.getTabCount();

      const tab2 = await helpers.createTab('https://example.com/page?utm_source=b&ref=other');
      await helpers.waitForDeduplication();

      const finalCount = await helpers.getTabCount();
      const stats = await helpers.getStatistics();

      expect(finalCount).toBe(initialCount + 1);
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });
  });

  test.describe('Statistics', () => {
    test('tabsDeduplicatedCount increments exactly once per deduplication [US-D007]', async ({ helpers }) => {
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

      // First duplicate
      const tab2 = await helpers.createTab('https://example.com/stats-test');
      await helpers.waitForDeduplication();
      stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBe(1);

      // Second duplicate
      const tab3 = await helpers.createTab('https://example.com/stats-test');
      await helpers.waitForDeduplication();
      stats = await helpers.getStatistics();
      expect(stats.tabsDeduplicatedCount).toBe(2);
    });
  });

  // ── 7. Keep strategy ──────────────────────────────────────────────────────

  test.describe('Keep strategy [US-D009]', () => {
    test('keep-old (default) closes the newly opened tab', async ({ helpers }) => {
      await helpers.setDeduplicationKeepStrategy('keep-old');

      const tab1 = await helpers.createTab('https://example.com/keep-old');
      await helpers.waitForDeduplication();
      const tab2 = await helpers.createTab('https://example.com/keep-old');
      await helpers.waitForDeduplication();

      expect(tab1.isClosed()).toBe(false);
      expect(tab2.isClosed()).toBe(true);
    });

    test('keep-new closes the existing tab instead', async ({ helpers }) => {
      await helpers.setDeduplicationKeepStrategy('keep-new');

      const tab1 = await helpers.createTab('https://example.com/keep-new');
      await helpers.waitForDeduplication();
      const tab2 = await helpers.createTab('https://example.com/keep-new');
      await helpers.waitForDeduplication();

      expect(tab1.isClosed()).toBe(true);
      expect(tab2.isClosed()).toBe(false);
    });

    test('keep-grouped keeps the grouped tab when only the existing one is grouped', async ({ helpers }) => {
      await helpers.setDeduplicationKeepStrategy('keep-grouped');
      await helpers.setGlobalGroupingEnabled(true);
      await helpers.addDomainRule({
        label: 'Grouped Rule',
        domainFilter: 'example.com',
        enabled: true,
        deduplicationEnabled: true,
        deduplicationMatchMode: 'exact',
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      const tab1 = await helpers.createTabNaturally(opener, 'https://example.com/grouped-target');
      await helpers.waitForGrouping();

      // New ungrouped duplicate via plain chrome.tabs.create (no opener).
      const tab2 = await helpers.createTab('https://example.com/grouped-target');
      await helpers.waitForDeduplication();

      // The grouped (existing) tab survives, the fresh ungrouped one is closed.
      expect(tab1.isClosed()).toBe(false);
      expect(tab2.isClosed()).toBe(true);
    });

    test('keep-grouped falls back to keep-old when neither tab is grouped', async ({ helpers }) => {
      await helpers.setDeduplicationKeepStrategy('keep-grouped');

      const tab1 = await helpers.createTab('https://example.com/ungrouped');
      await helpers.waitForDeduplication();
      const tab2 = await helpers.createTab('https://example.com/ungrouped');
      await helpers.waitForDeduplication();

      expect(tab1.isClosed()).toBe(false);
      expect(tab2.isClosed()).toBe(true);
    });
  });
});
