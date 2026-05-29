import { describe, it, expect } from 'vitest';
import {
  accumulateRuleBucket,
  buildTopRules,
  computeSessionEventAggregates,
  computeAggregates,
} from '../../src/hooks/useStatistics';
import { computeDateWindows } from '../../src/utils/statisticsDateUtils';
import type { Statistics, SessionEventCounters } from '../../src/types/statistics';
import type { DomainRuleSetting } from '../../src/types/syncSettings';

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function emptyAcc() {
  return {
    thisWeek: { grouping: 0, dedup: 0 },
    lastWeek: { grouping: 0, dedup: 0 },
    thisMonth: { grouping: 0, dedup: 0 },
    ruleAgg: {} as Record<string, { grouping: number; dedup: number }>,
  };
}

const today = new Date();
const windows = computeDateWindows(today);

// ── accumulateRuleBucket ──────────────────────────────────────────────────────

describe('accumulateRuleBucket', () => {
  it('counts an event from today in thisWeek and thisMonth but not lastWeek', () => {
    const acc = emptyAcc();
    const date = new Date(today);
    accumulateRuleBucket(acc, windows, date, 'r1', { grouping: 2, dedup: 1 });

    expect(acc.thisWeek.grouping).toBe(2);
    expect(acc.thisWeek.dedup).toBe(1);
    expect(acc.lastWeek.grouping).toBe(0);
    expect(acc.thisMonth.grouping).toBe(2);
    expect(acc.ruleAgg['r1']).toEqual({ grouping: 2, dedup: 1 });
  });

  it('counts an event from mid-last-week in thisMonth (but not thisWeek)', () => {
    const acc = emptyAcc();
    const midLastWeek = new Date(windows.lastWeekStart);
    midLastWeek.setDate(midLastWeek.getDate() + 3);

    accumulateRuleBucket(acc, windows, midLastWeek, 'r2', { grouping: 3, dedup: 0 });

    expect(acc.thisWeek.grouping).toBe(0);
    expect(acc.lastWeek.grouping).toBe(3);
    expect(acc.thisMonth.grouping).toBe(3);
    expect(acc.ruleAgg['r2']).toEqual({ grouping: 3, dedup: 0 });
  });

  it('ignores an event from 31+ days ago (outside all windows)', () => {
    const acc = emptyAcc();
    const oldDate = new Date(today);
    oldDate.setDate(oldDate.getDate() - 40);

    accumulateRuleBucket(acc, windows, oldDate, 'r3', { grouping: 5, dedup: 5 });

    expect(acc.thisWeek.grouping).toBe(0);
    expect(acc.lastWeek.grouping).toBe(0);
    expect(acc.thisMonth.grouping).toBe(0);
    expect(acc.ruleAgg['r3']).toBeUndefined();
  });

  it('initialises ruleAgg for a new ruleId and accumulates on subsequent calls', () => {
    const acc = emptyAcc();
    const date = new Date(today);
    accumulateRuleBucket(acc, windows, date, 'r4', { grouping: 1, dedup: 0 });
    accumulateRuleBucket(acc, windows, date, 'r4', { grouping: 2, dedup: 1 });

    expect(acc.ruleAgg['r4']).toEqual({ grouping: 3, dedup: 1 });
  });

  it('accumulates across multiple distinct rule IDs independently', () => {
    const acc = emptyAcc();
    const date = new Date(today);
    accumulateRuleBucket(acc, windows, date, 'rA', { grouping: 1, dedup: 0 });
    accumulateRuleBucket(acc, windows, date, 'rB', { grouping: 0, dedup: 2 });

    expect(acc.ruleAgg['rA'].grouping).toBe(1);
    expect(acc.ruleAgg['rB'].dedup).toBe(2);
    expect(acc.thisWeek).toEqual({ grouping: 1, dedup: 2 });
  });
});

// ── buildTopRules ─────────────────────────────────────────────────────────────

const mockRules: DomainRuleSetting[] = [
  { id: 'r-github', label: 'GitHub', domainFilter: '*.github.com', enabled: true, badge: null } as DomainRuleSetting,
  { id: 'r-jira', label: 'Jira', domainFilter: '*.jira.com', enabled: true, badge: null } as DomainRuleSetting,
  { id: 'r-notion', label: 'Notion', domainFilter: '*.notion.so', enabled: true, badge: null } as DomainRuleSetting,
];

