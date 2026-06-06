import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => `i18n(${key})`),
}));

import {
  computeRuleView,
  countActiveViewOps,
  isRuleViewActive,
  normalizeRuleViewState,
  applySubsetReorder,
  DEFAULT_RULE_VIEW_STATE,
  type RuleViewState,
} from '../../src/utils/ruleViewUtils';
import type { DomainRuleSetting } from '../../src/types/syncSettings';
import type { ColorValue } from '../../src/schemas/enums';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

interface RuleOverrides {
  domainFilter?: string;
  color?: ColorValue;
  categoryId?: string | null;
  createdAt?: string;
  enabled?: boolean;
}

const makeRule = (id: string, o: RuleOverrides = {}): DomainRuleSetting => ({
  id,
  domainFilter: o.domainFilter ?? `${id}.example.com`,
  label: `Rule ${id}`,
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  deduplicationEnabled: true,
  presetId: null,
  enabled: o.enabled ?? true,
  ...(o.color !== undefined ? { color: o.color } : {}),
  ...(o.categoryId !== undefined ? { categoryId: o.categoryId } : {}),
  ...(o.createdAt !== undefined ? { createdAt: o.createdAt } : {}),
});

const view = (overrides: Partial<RuleViewState> = {}): RuleViewState => ({
  ...DEFAULT_RULE_VIEW_STATE,
  ...overrides,
});

const noSearch = { searchActive: false };
const ids = (rules: DomainRuleSetting[]) => rules.map(r => r.id);

/* ── Filtering ──────────────────────────────────────────────────────────── */

describe('computeRuleView - filtering', () => {
  it('filters by color, keeping real order', () => {
    const rules = [
      makeRule('a', { color: 'blue' }),
      makeRule('b', { color: 'red' }),
      makeRule('c', { color: 'blue' }),
    ];
    const res = computeRuleView(rules, view({ filterColors: ['blue'] }), noSearch);
    expect(ids(res.ungrouped)).toEqual(['a', 'c']);
    expect(res.visibleCount).toBe(2);
  });

  it('filters rules without a color via the __none__ sentinel', () => {
    const rules = [makeRule('a', { color: 'blue' }), makeRule('b')];
    const res = computeRuleView(rules, view({ filterColors: ['__none__'] }), noSearch);
    expect(ids(res.ungrouped)).toEqual(['b']);
  });

  it('filters by category including the no-category bucket', () => {
    const rules = [
      makeRule('a', { categoryId: 'development' }),
      makeRule('b', { categoryId: null }),
      makeRule('c', { categoryId: 'search' }),
    ];
    const res = computeRuleView(
      rules,
      view({ filterCategories: ['development', '__none__'] }),
      noSearch,
    );
    expect(ids(res.ungrouped)).toEqual(['a', 'b']);
  });

  it('filters by a single status', () => {
    const rules = [
      makeRule('a', { enabled: true }),
      makeRule('b', { enabled: false }),
      makeRule('c', { enabled: true }),
    ];
    const res = computeRuleView(rules, view({ filterStatus: ['disabled'] }), noSearch);
    expect(ids(res.ungrouped)).toEqual(['b']);
  });

  it('treats both statuses selected as no status filter', () => {
    const rules = [makeRule('a', { enabled: true }), makeRule('b', { enabled: false })];
    const res = computeRuleView(rules, view({ filterStatus: ['enabled', 'disabled'] }), noSearch);
    expect(ids(res.ungrouped)).toEqual(['a', 'b']);
  });

  it('combines a search predicate with filters', () => {
    const rules = [
      makeRule('a', { color: 'blue' }),
      makeRule('b', { color: 'blue' }),
    ];
    const res = computeRuleView(rules, view({ filterColors: ['blue'] }), {
      searchActive: true,
      searchPredicate: r => r.id === 'b',
    });
    expect(ids(res.ungrouped)).toEqual(['b']);
  });
});

/* ── Sorting ────────────────────────────────────────────────────────────── */

