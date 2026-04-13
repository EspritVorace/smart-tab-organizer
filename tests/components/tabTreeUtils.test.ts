import { describe, it, expect } from 'vitest';
import { extractDomain, countTotalTabs, buildTreeViewData, chromeGroupColors } from '../../src/utils/tabTreeUtils';
import type { TabTreeData } from '../../src/types/tabTree';

/* ─── Test data factories ─── */

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

/* ─── extractDomain ─── */

describe('extractDomain', () => {
  it('devrait extraire le hostname d\'une URL valide', () => {
    expect(extractDomain('https://www.example.com/page?q=1')).toBe('www.example.com');
  });

  it('devrait gérer les URLs sans www', () => {
    expect(extractDomain('https://example.com/path')).toBe('example.com');
  });

  it('devrait gérer les URLs avec port', () => {
    expect(extractDomain('http://localhost:3000/api')).toBe('localhost');
  });

  it('devrait gérer les URLs avec sous-domaine', () => {
    expect(extractDomain('https://mail.google.com/mail/u/0/')).toBe('mail.google.com');
  });

  it('devrait retourner la chaîne brute si l\'URL est invalide', () => {
    expect(extractDomain('not-a-url')).toBe('not-a-url');
  });

  it('devrait retourner la chaîne brute pour une chaîne vide', () => {
    expect(extractDomain('')).toBe('');
  });
});

/* ─── countTotalTabs ─── */

describe('countTotalTabs', () => {
  it('devrait compter tous les onglets (groupés + non groupés)', () => {
    expect(countTotalTabs(createSampleData())).toBe(5);
  });

  it('devrait retourner 0 pour des données vides', () => {
    expect(countTotalTabs(createEmptyData())).toBe(0);
  });

  it('devrait compter uniquement les onglets non groupés', () => {
    expect(countTotalTabs(createUngroupedOnlyData())).toBe(2);
  });

  it('devrait compter uniquement les onglets dans les groupes', () => {
    expect(countTotalTabs(createGroupsOnlyData())).toBe(2);
  });

  it('ne devrait pas compter les groupes eux-mêmes', () => {
    const data = createSampleData();
    // 2 groups + 5 tabs → should be 5, not 7
    expect(countTotalTabs(data)).toBe(5);
  });
});

/* ─── chromeGroupColors ─── */

describe('chromeGroupColors', () => {
  it('devrait avoir les 9 couleurs Chrome', () => {
    const expectedColors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
    for (const color of expectedColors) {
      expect(chromeGroupColors[color]).toBeDefined();
      expect(chromeGroupColors[color]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

/* ─── buildTreeViewData ─── */

describe('buildTreeViewData', () => {
  describe('flatData', () => {
    it('devrait produire un nœud racine en première position', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      expect(flatData[0].parent).toBeNull();
      expect(flatData[0].name).toBe('');
    });

    it('devrait contenir tous les nœuds (root + groupes + onglets)', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      // 1 root + 2 groups + 3 tabs in groups + 2 ungrouped = 8
      expect(flatData).toHaveLength(8);
    });

    it('devrait marquer les groupes avec metadata.type === "group"', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const groups = flatData.filter((n) => n.metadata?.type === 'group');
      expect(groups).toHaveLength(2);
      expect(groups[0].name).toBe('Jira Tickets');
      expect(groups[1].name).toBe('Documentation');
    });

    it('devrait stocker la couleur du groupe dans metadata.color', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const jiraGroup = flatData.find((n) => n.name === 'Jira Tickets');
      expect(jiraGroup?.metadata?.color).toBe('red');
    });

    it('devrait stocker le groupId dans metadata.groupId', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const jiraGroup = flatData.find((n) => n.name === 'Jira Tickets');
      expect(jiraGroup?.metadata?.groupId).toBe(1);
    });

    it('devrait marquer les onglets avec metadata.type === "tab"', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const tabs = flatData.filter((n) => n.metadata?.type === 'tab');
      expect(tabs).toHaveLength(5);
    });

    it('devrait stocker l\'URL et favIconUrl dans metadata', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const mdn = flatData.find((n) => n.name === 'MDN Web Docs');
      expect(mdn?.metadata?.url).toBe('https://developer.mozilla.org/');
      expect(mdn?.metadata?.favIconUrl).toBe('https://developer.mozilla.org/favicon.ico');
    });

    it('devrait utiliser une chaîne vide pour favIconUrl si non fourni', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const claude = flatData.find((n) => n.name === 'Claude.ai');
      expect(claude?.metadata?.favIconUrl).toBe('');
    });

    it('devrait placer les onglets non groupés comme enfants de la racine', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const rootId = flatData[0].id;
      const rootChildren = flatData.filter((n) => n.parent === rootId);
      const ungroupedTabs = rootChildren.filter((n) => n.metadata?.type === 'tab');
      expect(ungroupedTabs).toHaveLength(2);
    });

    it('devrait placer les onglets groupés comme enfants de leur groupe', () => {
      const { flatData } = buildTreeViewData(createSampleData());
      const jiraGroup = flatData.find((n) => n.name === 'Jira Tickets');
      const jiraChildren = flatData.filter((n) => n.parent === jiraGroup?.id);
      expect(jiraChildren).toHaveLength(2);
      expect(jiraChildren.every((c) => c.metadata?.type === 'tab')).toBe(true);
    });
  });

  describe('ID maps', () => {
    it('devrait créer un mapping treeIdToTabId pour tous les onglets', () => {
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

    it('devrait créer un mapping tabIdToTreeId inverse', () => {
      const { treeIdToTabId, tabIdToTreeId } = buildTreeViewData(createSampleData());
      expect(tabIdToTreeId.size).toBe(5);
      // Round-trip: tabId → treeId → tabId should return the original
      for (const [treeId, tabId] of treeIdToTabId) {
        expect(tabIdToTreeId.get(tabId)).toBe(treeId);
      }
    });

    it('devrait peupler allTabTreeIds avec les IDs internes des onglets', () => {
      const { allTabTreeIds, treeIdToTabId } = buildTreeViewData(createSampleData());
      expect(allTabTreeIds.size).toBe(5);
      // allTabTreeIds should contain the same keys as treeIdToTabId
      for (const treeId of treeIdToTabId.keys()) {
        expect(allTabTreeIds.has(treeId)).toBe(true);
      }
    });

    it('ne devrait pas inclure les groupes dans les maps d\'IDs', () => {
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
    it('devrait gérer des données vides', () => {
      const { flatData, treeIdToTabId, tabIdToTreeId, allTabTreeIds } = buildTreeViewData(createEmptyData());
      expect(flatData).toHaveLength(1); // root only
      expect(treeIdToTabId.size).toBe(0);
      expect(tabIdToTreeId.size).toBe(0);
      expect(allTabTreeIds.size).toBe(0);
    });

    it('devrait gérer uniquement des onglets non groupés', () => {
      const { flatData, treeIdToTabId } = buildTreeViewData(createUngroupedOnlyData());
      // 1 root + 2 ungrouped tabs = 3
      expect(flatData).toHaveLength(3);
      expect(treeIdToTabId.size).toBe(2);
    });

    it('devrait gérer uniquement des groupes', () => {
      const { flatData, treeIdToTabId } = buildTreeViewData(createGroupsOnlyData());
      // 1 root + 1 group + 2 tabs = 4
      expect(flatData).toHaveLength(4);
      expect(treeIdToTabId.size).toBe(2);
    });
  });
});
