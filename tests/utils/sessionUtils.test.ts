import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  formatSessionDate,
  formatSessionDateShort,
  countSessionTabs,
  sessionToTabTreeData,
  createSessionFromSelection,
  matchSessionSearch,
  splitByPinned,
  splitByBucket,
  resolveTabUuids,
  getFocusedSessionFromDOM,
  getSessionGroupLabel,
  getSessionTabLabel,
} from '../../src/utils/sessionUtils';
import type { Session, SavedTab, SavedTabGroup } from '../../src/types/session';

// generateUUID uses Math.random; mock it for deterministic IDs in createSessionFromSelection.
vi.mock('../../src/utils/utils', () => ({
  generateUUID: vi.fn(() => 'mocked-uuid'),
}));

// ── i18n stub (used by getSessionGroupLabel / getSessionTabLabel) ──────────────

const mockGetMessage = vi.fn();
beforeEach(() => {
  (fakeBrowser as any).i18n = { getMessage: mockGetMessage };
  mockGetMessage.mockReset();
  mockGetMessage.mockImplementation((key: string) => {
    const map: Record<string, string> = {
      sessionGroupOne: '1 group',
      sessionGroupCount: '$1 groups',
      sessionTabOne: '1 tab',
      sessionTabCount: '$1 tabs',
    };
    return map[key] ?? key;
  });
});

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
    it('formats a valid ISO date as a readable string', () => {
      const result = formatSessionDate('2024-01-15T10:30:00.000Z');
      expect(typeof result).toBe('string');
      expect(result).toContain('2024');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns the original string for an invalid date', () => {
      const invalid = 'not-a-date';
      expect(formatSessionDate(invalid)).toBe(invalid);
    });

    it('returns the original string for an empty string', () => {
      expect(formatSessionDate('')).toBe('');
    });
  });

  describe('countSessionTabs', () => {
    it('counts only ungrouped tabs', () => {
      const session = makeSession({ ungroupedTabs: [makeTab(), makeTab()] });
      expect(countSessionTabs(session)).toBe(2);
    });

    it('counts only tabs inside groups', () => {
      const group = makeGroup({ tabs: [makeTab(), makeTab(), makeTab()] });
      const session = makeSession({ groups: [group] });
      expect(countSessionTabs(session)).toBe(3);
    });

    it('sums grouped and ungrouped tabs', () => {
      const session = makeSession({
        ungroupedTabs: [makeTab()],
        groups: [
          makeGroup({ tabs: [makeTab(), makeTab()] }),
          makeGroup({ tabs: [makeTab()] }),
        ],
      });
      expect(countSessionTabs(session)).toBe(4);
    });

    it('returns 0 for an empty session', () => {
      expect(countSessionTabs(makeSession())).toBe(0);
    });
  });

  describe('sessionToTabTreeData', () => {
    it('converts ungrouped tabs', () => {
      const tab = makeTab({ id: 'uuid-a', title: 'Tab A', url: 'https://a.com' });
      const session = makeSession({ ungroupedTabs: [tab] });
      const { treeData, numericIdToSavedTabId } = sessionToTabTreeData(session);

      expect(treeData.ungroupedTabs).toHaveLength(1);
      expect(treeData.ungroupedTabs[0].title).toBe('Tab A');
      expect(treeData.ungroupedTabs[0].url).toBe('https://a.com');
      expect(numericIdToSavedTabId.get(treeData.ungroupedTabs[0].id)).toBe('uuid-a');
    });

    it('converts groups together with their tabs', () => {
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

    it('assigns sequential, unique numeric IDs', () => {
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

    it('does not include group IDs in the UUID map (tabs only)', () => {
      const tab = makeTab({ id: 'tab-uuid' });
      const group = makeGroup({ tabs: [tab] });
      const session = makeSession({ groups: [group] });
      const { treeData, numericIdToSavedTabId } = sessionToTabTreeData(session);

      // The numeric group ID is not in the map.
      expect(numericIdToSavedTabId.has(treeData.groups[0].id)).toBe(false);
      // The tab inside the group is in the map.
      expect(numericIdToSavedTabId.has(treeData.groups[0].tabs[0].id)).toBe(true);
    });

    it('returns empty structures for an empty session', () => {
      const { treeData, numericIdToSavedTabId } = sessionToTabTreeData(makeSession());
      expect(treeData.ungroupedTabs).toHaveLength(0);
      expect(treeData.groups).toHaveLength(0);
      expect(numericIdToSavedTabId.size).toBe(0);
    });
  });

  describe('createSessionFromSelection', () => {
    it('only includes selected tabs among ungrouped tabs', () => {
      const tab1 = makeTab({ id: 'sel-1' });
      const tab2 = makeTab({ id: 'sel-2' });
      const selected = new Set(['sel-1']);
      const session = createSessionFromSelection([tab1, tab2], [], selected, 'My Session');

      expect(session.ungroupedTabs).toHaveLength(1);
      expect(session.ungroupedTabs[0].id).toBe('sel-1');
    });

    it('excludes groups whose tabs are all unselected', () => {
      const tab = makeTab({ id: 'not-selected' });
      const group = makeGroup({ tabs: [tab] });
      const session = createSessionFromSelection([], [group], new Set<string>(), 'Empty');

      expect(session.groups).toHaveLength(0);
    });

    it('partially filters tabs inside a group', () => {
      const tab1 = makeTab({ id: 'g-tab-1' });
      const tab2 = makeTab({ id: 'g-tab-2' });
      const group = makeGroup({ tabs: [tab1, tab2] });
      const selected = new Set(['g-tab-1']);
      const session = createSessionFromSelection([], [group], selected, 'Partial');

      expect(session.groups).toHaveLength(1);
      expect(session.groups[0].tabs).toHaveLength(1);
      expect(session.groups[0].tabs[0].id).toBe('g-tab-1');
    });

    it('sets the session name and timestamps', () => {
      const session = createSessionFromSelection([], [], new Set(), 'Named Session');

      expect(session.name).toBe('Named Session');
      expect(session.createdAt).toBeTruthy();
      expect(session.updatedAt).toBeTruthy();
      expect(session.createdAt).toBe(session.updatedAt);
    });

    it('generates a UUID as the session ID', () => {
      const session = createSessionFromSelection([], [], new Set(), 'S');
      expect(session.id).toBe('mocked-uuid');
    });

    it('applies the isPinned option', () => {
      const session = createSessionFromSelection([], [], new Set(), 'S', {
        isPinned: true,
      });
      expect(session.isPinned).toBe(true);
    });

    it('applies default values when no options are provided', () => {
      const session = createSessionFromSelection([], [], new Set(), 'S');
      expect(session.isPinned).toBe(false);
    });

    it('applies the categoryId when provided', () => {
      const session = createSessionFromSelection([], [], new Set(), 'S', {
        categoryId: 'development',
      });
      expect(session.categoryId).toBe('development');
    });

    it('applies the note option when provided', () => {
      const session = createSessionFromSelection([], [], new Set(), 'S', {
        note: 'sprint planning',
      });
      expect(session.note).toBe('sprint planning');
    });
  });

  describe('matchSessionSearch', () => {
    // No match
    it('returns null when nothing matches', () => {
      const session = makeSession({ name: 'My Work Tabs' });
      expect(matchSessionSearch(session, 'zzz')).toBeNull();
    });

    // Name match
    it('returns matchesName=true when the name matches', () => {
      const session = makeSession({ name: 'Work Session' });
      const result = matchSessionSearch(session, 'work');
      expect(result).not.toBeNull();
      expect(result!.matchesName).toBe(true);
      expect(result!.matchesTabs).toBe(false);
      expect(result!.matchingGroupIds.size).toBe(0);
    });

    it('searches the name case-insensitively', () => {
      const session = makeSession({ name: 'WORK SESSION' });
      expect(matchSessionSearch(session, 'work')).not.toBeNull();
    });

    it('searches the name accent-insensitively', () => {
      const session = makeSession({ name: 'Étude de cas' });
      expect(matchSessionSearch(session, 'etude')).not.toBeNull();
    });

    // Ungrouped tab title match
    it('returns matchesTabs=true when an ungrouped tab title matches', () => {
      const session = makeSession({
        ungroupedTabs: [makeTab({ title: 'GitHub Dashboard', url: 'https://github.com' })],
      });
      const result = matchSessionSearch(session, 'github');
      expect(result).not.toBeNull();
      expect(result!.matchesTabs).toBe(true);
      expect(result!.matchesName).toBe(false);
      expect(result!.matchingGroupIds.size).toBe(0);
    });

    // Ungrouped tab URL match
    it('returns matchesTabs=true when an ungrouped tab URL matches', () => {
      const session = makeSession({
        ungroupedTabs: [makeTab({ title: 'Home', url: 'https://my-special-domain.com/path' })],
      });
      const result = matchSessionSearch(session, 'special-domain');
      expect(result).not.toBeNull();
      expect(result!.matchesTabs).toBe(true);
      expect(result!.matchingGroupIds.size).toBe(0);
    });

    // Group title match
    it('returns matchesTabs=true and the groupId when a group title matches', () => {
      const group = makeGroup({ id: 'grp-1', title: 'Development Tools', tabs: [] });
      const session = makeSession({ groups: [group] });
      const result = matchSessionSearch(session, 'development');
      expect(result).not.toBeNull();
      expect(result!.matchesTabs).toBe(true);
      expect(result!.matchingGroupIds.has('grp-1')).toBe(true);
    });

    // Tab inside group match
    it('returns the groupId when a tab in the group matches by title', () => {
      const tab = makeTab({ title: 'Stack Overflow', url: 'https://stackoverflow.com' });
      const group = makeGroup({ id: 'grp-2', title: 'Misc', tabs: [tab] });
      const session = makeSession({ groups: [group] });
      const result = matchSessionSearch(session, 'stack');
      expect(result).not.toBeNull();
      expect(result!.matchingGroupIds.has('grp-2')).toBe(true);
    });

    it('returns the groupId when a tab in the group matches by URL', () => {
      const tab = makeTab({ title: 'Homepage', url: 'https://internal-wiki.company.com' });
      const group = makeGroup({ id: 'grp-3', title: 'Internal', tabs: [tab] });
      const session = makeSession({ groups: [group] });
      const result = matchSessionSearch(session, 'wiki');
      expect(result).not.toBeNull();
      expect(result!.matchingGroupIds.has('grp-3')).toBe(true);
    });

    // Multiple groups: only matching ones returned
    it('returns only the groupIds of groups that matched', () => {
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

    // Combined: name + tab match
    it('returns matchesName=true AND matchesTabs=true when both match', () => {
      const session = makeSession({
        name: 'React Project',
        ungroupedTabs: [makeTab({ title: 'React Docs', url: 'https://react.dev' })],
      });
      const result = matchSessionSearch(session, 'react');
      expect(result).not.toBeNull();
      expect(result!.matchesName).toBe(true);
      expect(result!.matchesTabs).toBe(true);
    });

    // Accent / case insensitivity in tabs
    it('searches tab titles accent-insensitively', () => {
      const session = makeSession({
        ungroupedTabs: [makeTab({ title: 'Résumé du projet', url: 'https://example.com' })],
      });
      expect(matchSessionSearch(session, 'resume')).not.toBeNull();
    });

    it('searches URLs case-insensitively', () => {
      const session = makeSession({
        ungroupedTabs: [makeTab({ title: 'Home', url: 'https://EXAMPLE.COM/PATH' })],
      });
      expect(matchSessionSearch(session, 'example.com')).not.toBeNull();
    });

    // Empty term
    it('matches everything when the term is empty', () => {
      const session = makeSession({ name: 'My Session' });
      const result = matchSessionSearch(session, '');
      expect(result).not.toBeNull();
      expect(result!.matchesName).toBe(true);
    });

    it('returns matchesNote=true when the session note contains the term', () => {
      const session = makeSession({ name: 'Other', note: 'Sprint planning notes' });
      const result = matchSessionSearch(session, 'sprint');
      expect(result).not.toBeNull();
      expect(result!.matchesNote).toBe(true);
      expect(result!.matchesName).toBe(false);
    });

    it('returns matchesNote=false when the session has no note', () => {
      const session = makeSession({ name: 'Match' });
      const result = matchSessionSearch(session, 'match');
      expect(result!.matchesNote).toBe(false);
    });
  });

  describe('splitByPinned', () => {
    it('splits sessions into pinned and unpinned', () => {
      const pinned = makeSession({ id: 'p1', isPinned: true });
      const unpinned = makeSession({ id: 'u1', isPinned: false });
      const result = splitByPinned([pinned, unpinned]);
      expect(result.pinned).toEqual([pinned]);
      expect(result.unpinned).toEqual([unpinned]);
    });

    it('returns all in pinned when all are pinned', () => {
      const a = makeSession({ id: 'a', isPinned: true });
      const b = makeSession({ id: 'b', isPinned: true });
      const result = splitByPinned([a, b]);
      expect(result.pinned).toHaveLength(2);
      expect(result.unpinned).toHaveLength(0);
    });

    it('returns all in unpinned when none are pinned', () => {
      const a = makeSession({ id: 'a', isPinned: false });
      const b = makeSession({ id: 'b', isPinned: false });
      const result = splitByPinned([a, b]);
      expect(result.pinned).toHaveLength(0);
      expect(result.unpinned).toHaveLength(2);
    });

    it('returns empty arrays for empty input', () => {
      const result = splitByPinned([]);
      expect(result.pinned).toHaveLength(0);
      expect(result.unpinned).toHaveLength(0);
    });

    it('preserves order within each group', () => {
      const p1 = makeSession({ id: 'p1', isPinned: true });
      const u1 = makeSession({ id: 'u1', isPinned: false });
      const p2 = makeSession({ id: 'p2', isPinned: true });
      const u2 = makeSession({ id: 'u2', isPinned: false });
      const result = splitByPinned([p1, u1, p2, u2]);
      expect(result.pinned.map(s => s.id)).toEqual(['p1', 'p2']);
      expect(result.unpinned.map(s => s.id)).toEqual(['u1', 'u2']);
    });
  });

  describe('getFocusedSessionFromDOM', () => {
    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('returns null when document.activeElement is not inside a session card scope', () => {
      expect(getFocusedSessionFromDOM([])).toBeNull();
    });

    it('returns null when focused element lacks the session-card scope attribute', () => {
      const el = document.createElement('button');
      document.body.appendChild(el);
      el.focus();
      expect(getFocusedSessionFromDOM([])).toBeNull();
    });

    it('returns null when the session-card element has no data-session-id', () => {
      const el = document.createElement('div');
      el.setAttribute('data-shortcut-scope', 'widget:session-card');
      el.setAttribute('tabindex', '0');
      document.body.appendChild(el);
      el.focus();
      expect(getFocusedSessionFromDOM([])).toBeNull();
    });

    it('returns null when session id is not found in the provided list', () => {
      const session = makeSession({ id: 'other-id' });
      const el = document.createElement('div');
      el.setAttribute('data-shortcut-scope', 'widget:session-card');
      el.setAttribute('data-session-id', 'unknown');
      el.setAttribute('tabindex', '0');
      document.body.appendChild(el);
      el.focus();
      expect(getFocusedSessionFromDOM([session])).toBeNull();
    });

    it('returns the matching session when a session card is focused', () => {
      const session = makeSession({ id: 'sess-focused' });
      const el = document.createElement('div');
      el.setAttribute('data-shortcut-scope', 'widget:session-card');
      el.setAttribute('data-session-id', 'sess-focused');
      el.setAttribute('tabindex', '0');
      document.body.appendChild(el);
      el.focus();
      expect(getFocusedSessionFromDOM([session])).toBe(session);
    });
  });

  describe('formatSessionDateShort', () => {
    it('returns a formatted date string for a valid ISO string', () => {
      const result = formatSessionDateShort('2025-04-01T10:00:00.000Z');
      expect(result).toMatch(/Apr|2025/);
    });

    it('returns a string (fallback) when parsing fails', () => {
      expect(typeof formatSessionDateShort('not-a-date')).toBe('string');
    });
  });

  describe('getSessionGroupLabel', () => {
    it('returns singular label for 1 group', () => {
      expect(getSessionGroupLabel(1)).toBe('1 group');
      expect(mockGetMessage).toHaveBeenCalledWith('sessionGroupOne');
    });

    it('returns plural label with count substituted', () => {
      expect(getSessionGroupLabel(3)).toBe('3 groups');
      expect(mockGetMessage).toHaveBeenCalledWith('sessionGroupCount');
    });
  });

  describe('getSessionTabLabel', () => {
    it('returns singular label for 1 tab', () => {
      expect(getSessionTabLabel(1)).toBe('1 tab');
      expect(mockGetMessage).toHaveBeenCalledWith('sessionTabOne');
    });

    it('returns plural label with count substituted', () => {
      expect(getSessionTabLabel(5)).toBe('5 tabs');
      expect(mockGetMessage).toHaveBeenCalledWith('sessionTabCount');
    });
  });

  describe('splitByBucket', () => {
    it('places archived items in the archived bucket even when isPinned is also true', () => {
      const item = makeSession({ isPinned: true, isArchived: true });
      const { archived, pinned, active } = splitByBucket([item]);
      expect(archived).toHaveLength(1);
      expect(pinned).toHaveLength(0);
      expect(active).toHaveLength(0);
    });

    it('places pinned non-archived items in the pinned bucket', () => {
      const item = makeSession({ isPinned: true, isArchived: false });
      const { pinned, archived, active } = splitByBucket([item]);
      expect(pinned).toHaveLength(1);
      expect(archived).toHaveLength(0);
      expect(active).toHaveLength(0);
    });

    it('places regular items in the active bucket', () => {
      const item = makeSession({ isPinned: false });
      const { active, pinned, archived } = splitByBucket([item]);
      expect(active).toHaveLength(1);
      expect(pinned).toHaveLength(0);
      expect(archived).toHaveLength(0);
    });

    it('handles a mixed list of archived, pinned, and active sessions', () => {
      const items = [
        makeSession({ isPinned: false }),
        makeSession({ isPinned: true }),
        makeSession({ isArchived: true }),
      ];
      const { active, pinned, archived } = splitByBucket(items);
      expect(active).toHaveLength(1);
      expect(pinned).toHaveLength(1);
      expect(archived).toHaveLength(1);
    });
  });

  describe('resolveTabUuids', () => {
    it('maps selected numeric ids to their UUIDs', () => {
      const mapping = new Map([[1, 'uuid-one'], [2, 'uuid-two'], [3, 'uuid-three']]);
      const result = resolveTabUuids(new Set([1, 3]), mapping);
      expect(result).toEqual(new Set(['uuid-one', 'uuid-three']));
    });

    it('skips numeric ids not present in the mapping', () => {
      const mapping = new Map([[1, 'uuid-one']]);
      const result = resolveTabUuids(new Set([1, 99]), mapping);
      expect(result).toEqual(new Set(['uuid-one']));
    });

    it('returns an empty set for empty input', () => {
      expect(resolveTabUuids(new Set(), new Map())).toEqual(new Set());
    });
  });
});
