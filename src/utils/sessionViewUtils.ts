import type { Session } from '@/types/session.js';
import { getRuleCategory, getCategoryLabel } from './categoriesStore.js';
import { stableSortByKey, type SortKey } from './sortUtils.js';

/* ── Types ──────────────────────────────────────────────────────────────── */

export type SessionSortMode = 'manual' | 'date' | 'restored' | 'category';
export type SessionSortDirection = 'asc' | 'desc';

export interface SessionViewState {
  /** Selected category ids to keep. Empty = no filter. `'__none__'` keeps sessions without a category. */
  filterCategories: string[];
  sort: SessionSortMode;
  /** Sort direction, ignored when `sort === 'manual'`. */
  sortDirection: SessionSortDirection;
}

export const DEFAULT_SESSION_VIEW_STATE: SessionViewState = {
  filterCategories: [],
  sort: 'manual',
  sortDirection: 'asc',
};

export interface SessionViewResult {
  /** Sessions after filter + sort, in display order. */
  sessions: Session[];
  /** True only in the pristine manual case (no sort, no category filter, no search). */
  isDndEnabled: boolean;
  /** Total number of sessions visible after filtering. */
  visibleCount: number;
}

const NONE = '__none__';

/* ── Active-state helpers ───────────────────────────────────────────────── */

export function countActiveSessionViewOps(view: SessionViewState): number {
  return (view.filterCategories.length > 0 ? 1 : 0) + (view.sort !== 'manual' ? 1 : 0);
}

export function isSessionViewActive(view: SessionViewState): boolean {
  return countActiveSessionViewOps(view) > 0;
}

/* ── Normalization (guards persisted state against stale enum values) ───── */

const SORT_MODES: readonly SessionSortMode[] = ['manual', 'date', 'restored', 'category'];

export function normalizeSessionViewState(raw: unknown): SessionViewState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SESSION_VIEW_STATE };
  const r = raw as Partial<Record<keyof SessionViewState, unknown>>;

  const filterCategories = Array.isArray(r.filterCategories)
    ? r.filterCategories.filter((c): c is string => typeof c === 'string')
    : [];
  const sort = SORT_MODES.includes(r.sort as SessionSortMode)
    ? (r.sort as SessionSortMode)
    : 'manual';
  const sortDirection = r.sortDirection === 'desc' ? 'desc' : 'asc';

  return { filterCategories, sort, sortDirection };
}

/* ── Sorting ────────────────────────────────────────────────────────────── */

/** Returns an ascending sort key plus whether the value is "missing" (always sorted last). */
function sortKeyOf(session: Session, mode: Exclude<SessionSortMode, 'manual'>): SortKey {
  switch (mode) {
    case 'date': {
      const value = session.createdAt ?? session.updatedAt ?? '';
      return { key: value, missing: value === '' };
    }
    case 'restored': {
      const value = session.lastRestoredAt ?? '';
      return { key: value, missing: value === '' };
    }
    case 'category': {
      const cat = getRuleCategory(session.categoryId);
      return { key: cat ? getCategoryLabel(cat).toLowerCase() : '', missing: !cat };
    }
  }
}

function sortSessions(
  sessions: Session[],
  mode: Exclude<SessionSortMode, 'manual'>,
  direction: SessionSortDirection,
): Session[] {
  return stableSortByKey(sessions, session => sortKeyOf(session, mode), direction);
}

/* ── Main entry point ───────────────────────────────────────────────────── */

export function computeSessionView(
  sessions: Session[],
  view: SessionViewState,
  opts: { searchActive: boolean },
): SessionViewResult {
  const catSet = new Set(view.filterCategories);

  // A. Filter (preserves real array order).
  const visible =
    catSet.size > 0
      ? sessions.filter(s => catSet.has(s.categoryId ?? NONE))
      : sessions;

  const visibleCount = visible.length;

  // B. Sort (display only; 'manual' keeps the real order).
  const sorted =
    view.sort === 'manual' ? visible : sortSessions(visible, view.sort, view.sortDirection);

  const isDndEnabled = view.sort === 'manual' && catSet.size === 0 && !opts.searchActive;

  return { sessions: sorted, isDndEnabled, visibleCount };
}
