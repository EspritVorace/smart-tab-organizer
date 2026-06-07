import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => `i18n(${key})`),
}));

import {
  computeSessionView,
  countActiveSessionViewOps,
  isSessionViewActive,
  normalizeSessionViewState,
  DEFAULT_SESSION_VIEW_STATE,
  type SessionViewState,
} from '../../src/utils/sessionViewUtils';
import type { Session } from '../../src/types/session';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

interface SessionOverrides {
  createdAt?: string;
  updatedAt?: string;
  lastRestoredAt?: string;
  categoryId?: string | null;
}

const makeSession = (id: string, o: SessionOverrides = {}): Session => ({
  id,
  name: `Session ${id}`,
  createdAt: o.createdAt ?? '2026-01-01T00:00:00.000Z',
  updatedAt: o.updatedAt ?? '2026-01-01T00:00:00.000Z',
  groups: [],
  ungroupedTabs: [],
  isPinned: false,
  ...(o.lastRestoredAt !== undefined ? { lastRestoredAt: o.lastRestoredAt } : {}),
  ...(o.categoryId !== undefined ? { categoryId: o.categoryId } : {}),
});

const view = (overrides: Partial<SessionViewState> = {}): SessionViewState => ({
  ...DEFAULT_SESSION_VIEW_STATE,
  ...overrides,
});

const noSearch = { searchActive: false };
const ids = (sessions: Session[]) => sessions.map(s => s.id);

/* ── Filtering ──────────────────────────────────────────────────────────── */

describe('computeSessionView - filtering', () => {
  it('returns everything in real order when no filter/sort is active', () => {
    const sessions = [makeSession('a'), makeSession('b'), makeSession('c')];
    const res = computeSessionView(sessions, view(), noSearch);
    expect(ids(res.sessions)).toEqual(['a', 'b', 'c']);
    expect(res.visibleCount).toBe(3);
    expect(res.isDndEnabled).toBe(true);
  });

  it('filters by category, keeping real order', () => {
    const sessions = [
      makeSession('a', { categoryId: 'development' }),
      makeSession('b', { categoryId: 'search' }),
      makeSession('c', { categoryId: 'development' }),
    ];
    const res = computeSessionView(sessions, view({ filterCategories: ['development'] }), noSearch);
    expect(ids(res.sessions)).toEqual(['a', 'c']);
    expect(res.visibleCount).toBe(2);
  });

  it('filters sessions without a category via the __none__ sentinel', () => {
    const sessions = [
      makeSession('a', { categoryId: 'development' }),
      makeSession('b', { categoryId: null }),
      makeSession('c'),
    ];
    const res = computeSessionView(sessions, view({ filterCategories: ['__none__'] }), noSearch);
    expect(ids(res.sessions)).toEqual(['b', 'c']);
  });

  it('disables DnD when a category filter is active', () => {
    const sessions = [makeSession('a', { categoryId: 'development' })];
    const res = computeSessionView(sessions, view({ filterCategories: ['development'] }), noSearch);
    expect(res.isDndEnabled).toBe(false);
  });

  it('disables DnD when a search is active', () => {
    const sessions = [makeSession('a')];
    const res = computeSessionView(sessions, view(), { searchActive: true });
    expect(res.isDndEnabled).toBe(false);
  });
});

/* ── Sorting ────────────────────────────────────────────────────────────── */

