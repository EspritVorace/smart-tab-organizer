import { describe, it, expect, vi } from 'vitest';
import {
  formatSessionDate,
  countSessionTabs,
  sessionToTabTreeData,
  createSessionFromSelection,
  matchSessionSearch,
} from '../../src/utils/sessionUtils';
import type { Session, SavedTab, SavedTabGroup } from '../../src/types/session';

// generateUUID uses Math.random — mock it for deterministic IDs in createSessionFromSelection
vi.mock('../../src/utils/utils.js', () => ({
  generateUUID: vi.fn(() => 'mocked-uuid'),
}));

const makeTab = (overrides: Partial<SavedTab> = {}): SavedTab => ({
  id: 'tab-uuid-1',
  title: 'Test Tab',
  url: 'https://example.com',
  favIconUrl: '',
  ...overrides,
});

const makeGroup = (overrides: Partial<SavedTabGroup> = {}): SavedTabGroup => ({
  id: 'group-uuid-1',
  title: 'Group 1',
  color: 'blue',
  tabs: [makeTab()],
  ...overrides,
});

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-uuid-1',
  name: 'Test Session',
  createdAt: '2024-01-15T10:30:00.000Z',
  updatedAt: '2024-01-15T10:30:00.000Z',
  ungroupedTabs: [],
  groups: [],
  isPinned: false,
  ...overrides,
});

