import { describe, it, expect } from 'vitest';
import {
  moveSessionToFirst,
  moveSessionToLast,
  moveSessionToFirstInGroup,
  moveSessionToLastInGroup,
} from '../src/utils/sessionOrderUtils';
import type { Session } from '../src/types/session';

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