describe('buildTopRules', () => {
  it('returns an empty array when ruleAgg is empty', () => {
    expect(buildTopRules({}, mockRules)).toEqual([]);
  });

  it('resolves the rule label from the domain rules list', () => {
    const ruleAgg = { 'r-github': { grouping: 5, dedup: 2 } };
    const [top] = buildTopRules(ruleAgg, mockRules);
    expect(top.label).toBe('GitHub');
    expect(top.total).toBe(7);
  });

  it('falls back to ruleId when no matching rule is found', () => {
    const ruleAgg = { 'unknown-rule': { grouping: 1, dedup: 0 } };
    const [top] = buildTopRules(ruleAgg, mockRules);
    expect(top.label).toBe('unknown-rule');
  });

  it('sorts rules by total (grouping + dedup) descending', () => {
    const ruleAgg = {
      'r-github': { grouping: 1, dedup: 1 },
      'r-jira': { grouping: 10, dedup: 5 },
      'r-notion': { grouping: 3, dedup: 0 },
    };
    const result = buildTopRules(ruleAgg, mockRules);
    expect(result[0].ruleId).toBe('r-jira');
    expect(result[1].ruleId).toBe('r-notion');
    expect(result[2].ruleId).toBe('r-github');
  });

  it('caps results at 5 entries even with more rules', () => {
    const ruleAgg: Record<string, { grouping: number; dedup: number }> = {};
    for (let i = 0; i < 10; i++) ruleAgg[`rule-${i}`] = { grouping: i, dedup: 0 };
    expect(buildTopRules(ruleAgg, [])).toHaveLength(5);
  });
});

// ── computeSessionEventAggregates ─────────────────────────────────────────────

describe('computeSessionEventAggregates', () => {
  it('returns zero totals and zero periods when events is undefined', () => {
    const result = computeSessionEventAggregates(undefined, windows);
    expect(result.totals).toEqual({ created: 0, restored: 0, tabsRestored: 0, archived: 0 });
    expect(result.thisWeek).toEqual({ created: 0, restored: 0, tabsRestored: 0 });
    expect(result.lastWeek).toEqual({ created: 0, restored: 0, tabsRestored: 0 });
  });

  it('counts dailyBucket entries from today in thisWeek', () => {
    const events: SessionEventCounters = {
      created: 3, restored: 1, tabsRestored: 5, archived: 0,
      dailyBuckets: {
        [daysAgo(0)]: { created: 3, restored: 1, tabsRestored: 5, archived: 0 },
      },
    };
    const result = computeSessionEventAggregates(events, windows);
    expect(result.thisWeek.created).toBe(3);
    expect(result.thisWeek.restored).toBe(1);
    expect(result.thisWeek.tabsRestored).toBe(5);
    expect(result.lastWeek.created).toBe(0);
  });

  it('counts events from mid-last-week only in lastWeek (not thisWeek)', () => {
    const midLastWeek = new Date(windows.lastWeekStart);
    midLastWeek.setDate(midLastWeek.getDate() + 3);
    const dateStr = midLastWeek.toISOString().slice(0, 10);

    const events: SessionEventCounters = {
      created: 2, restored: 0, tabsRestored: 0, archived: 0,
      dailyBuckets: {
        [dateStr]: { created: 2, restored: 0, tabsRestored: 0, archived: 0 },
      },
    };
    const result = computeSessionEventAggregates(events, windows);
    expect(result.thisWeek.created).toBe(0);
    expect(result.lastWeek.created).toBe(2);
  });

  it('ignores events from more than 14 days ago in weekly periods', () => {
    const events: SessionEventCounters = {
      created: 10, restored: 0, tabsRestored: 0, archived: 0,
      dailyBuckets: {
        [daysAgo(20)]: { created: 10, restored: 0, tabsRestored: 0, archived: 0 },
      },
    };
    const result = computeSessionEventAggregates(events, windows);
    expect(result.thisWeek.created).toBe(0);
    expect(result.lastWeek.created).toBe(0);
  });

  it('always reflects lifetime totals from the counters regardless of date windows', () => {
    const events: SessionEventCounters = {
      created: 42, restored: 7, tabsRestored: 100, archived: 3,
      dailyBuckets: {},
    };
    const result = computeSessionEventAggregates(events, windows);
    expect(result.totals.created).toBe(42);
    expect(result.totals.archived).toBe(3);
  });
});

// ── computeAggregates ─────────────────────────────────────────────────────────

