import { describe, it, expect } from 'vitest';
import { extractDomain, countTotalTabs, buildTreeViewData, chromeGroupColors } from '../../src/utils/tabTreeUtils';
import type { TabTreeData } from '../../src/types/tabTree';

/* Test data factories */

const createSampleData = (): TabTreeData => ({
  groups: [
    {
      id: 1,
      title: 'Jira Tickets',
      color: 'red',
      tabs: [
        { id: 42, title: 'PROJ-123 - Fix bug', url: 'https://jira.company.com/browse/PROJ-123' },
        { id: 43, title: 'PROJ-456 - Add feature', url: 'https://jira.company.com/browse/PROJ-456' },
      ],
    },
    {
      id: 2,
      title: 'Documentation',
      color: 'blue',
      tabs: [
        { id: 50, title: 'MDN Web Docs', url: 'https://developer.mozilla.org/', favIconUrl: 'https://developer.mozilla.org/favicon.ico' },
      ],
    },
  ],
  ungroupedTabs: [
    { id: 99, title: 'Claude.ai', url: 'https://claude.ai/' },
    { id: 100, title: 'Gmail', url: 'https://mail.google.com/' },
  ],
});

const createEmptyData = (): TabTreeData => ({
  groups: [],
  ungroupedTabs: [],
});

const createUngroupedOnlyData = (): TabTreeData => ({
  groups: [],
  ungroupedTabs: [
    { id: 1, title: 'Tab One', url: 'https://example.com/one' },
    { id: 2, title: 'Tab Two', url: 'https://example.com/two' },
  ],
});

const createGroupsOnlyData = (): TabTreeData => ({
  groups: [
    {
      id: 1,
      title: 'Work',
      color: 'purple',
      tabs: [
        { id: 10, title: 'Slack', url: 'https://app.slack.com/' },
        { id: 11, title: 'Notion', url: 'https://www.notion.so/' },
      ],
    },
  ],
  ungroupedTabs: [],
});

/* extractDomain */

describe('extractDomain', () => {
  it('extracts the hostname from a valid URL', () => {
    expect(extractDomain('https://www.example.com/page?q=1')).toBe('www.example.com');
  });

  it('handles URLs without www', () => {
    expect(extractDomain('https://example.com/path')).toBe('example.com');
  });

  it('handles URLs with a port', () => {
    expect(extractDomain('http://localhost:3000/api')).toBe('localhost');
  });

  it('handles URLs with a subdomain', () => {
    expect(extractDomain('https://mail.google.com/mail/u/0/')).toBe('mail.google.com');
  });

  it('returns the raw string when the URL is invalid', () => {
    expect(extractDomain('not-a-url')).toBe('not-a-url');
  });

  it('returns the raw string for an empty string', () => {
    expect(extractDomain('')).toBe('');
  });
});

/* countTotalTabs */

describe('countTotalTabs', () => {
  it('counts every tab (grouped and ungrouped)', () => {
    expect(countTotalTabs(createSampleData())).toBe(5);
  });

  it('returns 0 for empty data', () => {
    expect(countTotalTabs(createEmptyData())).toBe(0);
  });

  it('counts only ungrouped tabs', () => {
    expect(countTotalTabs(createUngroupedOnlyData())).toBe(2);
  });

  it('counts only tabs inside groups', () => {
    expect(countTotalTabs(createGroupsOnlyData())).toBe(2);
  });

  it('does not count groups themselves', () => {
    const data = createSampleData();
    // 2 groups + 5 tabs -> should be 5, not 7.
    expect(countTotalTabs(data)).toBe(5);
  });
});

/* chromeGroupColors */

