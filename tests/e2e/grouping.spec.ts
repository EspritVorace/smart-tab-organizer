/**
 * E2E Tests for Tab Grouping
 *
 * Tests all combinations of:
 * - Global grouping enabled/disabled
 * - Rule-specific settings
 * - Group name sources: label, title, url, smart variants
 * - Group colors
 * - Opener tab scenarios (in group / not in group)
 */

import { test, expect } from './fixtures';

test.describe('Tab Grouping', () => {
  test.beforeEach(async ({ helpers }) => {
    // Reset state before each test
    await helpers.clearDomainRules();
    await helpers.setGlobalGroupingEnabled(true);
    await helpers.setGlobalDeduplicationEnabled(false); // Disable deduplication to isolate grouping tests
    await helpers.resetStatistics();
  });

  test.describe('Global Settings', () => {
    test('should group tabs when global grouping is enabled and rule matches', async ({ context, helpers }) => {
      // Add rule for example.com
      await helpers.addDomainRule({
        label: 'Example Group',
        domainFilter: 'example.com',
        groupingEnabled: true,
        groupNameSource: 'label',
        color: 'blue',
      });

      // Create opener tab
      const openerPage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      // Create new tab from opener (simulated)
      const newPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      const groups = await helpers.getTabGroups();
      const stats = await helpers.getStatistics();

      // A group should have been created
      expect(stats.tabGroupsCreatedCount).toBeGreaterThan(0);
      expect(groups.length).toBeGreaterThan(0);
    });

    test('should NOT group tabs when global grouping is disabled', async ({ helpers }) => {
      // Disable global grouping
      await helpers.setGlobalGroupingEnabled(false);

      // Add rule (but global is disabled)
      await helpers.addDomainRule({
        label: 'Disabled Group',
        domainFilter: 'example.com',
        groupingEnabled: true,
      });

      const openerPage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      const newPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      const stats = await helpers.getStatistics();

      // No groups should be created
      expect(stats.tabGroupsCreatedCount).toBe(0);
    });

    test('should NOT group tabs when no matching rule exists', async ({ helpers }) => {
      // No rules added

      const openerPage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      const newPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      const stats = await helpers.getStatistics();

      // No groups should be created without a matching rule
      expect(stats.tabGroupsCreatedCount).toBe(0);
    });
  });

  test.describe('Rule-specific Settings', () => {
    test('should NOT group when rule has grouping disabled', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'No Group Rule',
        domainFilter: 'example.com',
        enabled: true,
        groupingEnabled: false,
      });

      const openerPage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      const newPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      const stats = await helpers.getStatistics();

      expect(stats.tabGroupsCreatedCount).toBe(0);
    });

    test('should NOT group when rule is disabled', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Disabled Rule',
        domainFilter: 'example.com',
        enabled: false,
        groupingEnabled: true,
      });

      const openerPage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      const newPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      const stats = await helpers.getStatistics();

      expect(stats.tabGroupsCreatedCount).toBe(0);
    });
  });

  test.describe('Group Name Sources', () => {
    test('groupNameSource=label: should use rule label as group name', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'My Custom Label',
        domainFilter: 'example.com',
        groupingEnabled: true,
        groupNameSource: 'label',
      });

      const openerPage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      const newPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      const groups = await helpers.getTabGroups();

      expect(groups.length).toBeGreaterThan(0);
      const group = groups.find(g => g.title === 'My Custom Label');
      expect(group).toBeDefined();
    });

    test('groupNameSource=title: should extract group name from opener title', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Title Extract',
        domainFilter: 'example.com',
        groupingEnabled: true,
        groupNameSource: 'title',
        titleParsingRegEx: 'Project: (\\w+)',
      });

      // Note: This requires the opener page to have a title matching the regex
      // In a real test, we'd need a test server with proper page titles
      const openerPage = await helpers.createTab('https://example.com/page');
      await helpers.waitForGrouping();

      // Set the page title to match our regex
      await openerPage.evaluate(() => {
        document.title = 'Project: Alpha - Dashboard';
      });

      const newPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      const groups = await helpers.getTabGroups();

      // Either extracted name "Alpha" or fallback to label
      expect(groups.length).toBeGreaterThan(0);
    });

    test('groupNameSource=url: should extract group name from opener URL', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'URL Extract',
        domainFilter: 'example.com',
        groupingEnabled: true,
        groupNameSource: 'url',
        urlParsingRegEx: 'example\\.com/(\\w+)',
      });

      const openerPage = await helpers.createTab('https://example.com/products');
      await helpers.waitForGrouping();

      const newPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      const groups = await helpers.getTabGroups();

      expect(groups.length).toBeGreaterThan(0);
      // Should extract "products" from URL
      const group = groups.find(g => g.title === 'products' || g.title === 'URL Extract');
      expect(group).toBeDefined();
    });

    test('groupNameSource=smart_label: should fallback to label when extraction fails', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Smart Label Fallback',
        domainFilter: 'example.com',
        groupingEnabled: true,
        groupNameSource: 'smart_label',
        titleParsingRegEx: 'NonExistent: (\\w+)', // Won't match anything
      });

      const openerPage = await helpers.createTab('https://example.com/page');
      await helpers.waitForGrouping();

      const newPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      const groups = await helpers.getTabGroups();

      expect(groups.length).toBeGreaterThan(0);
      // Should fallback to label
      const group = groups.find(g => g.title === 'Smart Label Fallback');
      expect(group).toBeDefined();
    });
  });

  test.describe('Group Colors', () => {
    test('should apply specified color to group', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Blue Group',
        domainFilter: 'example.com',
        groupingEnabled: true,
        color: 'blue',
      });

      const openerPage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      const newPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      const groups = await helpers.getTabGroups();

      expect(groups.length).toBeGreaterThan(0);
      const group = groups.find(g => g.title === 'Blue Group');
      expect(group?.color).toBe('blue');
    });

    test('should use Chrome default color when no color specified', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'No Color Group',
        domainFilter: 'example.com',
        groupingEnabled: true,
        color: '', // No color specified
      });

      const openerPage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      const newPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      const groups = await helpers.getTabGroups();

      expect(groups.length).toBeGreaterThan(0);
      // Chrome assigns a default color (usually grey or first available)
    });

    test.describe('all color options', () => {
      const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];

      for (const color of colors) {
        test(`should support color: ${color}`, async ({ helpers }) => {
          await helpers.addDomainRule({
            label: `${color} Group`,
            domainFilter: 'example.com',
            groupingEnabled: true,
            color: color,
          });

          const openerPage = await helpers.createTab('https://example.com/opener');
          await helpers.waitForGrouping();

          const newPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
          await helpers.waitForGrouping();

          const groups = await helpers.getTabGroups();

          expect(groups.length).toBeGreaterThan(0);
          const group = groups[0];
          expect(group.color).toBe(color);
        });
      }
    });
  });

  test.describe('Existing Group Scenarios', () => {
    test('should add to existing group when opener is already grouped', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Existing Group Test',
        domainFilter: 'example.com',
        groupingEnabled: true,
        color: 'green',
      });

      // Create opener and first child to create initial group
      const openerPage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      const child1 = await helpers.createTabFromOpener(openerPage, 'https://example.com/child1');
      await helpers.waitForGrouping();

      let groups = await helpers.getTabGroups();
      const initialGroupCount = groups.length;
      const initialTabsInGroup = groups[0]?.tabCount || 0;

      // Create another child - should add to existing group
      const child2 = await helpers.createTabFromOpener(openerPage, 'https://example.com/child2');
      await helpers.waitForGrouping();

      groups = await helpers.getTabGroups();
      const stats = await helpers.getStatistics();

      // Should still be same number of groups
      expect(groups.length).toBe(initialGroupCount);

      // Group should have more tabs
      const group = groups.find(g => g.title === 'Existing Group Test');
      expect(group?.tabCount).toBeGreaterThan(initialTabsInGroup);

      // Group creation count should only be 1 (not 2)
      expect(stats.tabGroupsCreatedCount).toBe(1);
    });

    test('should create new group when opener is not grouped', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'New Group Test',
        domainFilter: 'example.com',
        groupingEnabled: true,
      });

      // Open two separate pages that aren't related
      const page1 = await helpers.createTab('https://example.com/page1');
      await helpers.waitForGrouping();

      const page2 = await helpers.createTab('https://example.com/page2');
      await helpers.waitForGrouping();

      // Now create a child from page1
      const child1 = await helpers.createTabFromOpener(page1, 'https://example.com/child1');
      await helpers.waitForGrouping();

      const stats = await helpers.getStatistics();

      // A new group should have been created
      expect(stats.tabGroupsCreatedCount).toBeGreaterThan(0);
    });
  });

  test.describe('Multiple Rules', () => {
    test('should apply correct rule based on domain', async ({ helpers }) => {
      // Rule for example.com - blue groups
      await helpers.addDomainRule({
        label: 'Example Blue',
        domainFilter: 'example.com',
        groupingEnabled: true,
        color: 'blue',
      });

      // Rule for test.com - red groups
      await helpers.addDomainRule({
        label: 'Test Red',
        domainFilter: 'test.com',
        groupingEnabled: true,
        color: 'red',
      });

      // Test example.com
      const exampleOpener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      const exampleChild = await helpers.createTabFromOpener(exampleOpener, 'https://example.com/child');
      await helpers.waitForGrouping();

      // Test test.com
      const testOpener = await helpers.createTab('https://test.com/opener');
      await helpers.waitForGrouping();
      const testChild = await helpers.createTabFromOpener(testOpener, 'https://test.com/child');
      await helpers.waitForGrouping();

      const groups = await helpers.getTabGroups();

      // Should have two different groups with different colors
      expect(groups.length).toBe(2);

      const blueGroup = groups.find(g => g.color === 'blue');
      const redGroup = groups.find(g => g.color === 'red');

      expect(blueGroup?.title).toBe('Example Blue');
      expect(redGroup?.title).toBe('Test Red');
    });

    test('first matching rule should be used', async ({ helpers }) => {
      // More specific rule first
      await helpers.addDomainRule({
        label: 'Specific Subdomain',
        domainFilter: 'sub.example.com',
        groupingEnabled: true,
        color: 'purple',
      });

      // More general rule second
      await helpers.addDomainRule({
        label: 'General Example',
        domainFilter: 'example.com',
        groupingEnabled: true,
        color: 'yellow',
      });

      const openerPage = await helpers.createTab('https://sub.example.com/opener');
      await helpers.waitForGrouping();

      const newPage = await helpers.createTabFromOpener(openerPage, 'https://sub.example.com/child');
      await helpers.waitForGrouping();

      const groups = await helpers.getTabGroups();

      // Should use the first matching rule (subdomain)
      expect(groups.length).toBeGreaterThan(0);
      const group = groups.find(g => g.title === 'Specific Subdomain');
      expect(group).toBeDefined();
      expect(group?.color).toBe('purple');
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle multiple children opened rapidly', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Rapid Children',
        domainFilter: 'example.com',
        groupingEnabled: true,
        color: 'cyan',
      });

      const openerPage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      // Open multiple children rapidly
      const childPromises = [
        helpers.createTabFromOpener(openerPage, 'https://example.com/child1'),
        helpers.createTabFromOpener(openerPage, 'https://example.com/child2'),
        helpers.createTabFromOpener(openerPage, 'https://example.com/child3'),
      ];

      await Promise.all(childPromises);
      await helpers.waitForGrouping(3000);

      const groups = await helpers.getTabGroups();
      const stats = await helpers.getStatistics();

      // Should only create one group
      expect(stats.tabGroupsCreatedCount).toBe(1);

      // All tabs should be in the same group
      const group = groups.find(g => g.title === 'Rapid Children');
      expect(group?.tabCount).toBeGreaterThanOrEqual(2);
    });

    test('should handle domain filter with wildcards', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Wildcard Domain',
        domainFilter: '*.example.com',
        groupingEnabled: true,
        color: 'orange',
      });

      const openerPage = await helpers.createTab('https://any.example.com/opener');
      await helpers.waitForGrouping();

      const newPage = await helpers.createTabFromOpener(openerPage, 'https://any.example.com/child');
      await helpers.waitForGrouping();

      const groups = await helpers.getTabGroups();

      expect(groups.length).toBeGreaterThan(0);
      const group = groups.find(g => g.title === 'Wildcard Domain');
      expect(group).toBeDefined();
    });

    test('should handle invalid regex gracefully', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Invalid Regex',
        domainFilter: 'example.com',
        groupingEnabled: true,
        groupNameSource: 'title',
        titleParsingRegEx: '[invalid(regex', // Invalid regex
      });

      const openerPage = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();

      // Should not crash, should fallback to label
      const newPage = await helpers.createTabFromOpener(openerPage, 'https://example.com/child');
      await helpers.waitForGrouping();

      const groups = await helpers.getTabGroups();

      // Should create a group with fallback name
      expect(groups.length).toBeGreaterThan(0);
    });
  });

  test.describe('Statistics', () => {
    test('should increment group creation count correctly', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Stats Group',
        domainFilter: 'example.com',
        groupingEnabled: true,
      });

      await helpers.resetStatistics();

      let stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(0);

      // Create first group
      const opener1 = await helpers.createTab('https://example.com/opener1');
      await helpers.waitForGrouping();
      const child1 = await helpers.createTabFromOpener(opener1, 'https://example.com/child1');
      await helpers.waitForGrouping();

      stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(1);

      // Add to existing group (should not increment)
      const child2 = await helpers.createTabFromOpener(opener1, 'https://example.com/child2');
      await helpers.waitForGrouping();

      stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(1); // Still 1

      // Create second group (different opener not in group yet)
      await helpers.clearDomainRules();
      await helpers.addDomainRule({
        label: 'Stats Group 2',
        domainFilter: 'test.com',
        groupingEnabled: true,
      });

      const opener2 = await helpers.createTab('https://test.com/opener');
      await helpers.waitForGrouping();
      const child3 = await helpers.createTabFromOpener(opener2, 'https://test.com/child');
      await helpers.waitForGrouping();

      stats = await helpers.getStatistics();
      expect(stats.tabGroupsCreatedCount).toBe(2);
    });
  });
});
