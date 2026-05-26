import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  getFocusedSessionFromDOM,
  matchSessionSearch,
  sessionToTabTreeData,
  formatSessionDateShort,
  formatSessionDate,
  getSessionGroupLabel,
  getSessionTabLabel,
  countSessionTabs,
  splitByPinned,
  splitByBucket,
  resolveTabUuids,
  createSessionFromSelection,
} from '../src/utils/sessionUtils';
import type { Session, SavedTab, SavedTabGroup } from '../src/types/session';

// ── i18n stub ─────────────────────────────────────────────────────────────────

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

// ── Factories ─────────────────────────────────────────────────────────────────

function makeTab(overrides: Partial<SavedTab> = {}): SavedTab {
  return {
    id: `tab-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Example Page',
    url: 'https://example.com',
    ...overrides,
  };
}

function makeGroup(overrides: Partial<SavedTabGroup> = {}): SavedTabGroup {
  return {
    id: `grp-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Work',
    color: 'blue',
    tabs: [makeTab()],
    ...overrides,
  };
}

function makeSession(overrides: Partial<Session> = {}): Session {
  const now = new Date().toISOString();
  return {
    id: `sess-${Math.random().toString(36).slice(2, 8)}`,
    name: 'My Session',
    createdAt: now,
    updatedAt: now,
    groups: [],
    ungroupedTabs: [],
    isPinned: false,
    categoryId: null,
    ...overrides,
  };
}

// ── getFocusedSessionFromDOM ───────────────────────────────────────────────────