describe('sessionUtils', () => {
  describe('formatSessionDate', () => {
    it('formate une date ISO valide en chaîne lisible', () => {
      const result = formatSessionDate('2024-01-15T10:30:00.000Z');
      expect(typeof result).toBe('string');
      expect(result).toContain('2024');
      expect(result.length).toBeGreaterThan(0);
    });

    it('retourne la chaîne originale pour une date invalide', () => {
      const invalid = 'not-a-date';
      expect(formatSessionDate(invalid)).toBe(invalid);
    });

    it('retourne la chaîne originale pour une chaîne vide', () => {
      expect(formatSessionDate('')).toBe('');
    });
  });

  describe('countSessionTabs', () => {
    it('compte uniquement les onglets non groupés', () => {
      const session = makeSession({ ungroupedTabs: [makeTab(), makeTab()] });
      expect(countSessionTabs(session)).toBe(2);
    });

    it('compte uniquement les onglets dans les groupes', () => {
      const group = makeGroup({ tabs: [makeTab(), makeTab(), makeTab()] });
      const session = makeSession({ groups: [group] });
      expect(countSessionTabs(session)).toBe(3);
    });

    it('additionne onglets groupés et non groupés', () => {
      const session = makeSession({
        ungroupedTabs: [makeTab()],
        groups: [
          makeGroup({ tabs: [makeTab(), makeTab()] }),
          makeGroup({ tabs: [makeTab()] }),
        ],
      });
      expect(countSessionTabs(session)).toBe(4);
    });

    it('retourne 0 pour une session vide', () => {
      expect(countSessionTabs(makeSession())).toBe(0);
    });
  });

  describe('sessionToTabTreeData', () => {
    it('convertit les onglets non groupés', () => {
      const tab = makeTab({ id: 'uuid-a', title: 'Tab A', url: 'https://a.com' });
      const session = makeSession({ ungroupedTabs: [tab] });
      const { treeData, numericIdToSavedTabId } = sessionToTabTreeData(session);

      expect(treeData.ungroupedTabs).toHaveLength(1);
      expect(treeData.ungroupedTabs[0].title).toBe('Tab A');
      expect(treeData.ungroupedTabs[0].url).toBe('https://a.com');
      expect(numericIdToSavedTabId.get(treeData.ungroupedTabs[0].id)).toBe('uuid-a');
    });

    it('convertit les groupes avec leurs onglets', () => {
      const tab = makeTab({ id: 'uuid-b', title: 'Grouped Tab' });
      const group = makeGroup({ title: 'My Group', color: 'green', tabs: [tab] });
      const session = makeSession({ groups: [group] });
      const { treeData, numericIdToSavedTabId } = sessionToTabTreeData(session);

      expect(treeData.groups).toHaveLength(1);
      expect(treeData.groups[0].title).toBe('My Group');
      expect(treeData.groups[0].color).toBe('green');
      expect(treeData.groups[0].tabs).toHaveLength(1);
      expect(numericIdToSavedTabId.get(treeData.groups[0].tabs[0].id)).toBe('uuid-b');
    });

    it('assigne des IDs numériques séquentiels uniques', () => {
      const session = makeSession({
        ungroupedTabs: [makeTab({ id: 'u1' }), makeTab({ id: 'u2' })],
        groups: [makeGroup({ tabs: [makeTab({ id: 'g1' }), makeTab({ id: 'g2' })] })],
      });
      const { treeData } = sessionToTabTreeData(session);

      const allIds = [
        ...treeData.ungroupedTabs.map(t => t.id),
        treeData.groups[0].id,
        ...treeData.groups[0].tabs.map(t => t.id),
      ];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it("n'inclut pas les IDs de groupe dans la map UUID (seulement les onglets)", () => {
      const tab = makeTab({ id: 'tab-uuid' });
      const group = makeGroup({ tabs: [tab] });
      const session = makeSession({ groups: [group] });
      const { treeData, numericIdToSavedTabId } = sessionToTabTreeData(session);

      // Le group ID numérique n'est pas dans la map
      expect(numericIdToSavedTabId.has(treeData.groups[0].id)).toBe(false);
      // L'onglet du groupe est dans la map
      expect(numericIdToSavedTabId.has(treeData.groups[0].tabs[0].id)).toBe(true);
    });

    it('retourne des structures vides pour une session vide', () => {
      const { treeData, numericIdToSavedTabId } = sessionToTabTreeData(makeSession());
      expect(treeData.ungroupedTabs).toHaveLength(0);
      expect(treeData.groups).toHaveLength(0);
      expect(numericIdToSavedTabId.size).toBe(0);
    });
  });

  describe('createSessionFromSelection', () => {
    it("n'inclut que les onglets sélectionnés parmi les onglets non groupés", () => {
      const tab1 = makeTab({ id: 'sel-1' });
      const tab2 = makeTab({ id: 'sel-2' });
      const selected = new Set(['sel-1']);
      const session = createSessionFromSelection([tab1, tab2], [], selected, 'My Session');

      expect(session.ungroupedTabs).toHaveLength(1);
      expect(session.ungroupedTabs[0].id).toBe('sel-1');
    });

    it('exclut les groupes dont aucun onglet n\'est sélectionné', () => {
      const tab = makeTab({ id: 'not-selected' });
      const group = makeGroup({ tabs: [tab] });
      const session = createSessionFromSelection([], [group], new Set<string>(), 'Empty');

      expect(session.groups).toHaveLength(0);
    });

    it('filtre partiellement les onglets au sein d\'un groupe', () => {
      const tab1 = makeTab({ id: 'g-tab-1' });
      const tab2 = makeTab({ id: 'g-tab-2' });
      const group = makeGroup({ tabs: [tab1, tab2] });
      const selected = new Set(['g-tab-1']);
      const session = createSessionFromSelection([], [group], selected, 'Partial');

      expect(session.groups).toHaveLength(1);
      expect(session.groups[0].tabs).toHaveLength(1);
      expect(session.groups[0].tabs[0].id).toBe('g-tab-1');
    });

    it('définit le nom et les horodatages de la session', () => {
      const session = createSessionFromSelection([], [], new Set(), 'Named Session');

      expect(session.name).toBe('Named Session');
      expect(session.createdAt).toBeTruthy();
      expect(session.updatedAt).toBeTruthy();
      expect(session.createdAt).toBe(session.updatedAt);
    });

    it('génère un UUID comme ID de session', () => {
      const session = createSessionFromSelection([], [], new Set(), 'S');
      expect(session.id).toBe('mocked-uuid');
    });

    it('applique l\'option isPinned', () => {
      const session = createSessionFromSelection([], [], new Set(), 'S', {
        isPinned: true,
      });
      expect(session.isPinned).toBe(true);
    });

    it('applique les valeurs par défaut si options absentes', () => {
      const session = createSessionFromSelection([], [], new Set(), 'S');
      expect(session.isPinned).toBe(false);
    });

    it('applique la categoryId si fournie', () => {
      const session = createSessionFromSelection([], [], new Set(), 'S', {
        categoryId: 'development',
      });
      expect(session.categoryId).toBe('development');
    });
  });

  describe('matchSessionSearch', () => {
    // --- No match ---

    it('retourne null si aucune correspondance', () => {
      const session = makeSession({ name: 'My Work Tabs' });
      expect(matchSessionSearch(session, 'zzz')).toBeNull();
    });

    // --- Name match ---

    it('retourne matchesName=true si le nom correspond', () => {
      const session = makeSession({ name: 'Work Session' });
      const result = matchSessionSearch(session, 'work');
      expect(result).not.toBeNull();
      expect(result!.matchesName).toBe(true);
      expect(result!.matchesTabs).toBe(false);
      expect(result!.matchingGroupIds.size).toBe(0);
    });

    it('recherche insensible à la casse dans le nom', () => {
      const session = makeSession({ name: 'WORK SESSION' });
      expect(matchSessionSearch(session, 'work')).not.toBeNull();
    });

    it('recherche insensible aux accents dans le nom', () => {
      const session = makeSession({ name: 'Étude de cas' });
      expect(matchSessionSearch(session, 'etude')).not.toBeNull();
    });

    // --- Ungrouped tab title match ---

    it('retourne matchesTabs=true si titre d\'un onglet non groupé correspond', () => {
      const session = makeSession({
        ungroupedTabs: [makeTab({ title: 'GitHub Dashboard', url: 'https://github.com' })],
      });
      const result = matchSessionSearch(session, 'github');
      expect(result).not.toBeNull();
      expect(result!.matchesTabs).toBe(true);
      expect(result!.matchesName).toBe(false);
      expect(result!.matchingGroupIds.size).toBe(0);
    });

    // --- Ungrouped tab URL match ---

    it('retourne matchesTabs=true si URL d\'un onglet non groupé correspond', () => {
      const session = makeSession({
        ungroupedTabs: [makeTab({ title: 'Home', url: 'https://my-special-domain.com/path' })],
      });
      const result = matchSessionSearch(session, 'special-domain');
      expect(result).not.toBeNull();
      expect(result!.matchesTabs).toBe(true);
      expect(result!.matchingGroupIds.size).toBe(0);
    });

    // --- Group title match ---

    it('retourne matchesTabs=true et le groupId si le titre de groupe correspond', () => {
      const group = makeGroup({ id: 'grp-1', title: 'Development Tools', tabs: [] });
      const session = makeSession({ groups: [group] });
      const result = matchSessionSearch(session, 'development');
      expect(result).not.toBeNull();
      expect(result!.matchesTabs).toBe(true);
      expect(result!.matchingGroupIds.has('grp-1')).toBe(true);
    });

    // --- Tab inside group match ---

    it('retourne le groupId si un onglet du groupe correspond par titre', () => {
      const tab = makeTab({ title: 'Stack Overflow', url: 'https://stackoverflow.com' });
      const group = makeGroup({ id: 'grp-2', title: 'Misc', tabs: [tab] });
      const session = makeSession({ groups: [group] });
      const result = matchSessionSearch(session, 'stack');
      expect(result).not.toBeNull();
      expect(result!.matchingGroupIds.has('grp-2')).toBe(true);
    });

    it('retourne le groupId si un onglet du groupe correspond par URL', () => {
      const tab = makeTab({ title: 'Homepage', url: 'https://internal-wiki.company.com' });
      const group = makeGroup({ id: 'grp-3', title: 'Internal', tabs: [tab] });
      const session = makeSession({ groups: [group] });
      const result = matchSessionSearch(session, 'wiki');
      expect(result).not.toBeNull();
      expect(result!.matchingGroupIds.has('grp-3')).toBe(true);
    });

    // --- Multiple groups: only matching ones returned ---

    it('ne retourne que les groupIds des groupes avec correspondance', () => {
      const matchingGroup = makeGroup({
        id: 'match-grp',
        title: 'Frontend',
        tabs: [makeTab({ title: 'React Docs', url: 'https://react.dev' })],
      });
      const nonMatchingGroup = makeGroup({
        id: 'no-match-grp',
        title: 'Backend',
        tabs: [makeTab({ title: 'Go Blog', url: 'https://go.dev' })],
      });
      const session = makeSession({ groups: [matchingGroup, nonMatchingGroup] });
      const result = matchSessionSearch(session, 'react');
      expect(result).not.toBeNull();
      expect(result!.matchingGroupIds.has('match-grp')).toBe(true);
      expect(result!.matchingGroupIds.has('no-match-grp')).toBe(false);
    });

    // --- Combined: name + tab match ---

    it('retourne matchesName=true ET matchesTabs=true si les deux correspondent', () => {
      const session = makeSession({
        name: 'React Project',
        ungroupedTabs: [makeTab({ title: 'React Docs', url: 'https://react.dev' })],
      });
      const result = matchSessionSearch(session, 'react');
      expect(result).not.toBeNull();
      expect(result!.matchesName).toBe(true);
      expect(result!.matchesTabs).toBe(true);
    });

    // --- Accent / case insensitivity in tabs ---

    it('recherche insensible aux accents dans les titres d\'onglets', () => {
      const session = makeSession({
        ungroupedTabs: [makeTab({ title: 'Résumé du projet', url: 'https://example.com' })],
      });
      expect(matchSessionSearch(session, 'resume')).not.toBeNull();
    });

    it('recherche insensible à la casse dans les URLs', () => {
      const session = makeSession({
        ungroupedTabs: [makeTab({ title: 'Home', url: 'https://EXAMPLE.COM/PATH' })],
      });
      expect(matchSessionSearch(session, 'example.com')).not.toBeNull();
    });

    // --- Empty term ---

    it('correspond à tout si le terme est vide', () => {
      const session = makeSession({ name: 'My Session' });
      const result = matchSessionSearch(session, '');
      expect(result).not.toBeNull();
      expect(result!.matchesName).toBe(true);
    });
  });
});