describe('computeRuleView - sorting', () => {
  it('keeps real order for manual sort', () => {
    const rules = [makeRule('b'), makeRule('a'), makeRule('c')];
    const res = computeRuleView(rules, view({ sort: 'manual' }), noSearch);
    expect(ids(res.ungrouped)).toEqual(['b', 'a', 'c']);
  });

  it('sorts by date ascending (oldest first) and descending (newest first)', () => {
    const rules = [
      makeRule('a', { createdAt: '2024-03-01T00:00:00Z' }),
      makeRule('b', { createdAt: '2024-01-01T00:00:00Z' }),
      makeRule('c', { createdAt: '2024-02-01T00:00:00Z' }),
    ];
    const asc = computeRuleView(rules, view({ sort: 'date', sortDirection: 'asc' }), noSearch);
    expect(ids(asc.ungrouped)).toEqual(['b', 'c', 'a']);
    const desc = computeRuleView(rules, view({ sort: 'date', sortDirection: 'desc' }), noSearch);
    expect(ids(desc.ungrouped)).toEqual(['a', 'c', 'b']);
  });

  it('keeps rules without a date last in both directions', () => {
    const rules = [
      makeRule('a', { createdAt: '2024-02-01T00:00:00Z' }),
      makeRule('b'),
      makeRule('c', { createdAt: '2024-01-01T00:00:00Z' }),
    ];
    const asc = computeRuleView(rules, view({ sort: 'date', sortDirection: 'asc' }), noSearch);
    expect(ids(asc.ungrouped)).toEqual(['c', 'a', 'b']);
    const desc = computeRuleView(rules, view({ sort: 'date', sortDirection: 'desc' }), noSearch);
    expect(ids(desc.ungrouped)).toEqual(['a', 'c', 'b']);
  });

  it('is stable: equal keys keep their real order', () => {
    const rules = [
      makeRule('a', { createdAt: '2024-01-01T00:00:00Z' }),
      makeRule('b', { createdAt: '2024-01-01T00:00:00Z' }),
      makeRule('c', { createdAt: '2024-01-01T00:00:00Z' }),
    ];
    const desc = computeRuleView(rules, view({ sort: 'date', sortDirection: 'desc' }), noSearch);
    expect(ids(desc.ungrouped)).toEqual(['a', 'b', 'c']);
  });
});

/* ── Grouping (category / color / status) ───────────────────────────────── */

describe('computeRuleView - explicit grouping', () => {
  it('groups by category with DnD disabled and a trailing no-category bucket', () => {
    const rules = [
      makeRule('a', { categoryId: 'development' }),
      makeRule('b', { categoryId: null }),
      makeRule('c', { categoryId: 'development' }),
    ];
    const res = computeRuleView(rules, view({ group: 'category' }), noSearch);
    expect(res.ungrouped).toEqual([]);
    expect(res.groups.every(g => g.isDndEnabled === false)).toBe(true);
    const devGroup = res.groups.find(g => g.key === 'category:development');
    expect(devGroup && ids(devGroup.rules)).toEqual(['a', 'c']);
    expect(res.groups.at(-1)?.key).toBe('category:__none__');
  });

  it('groups by color ordered by palette, no-color last', () => {
    const rules = [
      makeRule('a', { color: 'red' }),
      makeRule('b', { color: 'blue' }),
      makeRule('c' /* no color */),
    ];
    const res = computeRuleView(rules, view({ group: 'color' }), noSearch);
    // colorOptions order: grey, blue, red, ... -> blue before red.
    expect(res.groups.map(g => g.key)).toEqual(['color:blue', 'color:red', 'color:__none__']);
  });

  it('groups by status with enabled bucket first', () => {
    const rules = [
      makeRule('a', { enabled: false }),
      makeRule('b', { enabled: true }),
    ];
    const res = computeRuleView(rules, view({ group: 'status' }), noSearch);
    expect(res.groups.map(g => g.key)).toEqual(['status:enabled', 'status:disabled']);
    expect(res.groups[0].status).toBe('enabled');
  });
});

/* ── Domain auto-grouping (sort=domain, group=none) ─────────────────────── */

describe('computeRuleView - domain auto-grouping', () => {
  it('groups domains with 2+ rules and leaves singletons ungrouped', () => {
    const rules = [
      makeRule('g1', { domainFilter: 'github.com' }),
      makeRule('solo', { domainFilter: 'solo.com' }),
      makeRule('g2', { domainFilter: 'api.github.com' }),
    ];
    const res = computeRuleView(rules, view({ sort: 'domain' }), noSearch);
    expect(res.groups).toHaveLength(1);
    const group = res.groups[0];
    expect(group.key).toBe('domain:github.com');
    expect(group.isDndEnabled).toBe(true);
    // Rules within the DnD group are in REAL array order, not domain-sorted.
    expect(ids(group.rules)).toEqual(['g1', 'g2']);
    expect(ids(res.ungrouped)).toEqual(['solo']);
  });

  it('never groups regex/wildcard or empty domains, even with 2+ rules', () => {
    const rules = [
      makeRule('rx1', { domainFilter: '.*\\.example\\.com' }),
      makeRule('rx2', { domainFilter: 'foo.*' }),
      makeRule('g1', { domainFilter: 'github.com' }),
      makeRule('g2', { domainFilter: 'docs.github.com' }),
    ];
    const res = computeRuleView(rules, view({ sort: 'domain' }), noSearch);
    // Only the real github.com domain forms a group.
    expect(res.groups.map(g => g.key)).toEqual(['domain:github.com']);
    // The two regex rules stay isolated despite being 2.
    expect(ids(res.ungrouped)).toEqual(expect.arrayContaining(['rx1', 'rx2']));
    expect(res.groups.some(g => g.key.includes('__regex__'))).toBe(false);
  });

  it('domain group rules follow real order even when filtered', () => {
    const rules = [
      makeRule('g2', { domainFilter: 'b.github.com', color: 'blue' }),
      makeRule('skip', { domainFilter: 'c.github.com', color: 'red' }),
      makeRule('g1', { domainFilter: 'a.github.com', color: 'blue' }),
    ];
    const res = computeRuleView(rules, view({ sort: 'domain', filterColors: ['blue'] }), noSearch);
    expect(res.groups[0].key).toBe('domain:github.com');
    expect(ids(res.groups[0].rules)).toEqual(['g2', 'g1']);
  });
});

