import { useCallback, useMemo } from 'react';
import type {
  Statistics,
  StatisticsAggregates,
  TopRuleStat,
  SessionEventAggregates,
  SessionEventCounters,
} from '@/types/statistics.js';
import { defaultStatistics, defaultSessionEventCounters } from '@/types/statistics.js';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext.js';
import { useStorageState } from './useStorageState.js';
import type { DomainRuleSetting } from '@/types/syncSettings.js';
import { computeDateWindows, type DateWindows } from '@/utils/statisticsDateUtils.js';

interface PeriodTotals { grouping: number; dedup: number }

interface BucketAccumulators {
  thisWeek: PeriodTotals;
  lastWeek: PeriodTotals;
  thisMonth: PeriodTotals;
  ruleAgg: Record<string, PeriodTotals>;
}

function accumulateRuleBucket(
  acc: BucketAccumulators,
  windows: DateWindows,
  date: Date,
  ruleId: string,
  ruleBucket: { grouping: number; dedup: number },
): void {
  const { grouping: g, dedup: d } = ruleBucket;
  if (date >= windows.thisWeekStart) {
    acc.thisWeek.grouping += g;
    acc.thisWeek.dedup += d;
  }
  if (date >= windows.lastWeekStart && date <= windows.lastWeekEnd) {
    acc.lastWeek.grouping += g;
    acc.lastWeek.dedup += d;
  }
  if (date >= windows.thirtyDaysAgo) {
    acc.thisMonth.grouping += g;
    acc.thisMonth.dedup += d;
    if (!acc.ruleAgg[ruleId]) acc.ruleAgg[ruleId] = { grouping: 0, dedup: 0 };
    acc.ruleAgg[ruleId].grouping += g;
    acc.ruleAgg[ruleId].dedup += d;
  }
}

function buildTopRules(
  ruleAgg: Record<string, PeriodTotals>,
  domainRules: DomainRuleSetting[],
): TopRuleStat[] {
  const ruleMap = new Map(domainRules.map(r => [r.id, r]));
  return Object.entries(ruleAgg)
    .map(([ruleId, agg]) => {
      const rule = ruleMap.get(ruleId);
      const label = rule?.label || rule?.domainFilter || ruleId;
      return { ruleId, label, grouping: agg.grouping, dedup: agg.dedup, total: agg.grouping + agg.dedup };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

function computeSessionEventAggregates(
  events: SessionEventCounters | undefined,
  windows: DateWindows,
): SessionEventAggregates {
  const counters = events ?? defaultSessionEventCounters;
  const thisWeek = { created: 0, restored: 0, tabsRestored: 0 };
  const lastWeek = { created: 0, restored: 0, tabsRestored: 0 };

  for (const [dateStr, bucket] of Object.entries(counters.dailyBuckets ?? {})) {
    const date = new Date(dateStr + 'T00:00:00');
    if (date >= windows.thisWeekStart) {
      thisWeek.created += bucket.created;
      thisWeek.restored += bucket.restored;
      thisWeek.tabsRestored += bucket.tabsRestored;
    }
    if (date >= windows.lastWeekStart && date <= windows.lastWeekEnd) {
      lastWeek.created += bucket.created;
      lastWeek.restored += bucket.restored;
      lastWeek.tabsRestored += bucket.tabsRestored;
    }
  }

  return {
    totals: {
      created: counters.created,
      restored: counters.restored,
      tabsRestored: counters.tabsRestored,
      archived: counters.archived,
    },
    thisWeek,
    lastWeek,
  };
}

function computeAggregates(
  statistics: Statistics | null,
  domainRules: DomainRuleSetting[],
): StatisticsAggregates {
  const emptyEvents: SessionEventAggregates = {
    totals: { created: 0, restored: 0, tabsRestored: 0, archived: 0 },
    thisWeek: { created: 0, restored: 0, tabsRestored: 0 },
    lastWeek: { created: 0, restored: 0, tabsRestored: 0 },
  };

  const empty: StatisticsAggregates = {
    totalGrouping: 0,
    totalDedup: 0,
    firstUsedAt: null,
    thisWeek: { grouping: 0, dedup: 0 },
    lastWeek: { grouping: 0, dedup: 0 },
    thisMonth: { grouping: 0, dedup: 0 },
    topRules: [],
    sessionEvents: emptyEvents,
  };

  if (!statistics) return empty;

  const windows = computeDateWindows(new Date());
  const acc: BucketAccumulators = {
    thisWeek: { grouping: 0, dedup: 0 },
    lastWeek: { grouping: 0, dedup: 0 },
    thisMonth: { grouping: 0, dedup: 0 },
    ruleAgg: {},
  };

  for (const [dateStr, dayBucket] of Object.entries(statistics.dailyBuckets ?? {})) {
    const date = new Date(dateStr + 'T00:00:00');
    for (const [ruleId, ruleBucket] of Object.entries(dayBucket)) {
      accumulateRuleBucket(acc, windows, date, ruleId, ruleBucket);
    }
  }

  return {
    totalGrouping: statistics.tabGroupsCreatedCount,
    totalDedup: statistics.tabsDeduplicatedCount,
    firstUsedAt: statistics.firstUsedAt ? new Date(statistics.firstUsedAt) : null,
    thisWeek: acc.thisWeek,
    lastWeek: acc.lastWeek,
    thisMonth: acc.thisMonth,
    topRules: buildTopRules(acc.ruleAgg, domainRules),
    sessionEvents: computeSessionEventAggregates(statistics.sessionEvents, windows),
  };
}

function mergeWithDefaults(v: Statistics | null): Statistics {
  return { ...defaultStatistics, ...v };
}

export interface UseStatisticsReturn {
  statistics: Statistics | null;
  statisticsAggregates: StatisticsAggregates;
  isLoaded: boolean;
  resetStatistics: () => Promise<void>;
  reloadStatistics: () => Promise<void>;
}

export function useStatistics(domainRules: DomainRuleSetting[] = []): UseStatisticsReturn {
  const { scopedItems } = useActiveWorkspaceContext();
  const statisticsItem = scopedItems.statisticsItem;

  const load = useCallback(
    async () => mergeWithDefaults(await statisticsItem.getValue()),
    [statisticsItem],
  );
  const watch = useCallback(
    (onChanged: (u: Partial<Statistics>) => void) =>
      statisticsItem.watch((v) => onChanged(mergeWithDefaults(v))),
    [statisticsItem],
  );
  const save = useCallback(
    async (_updates: Partial<Statistics>, current: Statistics) => {
      await statisticsItem.setValue(current);
    },
    [statisticsItem],
  );

  const { value: statistics, isLoaded, reset, reload } =
    useStorageState<Statistics>({ load, watch, save, defaults: defaultStatistics });

  const statisticsAggregates = useMemo(
    () => computeAggregates(statistics, domainRules),
    [statistics, domainRules],
  );

  return {
    statistics,
    statisticsAggregates,
    isLoaded,
    resetStatistics: reset,
    reloadStatistics: reload,
  };
}
