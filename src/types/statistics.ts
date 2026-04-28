export interface DailyRuleBucket {
  grouping: number;
  dedup: number;
}

export type DailyBuckets = {
  [date: string]: {
    [ruleId: string]: DailyRuleBucket;
  };
};

export interface TopRuleStat {
  ruleId: string;
  label: string;
  grouping: number;
  dedup: number;
  total: number;
}

export interface StatisticsAggregates {
  totalGrouping: number;
  totalDedup: number;
  firstUsedAt: Date | null;
  thisWeek: { grouping: number; dedup: number };
  lastWeek: { grouping: number; dedup: number };
  thisMonth: { grouping: number; dedup: number };
  topRules: TopRuleStat[];
}

export interface Statistics {
  tabGroupsCreatedCount: number;
  tabsDeduplicatedCount: number;
  dailyBuckets: DailyBuckets;
  firstUsedAt?: string;
}

export const defaultStatistics: Statistics = {
  tabGroupsCreatedCount: 0,
  tabsDeduplicatedCount: 0,
  dailyBuckets: {},
};