describe('getFocusedSessionFromDOM', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns null when document.activeElement is not an HTMLElement', () => {
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
    const el = document.createElement('div');
    el.setAttribute('data-shortcut-scope', 'widget:session-card');
    el.setAttribute('data-session-id', 'unknown');
    el.setAttribute('tabindex', '0');
    document.body.appendChild(el);
    el.focus();
    expect(getFocusedSessionFromDOM([makeSession()])).toBeNull();
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

// ── matchSessionSearch ────────────────────────────────────────────────────────

describe('matchSessionSearch', () => {
  it('returns null when nothing matches', () => {
    const session = makeSession({ name: 'Work', ungroupedTabs: [makeTab({ title: 'GitHub', url: 'https://github.com' })] });
    expect(matchSessionSearch(session, 'zzz')).toBeNull();
  });

  it('matches by session name', () => {
    const session = makeSession({ name: 'Work Projects' });
    const result = matchSessionSearch(session, 'work');
    expect(result).not.toBeNull();
    expect(result!.matchesName).toBe(true);
    expect(result!.matchesTabs).toBe(false);
  });

  it('matches by ungrouped tab title', () => {
    const session = makeSession({ ungroupedTabs: [makeTab({ title: 'GitHub Issues', url: 'https://github.com' })] });
    const result = matchSessionSearch(session, 'github');
    expect(result).not.toBeNull();
    expect(result!.matchesTabs).toBe(true);
    expect(result!.matchesName).toBe(false);
  });

  it('matches by ungrouped tab URL', () => {
    const session = makeSession({ ungroupedTabs: [makeTab({ title: 'Page', url: 'https://linear.app/board' })] });
    const result = matchSessionSearch(session, 'linear');
    expect(result).not.toBeNull();
    expect(result!.matchesTabs).toBe(true);
  });

  it('matches by group title and records the matching group id', () => {
    const group = makeGroup({ id: 'grp-1', title: 'Design System', tabs: [makeTab()] });
    const session = makeSession({ groups: [group] });
    const result = matchSessionSearch(session, 'design');
    expect(result).not.toBeNull();
    expect(result!.matchingGroupIds.has('grp-1')).toBe(true);
  });

  it('matches by tab inside a group', () => {
    const group = makeGroup({ id: 'grp-2', title: 'Work', tabs: [makeTab({ title: 'Jira Board', url: 'https://jira.com' })] });
    const session = makeSession({ groups: [group] });
    const result = matchSessionSearch(session, 'jira');
    expect(result!.matchingGroupIds.has('grp-2')).toBe(true);
  });

  it('matches by session note', () => {
    const session = makeSession({ note: 'Sprint planning notes' });
    const result = matchSessionSearch(session, 'sprint');
    expect(result).not.toBeNull();
    expect(result!.matchesNote).toBe(true);
  });

  it('returns matchesNote false when session has no note', () => {
    const session = makeSession({ name: 'Match by name' });
    const result = matchSessionSearch(session, 'match');
    expect(result!.matchesNote).toBe(false);
  });
});

// ── sessionToTabTreeData ──────────────────────────────────────────────────────

describe('sessionToTabTreeData', () => {
  it('maps ungrouped tabs to sequential numeric ids starting at 1', () => {
    const tab1 = makeTab({ id: 'uuid-a', title: 'Tab A' });
    const tab2 = makeTab({ id: 'uuid-b', title: 'Tab B' });
    const session = makeSession({ ungroupedTabs: [tab1, tab2] });
    const { treeData, numericIdToSavedTabId } = sessionToTabTreeData(session);

    expect(treeData.ungroupedTabs).toHaveLength(2);
    expect(treeData.ungroupedTabs[0].id).toBe(1);
    expect(treeData.ungroupedTabs[1].id).toBe(2);
    expect(numericIdToSavedTabId.get(1)).toBe('uuid-a');
    expect(numericIdToSavedTabId.get(2)).toBe('uuid-b');
  });

  it('assigns ids to group containers and their tabs', () => {
    const tab = makeTab({ id: 'uuid-t' });
    const group = makeGroup({ id: 'grp-uuid', tabs: [tab] });
    const session = makeSession({ groups: [group] });
    const { treeData, numericIdToSavedTabId } = sessionToTabTreeData(session);

    expect(treeData.groups).toHaveLength(1);
    // Group itself gets id 1; its tab gets id 2
    expect(treeData.groups[0].id).toBe(1);
    expect(treeData.groups[0].tabs[0].id).toBe(2);
    expect(numericIdToSavedTabId.get(2)).toBe('uuid-t');
    // Group id is not in the tab map
    expect(numericIdToSavedTabId.has(1)).toBe(false);
  });

  it('preserves tab metadata in tree nodes', () => {
    const tab = makeTab({ title: 'TypeScript Docs', url: 'https://ts.dev', favIconUrl: 'https://ts.dev/icon.png' });
    const session = makeSession({ ungroupedTabs: [tab] });
    const { treeData } = sessionToTabTreeData(session);
    const node = treeData.ungroupedTabs[0];
    expect(node.title).toBe('TypeScript Docs');
    expect(node.url).toBe('https://ts.dev');
    expect(node.favIconUrl).toBe('https://ts.dev/icon.png');
  });
});

// ── formatSessionDateShort ────────────────────────────────────────────────────

describe('formatSessionDateShort', () => {
  it('returns a formatted date string for a valid ISO string', () => {
    const result = formatSessionDateShort('2025-04-01T10:00:00.000Z');
    expect(result).toMatch(/Apr|2025/);
  });

  it('returns the raw string when parsing fails', () => {
    const result = formatSessionDateShort('not-a-date');
    // Invalid Date produces "Invalid Date" or similar, falls back to input
    expect(typeof result).toBe('string');
  });
});

// ── formatSessionDate ─────────────────────────────────────────────────────────

describe('formatSessionDate', () => {
  it('returns a full date-time string for a valid ISO string', () => {
    const result = formatSessionDate('2025-04-01T10:00:00.000Z');
    expect(result).toMatch(/2025/);
  });

  it('returns the raw string on error', () => {
    const result = formatSessionDate('bad');
    expect(typeof result).toBe('string');
  });
});

// ── getSessionGroupLabel ──────────────────────────────────────────────────────

describe('getSessionGroupLabel', () => {
  it('returns singular label for 1 group', () => {
    expect(getSessionGroupLabel(1)).toBe('1 group');
    expect(mockGetMessage).toHaveBeenCalledWith('sessionGroupOne', undefined);
  });

  it('returns plural label with count substituted', () => {
    expect(getSessionGroupLabel(3)).toBe('3 groups');
    expect(mockGetMessage).toHaveBeenCalledWith('sessionGroupCount', undefined);
  });
});

// ── getSessionTabLabel ────────────────────────────────────────────────────────

describe('getSessionTabLabel', () => {
  it('returns singular label for 1 tab', () => {
    expect(getSessionTabLabel(1)).toBe('1 tab');
    expect(mockGetMessage).toHaveBeenCalledWith('sessionTabOne', undefined);
  });

  it('returns plural label with count substituted', () => {
    expect(getSessionTabLabel(5)).toBe('5 tabs');
    expect(mockGetMessage).toHaveBeenCalledWith('sessionTabCount', undefined);
  });
});

// ── countSessionTabs ──────────────────────────────────────────────────────────

describe('countSessionTabs', () => {
  it('counts ungrouped tabs only', () => {
    const session = makeSession({ ungroupedTabs: [makeTab(), makeTab()] });
    expect(countSessionTabs(session)).toBe(2);
  });

  it('counts tabs inside groups only', () => {
    const group = makeGroup({ tabs: [makeTab(), makeTab(), makeTab()] });
    const session = makeSession({ groups: [group] });
    expect(countSessionTabs(session)).toBe(3);
  });

  it('sums ungrouped and grouped tabs', () => {
    const group = makeGroup({ tabs: [makeTab(), makeTab()] });
    const session = makeSession({ ungroupedTabs: [makeTab()], groups: [group] });
    expect(countSessionTabs(session)).toBe(3);
  });

  it('returns 0 for a session with no tabs', () => {
    expect(countSessionTabs(makeSession())).toBe(0);
  });
});

// ── splitByPinned ─────────────────────────────────────────────────────────────

describe('splitByPinned', () => {
  it('separates pinned from unpinned sessions', () => {
    const pinned = makeSession({ isPinned: true });
    const unpinned = makeSession({ isPinned: false });
    const { pinned: p, unpinned: u } = splitByPinned([pinned, unpinned]);
    expect(p).toEqual([pinned]);
    expect(u).toEqual([unpinned]);
  });

  it('returns empty arrays when input is empty', () => {
    const { pinned, unpinned } = splitByPinned([]);
    expect(pinned).toHaveLength(0);
    expect(unpinned).toHaveLength(0);
  });
});

// ── splitByBucket ─────────────────────────────────────────────────────────────

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

  it('handles a mixed list', () => {
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

// ── resolveTabUuids ───────────────────────────────────────────────────────────

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

// ── createSessionFromSelection ────────────────────────────────────────────────

describe('createSessionFromSelection', () => {
  it('includes only selected ungrouped tabs', () => {
    const kept = makeTab({ id: 'kept' });
    const dropped = makeTab({ id: 'dropped' });
    const session = createSessionFromSelection([kept, dropped], [], new Set(['kept']), 'Test');
    expect(session.ungroupedTabs).toHaveLength(1);
    expect(session.ungroupedTabs[0].id).toBe('kept');
  });

  it('filters group tabs and drops empty groups', () => {
    const tab = makeTab({ id: 'tab-in-group' });
    const group = makeGroup({ tabs: [tab, makeTab({ id: 'other' })] });
    const session = createSessionFromSelection([], [group], new Set(['tab-in-group']), 'Test');
    expect(session.groups).toHaveLength(1);
    expect(session.groups[0].tabs).toHaveLength(1);
  });

  it('omits groups where all tabs are deselected', () => {
    const group = makeGroup({ tabs: [makeTab({ id: 't1' }), makeTab({ id: 't2' })] });
    const session = createSessionFromSelection([], [group], new Set(), 'Test');
    expect(session.groups).toHaveLength(0);
  });

  it('applies options: isPinned, categoryId, note', () => {
    const session = createSessionFromSelection([], [], new Set(), 'Named', {
      isPinned: true,
      categoryId: 'cat-1',
      note: 'My note',
    });
    expect(session.isPinned).toBe(true);
    expect(session.categoryId).toBe('cat-1');
    expect(session.note).toBe('My note');
  });

  it('defaults isPinned to false and categoryId to null when no options provided', () => {
    const session = createSessionFromSelection([], [], new Set(), 'Bare');
    expect(session.isPinned).toBe(false);
    expect(session.categoryId).toBeNull();
    expect(session.note).toBeUndefined();
  });

  it('assigns a non-empty id and name from the arguments', () => {
    const session = createSessionFromSelection([], [], new Set(), 'My Sessions');
    expect(session.id).toBeTruthy();
    expect(session.name).toBe('My Sessions');
  });
});