/* ── isUngroupedDndEnabled ──────────────────────────────────────────────── */

describe('computeRuleView - ungrouped DnD enablement', () => {
  const rules = [makeRule('a'), makeRule('b')];

  it('is enabled only in the pristine manual case', () => {
    const res = computeRuleView(rules, view(), noSearch);
    expect(res.isUngroupedDndEnabled).toBe(true);
  });

  it('is disabled when a filter is active', () => {
    const res = computeRuleView(rules, view({ filterStatus: ['enabled'] }), noSearch);
    expect(res.isUngroupedDndEnabled).toBe(false);
  });

  it('is disabled when search is active', () => {
    const res = computeRuleView(rules, view(), { searchActive: true, searchPredicate: () => true });
    expect(res.isUngroupedDndEnabled).toBe(false);
  });

  it('is disabled when a sort is active', () => {
    const res = computeRuleView(rules, view({ sort: 'date' }), noSearch);
    expect(res.isUngroupedDndEnabled).toBe(false);
  });
});

/* ── Active-op helpers ──────────────────────────────────────────────────── */

describe('countActiveViewOps / isRuleViewActive', () => {
  it('counts each active dimension once; both statuses count as none', () => {
    expect(countActiveViewOps(view())).toBe(0);
    expect(isRuleViewActive(view())).toBe(false);
    expect(countActiveViewOps(view({ filterStatus: ['enabled', 'disabled'] }))).toBe(0);
    expect(countActiveViewOps(view({ filterStatus: ['enabled'] }))).toBe(1);
    expect(
      countActiveViewOps(
        view({ filterColors: ['blue'], filterCategories: ['dev'], sort: 'date', group: 'color' }),
      ),
    ).toBe(4);
    expect(isRuleViewActive(view({ sort: 'date' }))).toBe(true);
  });
});

/* ── normalizeRuleViewState ─────────────────────────────────────────────── */

describe('normalizeRuleViewState', () => {
  it('falls back to defaults for non-objects', () => {
    expect(normalizeRuleViewState(null)).toEqual(DEFAULT_RULE_VIEW_STATE);
    expect(normalizeRuleViewState('nope')).toEqual(DEFAULT_RULE_VIEW_STATE);
  });

  it('drops invalid enum values and coerces unknown modes', () => {
    const result = normalizeRuleViewState({
      filterColors: ['blue', 'not-a-color', '__none__'],
      filterCategories: ['dev', 42],
      filterStatus: ['enabled', 'bogus'],
      sort: 'unknown',
      sortDirection: 'weird',
      group: 'domain', // no longer a valid group mode
    });
    expect(result.filterColors).toEqual(['blue', '__none__']);
    expect(result.filterCategories).toEqual(['dev']);
    expect(result.filterStatus).toEqual(['enabled']);
    expect(result.sort).toBe('manual');
    expect(result.sortDirection).toBe('asc');
    expect(result.group).toBe('none');
  });

  it('preserves valid state', () => {
    const valid = view({ sort: 'color', sortDirection: 'desc', group: 'status' });
    expect(normalizeRuleViewState(valid)).toEqual(valid);
  });
});

/* ── applySubsetReorder ─────────────────────────────────────────────────── */

describe('applySubsetReorder', () => {
  it('rewrites only the subset positions, preserving the rest', () => {
    const all = [makeRule('a'), makeRule('b'), makeRule('c'), makeRule('d')];
    // Reorder the subset {b, d} into {d, b}.
    const reorderedSubset = [all[3], all[1]];
    const result = applySubsetReorder(all, reorderedSubset);
    expect(ids(result)).toEqual(['a', 'd', 'c', 'b']);
  });
});