describe('computeSessionView - sorting', () => {
  it('sorts by creation/modification date (createdAt, falling back to updatedAt)', () => {
    const sessions = [
      makeSession('a', { createdAt: '2026-03-01T00:00:00.000Z' }),
      makeSession('b', { createdAt: '2026-01-01T00:00:00.000Z' }),
      makeSession('c', { createdAt: '2026-02-01T00:00:00.000Z' }),
    ];
    const asc = computeSessionView(sessions, view({ sort: 'date', sortDirection: 'asc' }), noSearch);
    expect(ids(asc.sessions)).toEqual(['b', 'c', 'a']);
    const desc = computeSessionView(sessions, view({ sort: 'date', sortDirection: 'desc' }), noSearch);
    expect(ids(desc.sessions)).toEqual(['a', 'c', 'b']);
  });

  it('sorts by last restored date, missing values last', () => {
    const sessions = [
      makeSession('a', { lastRestoredAt: '2026-02-01T00:00:00.000Z' }),
      makeSession('b'), // never restored -> missing
      makeSession('c', { lastRestoredAt: '2026-01-01T00:00:00.000Z' }),
    ];
    const asc = computeSessionView(sessions, view({ sort: 'restored', sortDirection: 'asc' }), noSearch);
    expect(ids(asc.sessions)).toEqual(['c', 'a', 'b']);
    // Missing stays last even when descending.
    const desc = computeSessionView(sessions, view({ sort: 'restored', sortDirection: 'desc' }), noSearch);
    expect(ids(desc.sessions)).toEqual(['a', 'c', 'b']);
  });

  it('sorts by category, sessions without a category last', () => {
    const sessions = [
      makeSession('a', { categoryId: null }),
      makeSession('b', { categoryId: 'development' }),
      makeSession('c', { categoryId: 'search' }),
    ];
    const res = computeSessionView(sessions, view({ sort: 'category', sortDirection: 'asc' }), noSearch);
    // 'a' has no category, always sorted last; 'b'/'c' ordered by localized label.
    expect(res.sessions[res.sessions.length - 1].id).toBe('a');
    expect(ids(res.sessions).slice(0, 2).sort()).toEqual(['b', 'c']);
  });

  it('disables DnD for any non-manual sort', () => {
    const sessions = [makeSession('a')];
    const res = computeSessionView(sessions, view({ sort: 'date' }), noSearch);
    expect(res.isDndEnabled).toBe(false);
  });

  it('does not mutate the input array', () => {
    const sessions = [
      makeSession('a', { createdAt: '2026-03-01T00:00:00.000Z' }),
      makeSession('b', { createdAt: '2026-01-01T00:00:00.000Z' }),
    ];
    computeSessionView(sessions, view({ sort: 'date' }), noSearch);
    expect(ids(sessions)).toEqual(['a', 'b']);
  });
});

/* ── Active-state helpers ───────────────────────────────────────────────── */

describe('countActiveSessionViewOps / isSessionViewActive', () => {
  it('counts category filter and non-manual sort', () => {
    expect(countActiveSessionViewOps(view())).toBe(0);
    expect(countActiveSessionViewOps(view({ filterCategories: ['development'] }))).toBe(1);
    expect(countActiveSessionViewOps(view({ sort: 'date' }))).toBe(1);
    expect(
      countActiveSessionViewOps(view({ filterCategories: ['development'], sort: 'date' })),
    ).toBe(2);
  });

  it('reports active state', () => {
    expect(isSessionViewActive(view())).toBe(false);
    expect(isSessionViewActive(view({ sort: 'restored' }))).toBe(true);
  });
});

/* ── Normalization ──────────────────────────────────────────────────────── */

describe('normalizeSessionViewState', () => {
  it('returns defaults for non-object input', () => {
    expect(normalizeSessionViewState(null)).toEqual(DEFAULT_SESSION_VIEW_STATE);
    expect(normalizeSessionViewState('nope')).toEqual(DEFAULT_SESSION_VIEW_STATE);
  });

  it('drops stale sort modes and non-string categories', () => {
    const res = normalizeSessionViewState({
      filterCategories: ['development', 42, null],
      sort: 'color', // not a valid session sort mode
      sortDirection: 'desc',
    });
    expect(res.filterCategories).toEqual(['development']);
    expect(res.sort).toBe('manual');
    expect(res.sortDirection).toBe('desc');
  });

  it('preserves valid values', () => {
    const res = normalizeSessionViewState({
      filterCategories: ['search'],
      sort: 'restored',
      sortDirection: 'asc',
    });
    expect(res).toEqual({ filterCategories: ['search'], sort: 'restored', sortDirection: 'asc' });
  });
});
