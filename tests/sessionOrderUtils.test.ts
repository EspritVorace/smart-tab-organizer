import { describe, it, expect } from 'vitest';
import {
  moveSessionToFirst,
  moveSessionToLast,
  moveSessionToFirstInGroup,
  moveSessionToLastInGroup,
  moveTabInGroup,
  reassignTabToGroup,
} from '../src/utils/sessionOrderUtils';
import type { SavedTab, SavedTabGroup, Session } from '../src/types/session';

function makeSession(id: string): Session {
  const now = '2026-01-01T00:00:00.000Z';
  return {
    id,
    name: id,
    createdAt: now,
    updatedAt: now,
    groups: [],
    ungroupedTabs: [],
    isPinned: false,
    categoryId: null,
  };
}

function makeTab(id: string): SavedTab {
  return { id, title: `Tab ${id}`, url: `https://example.com/${id}` };
}

function makeGroup(id: string, tabs: SavedTab[]): SavedTabGroup {
  return { id, title: `Group ${id}`, color: 'blue', tabs };
}

function makeSessionWithLayout(
  groups: SavedTabGroup[],
  ungroupedTabs: SavedTab[],
): Session {
  return { ...makeSession('session-1'), groups, ungroupedTabs };
}

const a = makeSession('a');
const b = makeSession('b');
const c = makeSession('c');
const d = makeSession('d');

describe('moveSessionToFirst', () => {
  it('moves a session from the middle to the first position', () => {
    const result = moveSessionToFirst([a, b, c], 'b');
    expect(result.map(s => s.id)).toEqual(['b', 'a', 'c']);
  });

  it('moves the last session to the first position', () => {
    const result = moveSessionToFirst([a, b, c], 'c');
    expect(result.map(s => s.id)).toEqual(['c', 'a', 'b']);
  });

  it('returns the same array reference when the session is already first', () => {
    const sessions = [a, b, c];
    const result = moveSessionToFirst(sessions, 'a');
    expect(result).toBe(sessions);
  });

  it('returns the same array reference when the session is not found', () => {
    const sessions = [a, b, c];
    const result = moveSessionToFirst(sessions, 'unknown');
    expect(result).toBe(sessions);
  });

  it('handles a single-session list as a no-op', () => {
    const sessions = [a];
    const result = moveSessionToFirst(sessions, 'a');
    expect(result).toBe(sessions);
  });

  it('handles an empty list as a no-op', () => {
    const sessions: Session[] = [];
    const result = moveSessionToFirst(sessions, 'a');
    expect(result).toBe(sessions);
  });
});