describe('computeAggregates', () => {
  it('returns an empty aggregate when statistics is null', () => {
    const result = computeAggregates(null, []);
    expect(result.totalGrouping).toBe(0);
    expect(result.totalDedup).toBe(0);
    expect(result.firstUsedAt).toBeNull();
    expect(result.topRules).toEqual([]);
  });

  it('maps totalGrouping and totalDedup from the statistics counters', () => {
    const stats: Statistics = {
      tabGroupsCreatedCount: 12,
      tabsDeduplicatedCount: 5,
      dailyBuckets: {},
    };
    const result = computeAggregates(stats, []);
    expect(result.totalGrouping).toBe(12);
    expect(result.totalDedup).toBe(5);
  });

  it('parses firstUsedAt into a Date object when present', () => {
    const stats: Statistics = {
      tabGroupsCreatedCount: 0,
      tabsDeduplicatedCount: 0,
      dailyBuckets: {},
      firstUsedAt: '2025-01-15T10:00:00.000Z',
    };
    const result = computeAggregates(stats, []);
    expect(result.firstUsedAt).toBeInstanceOf(Date);
    expect(result.firstUsedAt?.getFullYear()).toBe(2025);
  });

  it('sets firstUsedAt to null when statistics does not have the field', () => {
    const stats: Statistics = { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 0, dailyBuckets: {} };
    expect(computeAggregates(stats, []).firstUsedAt).toBeNull();
  });

  it('aggregates dailyBuckets into thisWeek for entries from today', () => {
    const stats: Statistics = {
      tabGroupsCreatedCount: 3,
      tabsDeduplicatedCount: 1,
      dailyBuckets: {
        [daysAgo(0)]: { 'r-test': { grouping: 3, dedup: 1 } },
      },
    };
    const result = computeAggregates(stats, []);
    expect(result.thisWeek.grouping).toBe(3);
    expect(result.thisWeek.dedup).toBe(1);
    expect(result.thisMonth.grouping).toBe(3);
    expect(result.lastWeek.grouping).toBe(0);
  });

  it('builds topRules from the dailyBuckets rule aggregates', () => {
    const rules: DomainRuleSetting[] = [
      { id: 'r-1', label: 'Rule One', domainFilter: '*.r1.com', enabled: true, badge: null } as DomainRuleSetting,
    ];
    const stats: Statistics = {
      tabGroupsCreatedCount: 5,
      tabsDeduplicatedCount: 0,
      dailyBuckets: {
        [daysAgo(0)]: { 'r-1': { grouping: 5, dedup: 0 } },
      },
    };
    const result = computeAggregates(stats, rules);
    expect(result.topRules).toHaveLength(1);
    expect(result.topRules[0].label).toBe('Rule One');
    expect(result.topRules[0].total).toBe(5);
  });

  it('passes sessionEvents through computeSessionEventAggregates', () => {
    const stats: Statistics = {
      tabGroupsCreatedCount: 0,
      tabsDeduplicatedCount: 0,
      dailyBuckets: {},
      sessionEvents: {
        created: 7, restored: 2, tabsRestored: 10, archived: 1,
        dailyBuckets: {},
      },
    };
    const result = computeAggregates(stats, []);
    expect(result.sessionEvents.totals.created).toBe(7);
  });

  it('returns zero sessionEvents when sessionEvents is absent', () => {
    const stats: Statistics = { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 0, dailyBuckets: {} };
    const result = computeAggregates(stats, []);
    expect(result.sessionEvents.totals.created).toBe(0);
    expect(result.sessionEvents.thisWeek.created).toBe(0);
  });
});

// ── trend indicator ───────────────────────────────────────────────────────────

describe('trend indicator', () => {
  type TrendDirection = 'new' | 'up' | 'down' | 'stable';

  function getTrend(current: number, previous: number): TrendDirection {
    if (current === 0 && previous === 0) return 'stable';
    if (previous === 0 && current > 0) return 'new';
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  }

  it('returns "stable" when both values are 0', () => {
    expect(getTrend(0, 0)).toBe('stable');
  });

  it('returns "new" when the previous week was 0 and the current week > 0', () => {
    expect(getTrend(5, 0)).toBe('new');
  });

  it('returns "up" when the current week exceeds the previous one', () => {
    expect(getTrend(10, 7)).toBe('up');
  });

  it('returns "down" when the current week is below the previous one', () => {
    expect(getTrend(3, 8)).toBe('down');
  });

  it('returns "stable" when the values are equal and non-zero', () => {
    expect(getTrend(5, 5)).toBe('stable');
  });
});
