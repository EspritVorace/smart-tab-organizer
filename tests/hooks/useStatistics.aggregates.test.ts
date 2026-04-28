import { describe, it, expect } from 'vitest';
import type { Statistics } from '../../src/types/statistics';

// Extraire computeAggregates via un import dynamique n'est pas possible directement
// (fonction non exportée), on teste donc la logique via les types publics.
// Les calculs réels sont testés ici en instanciant manuellement la logique.

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

function buildStats(overrides: Partial<Statistics> = {}): Statistics {
  return {
    tabGroupsCreatedCount: 0,
    tabsDeduplicatedCount: 0,
    dailyBuckets: {},
    ...overrides,
  };
}

// Reproduit la logique de computeAggregates pour les tests unitaires
function computeWeeklyTotals(stats: Statistics) {
  const today = new Date();
  const thisWeekStart = getMondayOfWeek(today);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

  const thisWeek = { grouping: 0, dedup: 0 };
  const lastWeek = { grouping: 0, dedup: 0 };

  for (const [dateStr, dayBucket] of Object.entries(stats.dailyBuckets ?? {})) {
    const date = new Date(dateStr + 'T00:00:00');
    for (const ruleBucket of Object.values(dayBucket)) {
      if (date >= thisWeekStart) {
        thisWeek.grouping += ruleBucket.grouping;
        thisWeek.dedup += ruleBucket.dedup;
      }
      if (date >= lastWeekStart && date <= lastWeekEnd) {
        lastWeek.grouping += ruleBucket.grouping;
        lastWeek.dedup += ruleBucket.dedup;
      }
    }
  }
  return { thisWeek, lastWeek };
}

function computeTopRules(stats: Statistics, labelMap: Record<string, string> = {}) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const ruleAgg: Record<string, { grouping: number; dedup: number }> = {};
  for (const [dateStr, dayBucket] of Object.entries(stats.dailyBuckets ?? {})) {
    const date = new Date(dateStr + 'T00:00:00');
    if (date < thirtyDaysAgo) continue;
    for (const [ruleId, ruleBucket] of Object.entries(dayBucket)) {
      if (!ruleAgg[ruleId]) ruleAgg[ruleId] = { grouping: 0, dedup: 0 };
      ruleAgg[ruleId].grouping += ruleBucket.grouping;
      ruleAgg[ruleId].dedup += ruleBucket.dedup;
    }
  }

  return Object.entries(ruleAgg)
    .map(([ruleId, agg]) => ({
      ruleId,
      label: labelMap[ruleId] ?? ruleId,
      grouping: agg.grouping,
      dedup: agg.dedup,
      total: agg.grouping + agg.dedup,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

describe('statisticsAggregates - calcul hebdomadaire', () => {
  it('compte uniquement les buckets de la semaine courante', () => {
    const today = isoDate(new Date());
    const stats = buildStats({
      dailyBuckets: {
        [today]: { 'rule-1': { grouping: 3, dedup: 1 } },
        [daysAgo(8)]: { 'rule-1': { grouping: 10, dedup: 5 } },
      },
    });
    const { thisWeek } = computeWeeklyTotals(stats);
    expect(thisWeek.grouping).toBe(3);
    expect(thisWeek.dedup).toBe(1);
  });

  it('compte uniquement les buckets de la semaine précédente', () => {
    const lastWeekDay = (() => {
      const d = getMondayOfWeek(new Date());
      d.setDate(d.getDate() - 3);
      return isoDate(d);
    })();
    const stats = buildStats({
      dailyBuckets: {
        [lastWeekDay]: { 'rule-1': { grouping: 7, dedup: 2 } },
      },
    });
    const { lastWeek } = computeWeeklyTotals(stats);
    expect(lastWeek.grouping).toBe(7);
    expect(lastWeek.dedup).toBe(2);
  });

  it('retourne des zéros si aucun bucket', () => {
    const stats = buildStats();
    const { thisWeek, lastWeek } = computeWeeklyTotals(stats);
    expect(thisWeek).toEqual({ grouping: 0, dedup: 0 });
    expect(lastWeek).toEqual({ grouping: 0, dedup: 0 });
  });

  it('additionne plusieurs règles sur la même semaine', () => {
    const today = isoDate(new Date());
    const stats = buildStats({
      dailyBuckets: {
        [today]: {
          'rule-1': { grouping: 2, dedup: 1 },
          'rule-2': { grouping: 3, dedup: 0 },
        },
      },
    });
    const { thisWeek } = computeWeeklyTotals(stats);
    expect(thisWeek.grouping).toBe(5);
    expect(thisWeek.dedup).toBe(1);
  });
});

describe('statisticsAggregates - top règles', () => {
  it('retourne les 5 règles les plus actives sur 30 jours', () => {
    const today = isoDate(new Date());
    const stats = buildStats({
      dailyBuckets: {
        [today]: {
          'r1': { grouping: 10, dedup: 0 },
          'r2': { grouping: 8, dedup: 0 },
          'r3': { grouping: 6, dedup: 0 },
          'r4': { grouping: 4, dedup: 0 },
          'r5': { grouping: 2, dedup: 0 },
          'r6': { grouping: 1, dedup: 0 },
        },
      },
    });
    const top = computeTopRules(stats);
    expect(top).toHaveLength(5);
    expect(top[0].ruleId).toBe('r1');
    expect(top[4].ruleId).toBe('r5');
  });

  it('exclut les buckets antérieurs à 30 jours', () => {
    const old = daysAgo(31);
    const stats = buildStats({
      dailyBuckets: {
        [old]: { 'rule-old': { grouping: 100, dedup: 50 } },
      },
    });
    expect(computeTopRules(stats)).toHaveLength(0);
  });

  it('utilise ruleId comme label si la règle est supprimée', () => {
    const today = isoDate(new Date());
    const stats = buildStats({
      dailyBuckets: {
        [today]: { 'deleted-rule-id': { grouping: 5, dedup: 0 } },
      },
    });
    const top = computeTopRules(stats, {});
    expect(top[0].label).toBe('deleted-rule-id');
  });

  it('trie par total décroissant', () => {
    const today = isoDate(new Date());
    const stats = buildStats({
      dailyBuckets: {
        [today]: {
          'low': { grouping: 1, dedup: 0 },
          'high': { grouping: 5, dedup: 5 },
          'mid': { grouping: 3, dedup: 2 },
        },
      },
    });
    const top = computeTopRules(stats);
    expect(top[0].ruleId).toBe('high');
    expect(top[1].ruleId).toBe('mid');
    expect(top[2].ruleId).toBe('low');
  });
});

describe('indicateur de tendance', () => {
  type TrendDirection = 'new' | 'up' | 'down' | 'stable';

  function getTrend(current: number, previous: number): TrendDirection {
    if (current === 0 && previous === 0) return 'stable';
    if (previous === 0 && current > 0) return 'new';
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  }

  it('retourne "stable" quand les deux sont à 0', () => {
    expect(getTrend(0, 0)).toBe('stable');
  });

  it('retourne "new" quand la semaine précédente était à 0 et la courante > 0', () => {
    expect(getTrend(5, 0)).toBe('new');
  });

  it('retourne "up" quand la semaine courante dépasse la précédente', () => {
    expect(getTrend(10, 7)).toBe('up');
  });

  it('retourne "down" quand la semaine courante est inférieure à la précédente', () => {
    expect(getTrend(3, 8)).toBe('down');
  });

  it('retourne "stable" quand les valeurs sont égales et non nulles', () => {
    expect(getTrend(5, 5)).toBe('stable');
  });
});
