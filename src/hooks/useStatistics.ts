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

  const today = new Date();
  const buckets = statistics.dailyBuckets ?? {};

  const thisWeekStart = getMondayOfWeek(today);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const thisWeek = { grouping: 0, dedup: 0 };
  const lastWeek = { grouping: 0, dedup: 0 };
  const thisMonth = { grouping: 0, dedup: 0 };
  const ruleAgg: Record<string, { grouping: number; dedup: number }> = {};

  for (const [dateStr, dayBucket] of Object.entries(buckets)) {
    const date = new Date(dateStr + 'T00:00:00');
    for (const [ruleId, ruleBucket] of Object.entries(dayBucket)) {
      const g = ruleBucket.grouping;
      const d = ruleBucket.dedup;

      if (date >= thisWeekStart) {
        thisWeek.grouping += g;
        thisWeek.dedup += d;
      }
      if (date >= lastWeekStart && date <= lastWeekEnd) {
        lastWeek.grouping += g;
        lastWeek.dedup += d;
      }
      if (date >= thirtyDaysAgo) {
        thisMonth.grouping += g;
        thisMonth.dedup += d;
        if (!ruleAgg[ruleId]) ruleAgg[ruleId] = { grouping: 0, dedup: 0 };
        ruleAgg[ruleId].grouping += g;
        ruleAgg[ruleId].dedup += d;
      }
    }
  }

  const ruleMap = new Map(domainRules.map(r => [r.id, r]));

  const topRules: TopRuleStat[] = Object.entries(ruleAgg)
    .map(([ruleId, agg]) => {
      const rule = ruleMap.get(ruleId);
      const label = rule?.label || rule?.domainFilter || ruleId;
      return { ruleId, label, grouping: agg.grouping, dedup: agg.dedup, total: agg.grouping + agg.dedup };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    totalGrouping: statistics.tabGroupsCreatedCount,
    totalDedup: statistics.tabsDeduplicatedCount,
    firstUsedAt: statistics.firstUsedAt ? new Date(statistics.firstUsedAt) : null,
    thisWeek,
    lastWeek,
    thisMonth,
    topRules,
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
