import { describe, it, expect } from 'vitest';
import {
  moveSessionToFirst,
  moveSessionToLast,
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