describe('moveSessionToLast', () => {
  it('moves a session from the middle to the last position', () => {
    const result = moveSessionToLast([a, b, c, d], 'b');
    expect(result.map(s => s.id)).toEqual(['a', 'c', 'd', 'b']);
  });

  it('moves the first session to the last position', () => {
    const result = moveSessionToLast([a, b, c], 'a');
    expect(result.map(s => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('returns the same array reference when the session is already last', () => {
    const sessions = [a, b, c];
    const result = moveSessionToLast(sessions, 'c');
    expect(result).toBe(sessions);
  });

  it('returns the same array reference when the session is not found', () => {
    const sessions = [a, b, c];
    const result = moveSessionToLast(sessions, 'unknown');
    expect(result).toBe(sessions);
  });

  it('handles a single-session list as a no-op', () => {
    const sessions = [a];
    const result = moveSessionToLast(sessions, 'a');
    expect(result).toBe(sessions);
  });

  it('handles an empty list as a no-op', () => {
    const sessions: Session[] = [];
    const result = moveSessionToLast(sessions, 'a');
    expect(result).toBe(sessions);
  });
});

const pinA = { ...makeSession('pA'), isPinned: true };
const pinB = { ...makeSession('pB'), isPinned: true };
const pinC = { ...makeSession('pC'), isPinned: true };

describe('moveSessionToFirstInGroup', () => {
  it('moves a pinned session to first within pinned group, unpinned stays after', () => {
    const result = moveSessionToFirstInGroup([pinA, pinB, pinC, a, b], 'pC');
    expect(result.map(s => s.id)).toEqual(['pC', 'pA', 'pB', 'a', 'b']);
  });

  it('moves an unpinned session to first within unpinned group, pinned stays before', () => {
    const result = moveSessionToFirstInGroup([pinA, pinB, a, b, c], 'c');
    expect(result.map(s => s.id)).toEqual(['pA', 'pB', 'c', 'a', 'b']);
  });

  it('returns same array when session is already first in its group', () => {
    const sessions = [pinA, pinB, a, b];
    const result = moveSessionToFirstInGroup(sessions, 'pA');
    expect(result.map(s => s.id)).toEqual(['pA', 'pB', 'a', 'b']);
  });

  it('returns same array when session is not found', () => {
    const sessions = [pinA, a, b];
    const result = moveSessionToFirstInGroup(sessions, 'unknown');
    expect(result).toBe(sessions);
  });

  it('works with only pinned sessions', () => {
    const result = moveSessionToFirstInGroup([pinA, pinB, pinC], 'pC');
    expect(result.map(s => s.id)).toEqual(['pC', 'pA', 'pB']);
  });

  it('works with only unpinned sessions', () => {
    const result = moveSessionToFirstInGroup([a, b, c], 'c');
    expect(result.map(s => s.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('moveSessionToLastInGroup', () => {
  it('moves a pinned session to last within pinned group, unpinned stays after', () => {
    const result = moveSessionToLastInGroup([pinA, pinB, pinC, a, b], 'pA');
    expect(result.map(s => s.id)).toEqual(['pB', 'pC', 'pA', 'a', 'b']);
  });

  it('moves an unpinned session to last within unpinned group, pinned stays before', () => {
    const result = moveSessionToLastInGroup([pinA, pinB, a, b, c], 'a');
    expect(result.map(s => s.id)).toEqual(['pA', 'pB', 'b', 'c', 'a']);
  });

  it('returns same array when session is already last in its group', () => {
    const sessions = [pinA, pinB, a, b];
    const result = moveSessionToLastInGroup(sessions, 'pB');
    expect(result.map(s => s.id)).toEqual(['pA', 'pB', 'a', 'b']);
  });

  it('returns same array when session is not found', () => {
    const sessions = [pinA, a, b];
    const result = moveSessionToLastInGroup(sessions, 'unknown');
    expect(result).toBe(sessions);
  });
});

describe('moveTabInGroup', () => {
  describe('within ungrouped list (groupId === null)', () => {
    it('moves a tab up within the ungrouped list', () => {
      const t1 = makeTab('t1');
      const t2 = makeTab('t2');
      const t3 = makeTab('t3');
      const session = makeSessionWithLayout([], [t1, t2, t3]);
      const result = moveTabInGroup(session, 't2', 'up', null);
      expect(result.ungroupedTabs.map(t => t.id)).toEqual(['t2', 't1', 't3']);
    });

    it('moves a tab down within the ungrouped list', () => {
      const t1 = makeTab('t1');
      const t2 = makeTab('t2');
      const t3 = makeTab('t3');
      const session = makeSessionWithLayout([], [t1, t2, t3]);
      const result = moveTabInGroup(session, 't2', 'down', null);
      expect(result.ungroupedTabs.map(t => t.id)).toEqual(['t1', 't3', 't2']);
    });

    it('returns the original session when moving up at the boundary', () => {
      const t1 = makeTab('t1');
      const t2 = makeTab('t2');
      const session = makeSessionWithLayout([], [t1, t2]);
      const result = moveTabInGroup(session, 't1', 'up', null);
      expect(result).toBe(session);
    });

    it('returns the original session when moving down at the boundary', () => {
      const t1 = makeTab('t1');
      const t2 = makeTab('t2');
      const session = makeSessionWithLayout([], [t1, t2]);
      const result = moveTabInGroup(session, 't2', 'down', null);
      expect(result).toBe(session);
    });

    it('returns the original session when the tab is not found in ungrouped', () => {
      const t1 = makeTab('t1');
      const session = makeSessionWithLayout([], [t1]);
      const result = moveTabInGroup(session, 'unknown', 'up', null);
      expect(result).toBe(session);
    });
  });

  describe('within a specific group (groupId is a string)', () => {
    it('moves a tab up within the specified group', () => {
      const g1 = makeGroup('g1', [makeTab('t1'), makeTab('t2'), makeTab('t3')]);
      const session = makeSessionWithLayout([g1], []);
      const result = moveTabInGroup(session, 't3', 'up', 'g1');
      expect(result.groups[0].tabs.map(t => t.id)).toEqual(['t1', 't3', 't2']);
    });

    it('moves a tab down within the specified group', () => {
      const g1 = makeGroup('g1', [makeTab('t1'), makeTab('t2'), makeTab('t3')]);
      const session = makeSessionWithLayout([g1], []);
      const result = moveTabInGroup(session, 't1', 'down', 'g1');
      expect(result.groups[0].tabs.map(t => t.id)).toEqual(['t2', 't1', 't3']);
    });

    it('returns the original session when moving up at the boundary in a group', () => {
      const g1 = makeGroup('g1', [makeTab('t1'), makeTab('t2')]);
      const session = makeSessionWithLayout([g1], []);
      const result = moveTabInGroup(session, 't1', 'up', 'g1');
      expect(result.groups[0].tabs.map(t => t.id)).toEqual(['t1', 't2']);
    });

    it('does not touch other groups when a target group is provided', () => {
      const g1 = makeGroup('g1', [makeTab('t1'), makeTab('t2')]);
      const g2 = makeGroup('g2', [makeTab('u1'), makeTab('u2')]);
      const session = makeSessionWithLayout([g1, g2], []);
      const result = moveTabInGroup(session, 't1', 'down', 'g1');
      expect(result.groups[1].tabs.map(t => t.id)).toEqual(['u1', 'u2']);
    });
  });

  describe('auto-detection (groupId === undefined)', () => {
    it('detects an ungrouped tab and moves it', () => {
      const t1 = makeTab('t1');
      const t2 = makeTab('t2');
      const session = makeSessionWithLayout([makeGroup('g1', [makeTab('x1')])], [t1, t2]);
      const result = moveTabInGroup(session, 't1', 'down');
      expect(result.ungroupedTabs.map(t => t.id)).toEqual(['t2', 't1']);
    });

    it('detects a tab inside a group and moves it', () => {
      const g1 = makeGroup('g1', [makeTab('t1'), makeTab('t2')]);
      const g2 = makeGroup('g2', [makeTab('u1'), makeTab('u2')]);
      const session = makeSessionWithLayout([g1, g2], []);
      const result = moveTabInGroup(session, 'u2', 'up');
      expect(result.groups[1].tabs.map(t => t.id)).toEqual(['u2', 'u1']);
    });

    it('returns the original session when the tab cannot be found anywhere', () => {
      const session = makeSessionWithLayout(
        [makeGroup('g1', [makeTab('t1')])],
        [makeTab('u1')],
      );
      const result = moveTabInGroup(session, 'unknown', 'up');
      expect(result.ungroupedTabs.map(t => t.id)).toEqual(['u1']);
      expect(result.groups[0].tabs.map(t => t.id)).toEqual(['t1']);
    });
  });
});

describe('reassignTabToGroup', () => {
  it('moves a tab from one group to another and preserves relative order', () => {
    const g1 = makeGroup('g1', [makeTab('t1'), makeTab('t2'), makeTab('t3')]);
    const g2 = makeGroup('g2', [makeTab('u1'), makeTab('u2')]);
    const session = makeSessionWithLayout([g1, g2], []);
    const result = reassignTabToGroup(session, 't2', 'g1', 'g2');
    expect(result.groups[0].tabs.map(t => t.id)).toEqual(['t1', 't3']);
    expect(result.groups[1].tabs.map(t => t.id)).toEqual(['u1', 'u2', 't2']);
  });

  it('moves a grouped tab to ungrouped (targetGroupId === null)', () => {
    const g1 = makeGroup('g1', [makeTab('t1'), makeTab('t2')]);
    const session = makeSessionWithLayout([g1], [makeTab('u1')]);
    const result = reassignTabToGroup(session, 't1', 'g1', null);
    expect(result.groups[0].tabs.map(t => t.id)).toEqual(['t2']);
    expect(result.ungroupedTabs.map(t => t.id)).toEqual(['u1', 't1']);
  });

  it('moves an ungrouped tab into a group (sourceGroupId === null)', () => {
    const g1 = makeGroup('g1', [makeTab('t1')]);
    const session = makeSessionWithLayout([g1], [makeTab('u1'), makeTab('u2')]);
    const result = reassignTabToGroup(session, 'u1', null, 'g1');
    expect(result.ungroupedTabs.map(t => t.id)).toEqual(['u2']);
    expect(result.groups[0].tabs.map(t => t.id)).toEqual(['t1', 'u1']);
  });

  it('moves a tab between groups using auto-detection (sourceGroupId === undefined)', () => {
    const g1 = makeGroup('g1', [makeTab('t1'), makeTab('t2')]);
    const g2 = makeGroup('g2', [makeTab('u1')]);
    const session = makeSessionWithLayout([g1, g2], []);
    const result = reassignTabToGroup(session, 't1', undefined, 'g2');
    expect(result.groups[0].tabs.map(t => t.id)).toEqual(['t2']);
    expect(result.groups[1].tabs.map(t => t.id)).toEqual(['u1', 't1']);
  });

  it('moves an ungrouped tab using auto-detection (sourceGroupId === undefined)', () => {
    const g1 = makeGroup('g1', [makeTab('t1')]);
    const session = makeSessionWithLayout([g1], [makeTab('u1'), makeTab('u2')]);
    const result = reassignTabToGroup(session, 'u2', undefined, 'g1');
    expect(result.ungroupedTabs.map(t => t.id)).toEqual(['u1']);
    expect(result.groups[0].tabs.map(t => t.id)).toEqual(['t1', 'u2']);
  });

  it('reorders within the same group when source equals target (tab moves to the end)', () => {
    const g1 = makeGroup('g1', [makeTab('t1'), makeTab('t2'), makeTab('t3')]);
    const session = makeSessionWithLayout([g1], []);
    const result = reassignTabToGroup(session, 't1', 'g1', 'g1');
    expect(result.groups[0].tabs.map(t => t.id)).toEqual(['t2', 't3', 't1']);
  });

  it('reorders within ungrouped when source and target are both null', () => {
    const session = makeSessionWithLayout([], [makeTab('u1'), makeTab('u2'), makeTab('u3')]);
    const result = reassignTabToGroup(session, 'u1', null, null);
    expect(result.ungroupedTabs.map(t => t.id)).toEqual(['u2', 'u3', 'u1']);
  });

  it('returns the original session when tabId is not found (explicit ungrouped source)', () => {
    const session = makeSessionWithLayout([makeGroup('g1', [makeTab('t1')])], [makeTab('u1')]);
    const result = reassignTabToGroup(session, 'unknown', null, 'g1');
    expect(result).toBe(session);
  });

  it('returns the original session when tabId is not found (explicit group source)', () => {
    const session = makeSessionWithLayout([makeGroup('g1', [makeTab('t1')])], [makeTab('u1')]);
    const result = reassignTabToGroup(session, 'unknown', 'g1', null);
    expect(result).toBe(session);
  });

  it('returns the original session when tabId is not found (auto-detected source)', () => {
    const session = makeSessionWithLayout([makeGroup('g1', [makeTab('t1')])], [makeTab('u1')]);
    const result = reassignTabToGroup(session, 'unknown', undefined, 'g1');
    expect(result).toBe(session);
  });

  it('preserves relative order of remaining tabs in the source group', () => {
    const g1 = makeGroup('g1', [makeTab('t1'), makeTab('t2'), makeTab('t3'), makeTab('t4')]);
    const g2 = makeGroup('g2', []);
    const session = makeSessionWithLayout([g1, g2], []);
    const result = reassignTabToGroup(session, 't2', 'g1', 'g2');
    expect(result.groups[0].tabs.map(t => t.id)).toEqual(['t1', 't3', 't4']);
    expect(result.groups[1].tabs.map(t => t.id)).toEqual(['t2']);
  });

  it('does not mutate the input session', () => {
    const g1 = makeGroup('g1', [makeTab('t1'), makeTab('t2')]);
    const session = makeSessionWithLayout([g1], [makeTab('u1')]);
    const before = JSON.stringify(session);
    reassignTabToGroup(session, 't1', 'g1', null);
    expect(JSON.stringify(session)).toBe(before);
  });
});
