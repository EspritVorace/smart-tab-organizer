import { useMemo } from 'react';
import type { Statistics, StatisticsAggregates, TopRuleStat } from '@/types/statistics.js';
import { defaultStatistics } from '@/types/statistics.js';
import { statisticsItem } from '@/utils/storageItems.js';
import { useStorageState } from './useStorageState.js';
import type { DomainRuleSetting } from '@/types/syncSettings.js';

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

interface PeriodTotals { grouping: number; dedup: number }
interface DateWindows {
  thisWeekStart: Date;
  lastWeekStart: Date;
  lastWeekEnd: Date;
  thirtyDaysAgo: Date;
}

function computeDateWindows(today: Date): DateWindows {
  const thisWeekStart = getMondayOfWeek(today);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  return { thisWeekStart, lastWeekStart, lastWeekEnd, thirtyDaysAgo };
}

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

function computeAggregates(
  statistics: Statistics | null,
  domainRules: DomainRuleSetting[],
): StatisticsAggregates {
  const empty: StatisticsAggregates = {
    totalGrouping: 0,
    totalDedup: 0,
    firstUsedAt: null,
    thisWeek: { grouping: 0, dedup: 0 },
    lastWeek: { grouping: 0, dedup: 0 },
    thisMonth: { grouping: 0, dedup: 0 },
    topRules: [],
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
  const { value: statistics, isLoaded, reset, reload } =
    useStorageState<Statistics>({
      load: async () => mergeWithDefaults(await statisticsItem.getValue()),
      watch: (onChanged) =>
        statisticsItem.watch(v => onChanged(mergeWithDefaults(v))),
      save: async (_updates, current) => {
        await statisticsItem.setValue(current);
      },
      defaults: defaultStatistics,
    });

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