describe('chromeGroupColors', () => {
  it('exposes the 9 Chrome colors', () => {
    const expectedColors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
    for (const color of expectedColors) {
      expect(chromeGroupColors[color]).toBeDefined();
      expect(chromeGroupColors[color]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

/* buildTreeViewData */

describe('buildTreeViewData', () => {
  describe('flatData', () => {
    it('produces a root node in the first position', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      expect(flatData[0].parent).toBeNull();
      expect(flatData[0].name).toBe('');
    });

    it('contains every node (root + groups + tabs)', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      // 1 root + 2 groups + 3 tabs in groups + 2 ungrouped = 8
      expect(flatData).toHaveLength(8);
    });

    it('marks groups with metadata.type === "group"', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const groups = flatData.filter((n) => n.metadata?.type === 'group');
      expect(groups).toHaveLength(2);
      expect(groups[0].name).toBe('Jira Tickets');
      expect(groups[1].name).toBe('Documentation');
    });

    it('stores the group color in metadata.color', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const jiraGroup = flatData.find((n) => n.name === 'Jira Tickets');
      expect(jiraGroup?.metadata?.color).toBe('red');
    });

    it('stores the groupId in metadata.groupId', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const jiraGroup = flatData.find((n) => n.name === 'Jira Tickets');
      expect(jiraGroup?.metadata?.groupId).toBe(1);
    });

    it('marks tabs with metadata.type === "tab"', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const tabs = flatData.filter((n) => n.metadata?.type === 'tab');
      expect(tabs).toHaveLength(5);
    });

    it('stores the URL and favIconUrl in metadata', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const mdn = flatData.find((n) => n.name === 'MDN Web Docs');
      expect(mdn?.metadata?.url).toBe('https://developer.mozilla.org/');
      expect(mdn?.metadata?.favIconUrl).toBe('https://developer.mozilla.org/favicon.ico');
    });

    it('uses an empty string for favIconUrl when none is provided', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const claude = flatData.find((n) => n.name === 'Claude.ai');
      expect(claude?.metadata?.favIconUrl).toBe('');
    });

    it('places ungrouped tabs as children of the root', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const rootId = flatData[0].id;
      const rootChildren = flatData.filter((n) => n.parent === rootId);
      const ungroupedTabs = rootChildren.filter((n) => n.metadata?.type === 'tab');
      expect(ungroupedTabs).toHaveLength(2);
    });

    it('places grouped tabs as children of their group', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const jiraGroup = flatData.find((n) => n.name === 'Jira Tickets');
      const jiraChildren = flatData.filter((n) => n.parent === jiraGroup?.id);
      expect(jiraChildren).toHaveLength(2);
      expect(jiraChildren.every((c) => c.metadata?.type === 'tab')).toBe(true);
    });
  });

  describe('ID maps', () => {
    it('creates a treeIdToTabId mapping for every tab', () => {
      const { treeIdToTabId } = buildTreeViewData(createSampleData());
      expect(treeIdToTabId.size).toBe(5);
      // Values should be our business tab IDs
      const tabIds = new Set(treeIdToTabId.values());
      expect(tabIds.has(42)).toBe(true);
      expect(tabIds.has(43)).toBe(true);
      expect(tabIds.has(50)).toBe(true);
      expect(tabIds.has(99)).toBe(true);
      expect(tabIds.has(100)).toBe(true);
    });

    it('creates an inverse tabIdToTreeId mapping', () => {
      const { treeIdToTabId, tabIdToTreeId } = buildTreeViewData(createSampleData());
      expect(tabIdToTreeId.size).toBe(5);
      // Round-trip: tabId -> treeId -> tabId should return the original.
      for (const [treeId, tabId] of treeIdToTabId) {
        expect(tabIdToTreeId.get(tabId)).toBe(treeId);
      }
    });

    it('populates allTabTreeIds with the internal tab IDs', () => {
      const { allTabTreeIds, treeIdToTabId } = buildTreeViewData(createSampleData());
      expect(allTabTreeIds.size).toBe(5);
      // allTabTreeIds should contain the same keys as treeIdToTabId
      for (const treeId of treeIdToTabId.keys()) {
        expect(allTabTreeIds.has(treeId)).toBe(true);
      }
    });

    it('does not include groups in the ID maps', () => {
      const { treeIdToTabId, flatData } = buildTreeViewData(createSampleData());
      const groupTreeIds = flatData
        .filter((n) => n.metadata?.type === 'group')
        .map((n) => n.id as number);
      for (const groupId of groupTreeIds) {
        expect(treeIdToTabId.has(groupId)).toBe(false);
      }
    });
  });

  describe('edge cases', () => {
    it('handles empty data', () => {
      const { flatData, treeIdToTabId, tabIdToTreeId, allTabTreeIds } = buildTreeViewData(createEmptyData());
      expect(flatData).toHaveLength(1); // root only
      expect(treeIdToTabId.size).toBe(0);
      expect(tabIdToTreeId.size).toBe(0);
      expect(allTabTreeIds.size).toBe(0);
    });

    it('handles ungrouped tabs only', () => {
      const { flatData, treeIdToTabId } = buildTreeViewData(createUngroupedOnlyData());
      // 1 root + 2 ungrouped tabs = 3
      expect(flatData).toHaveLength(3);
      expect(treeIdToTabId.size).toBe(2);
    });

    it('handles groups only', () => {
      const { flatData, treeIdToTabId } = buildTreeViewData(createGroupsOnlyData());
      // 1 root + 1 group + 2 tabs = 4
      expect(flatData).toHaveLength(4);
      expect(treeIdToTabId.size).toBe(2);
    });
  });
});
