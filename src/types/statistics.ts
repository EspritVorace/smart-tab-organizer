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

export type SessionEventType = 'created' | 'restored' | 'archived';

export interface SessionDailyBucket {
  created: number;
  restored: number;
  tabsRestored: number;
  archived: number;
}

export type SessionDailyBuckets = {
  [date: string]: SessionDailyBucket;
};

export interface SessionEventCounters {
  created: number;
  restored: number;
  tabsRestored: number;
  archived: number;
  dailyBuckets: SessionDailyBuckets;
}

export interface SessionEventPeriodTotals {
  created: number;
  restored: number;
  tabsRestored: number;
}

export interface SessionEventAggregates {
  totals: {
    created: number;
    restored: number;
    tabsRestored: number;
    archived: number;
  };
  thisWeek: SessionEventPeriodTotals;
  lastWeek: SessionEventPeriodTotals;
}

export interface StatisticsAggregates {
  totalGrouping: number;
  totalDedup: number;
  firstUsedAt: Date | null;
  thisWeek: { grouping: number; dedup: number };
  lastWeek: { grouping: number; dedup: number };
  thisMonth: { grouping: number; dedup: number };
  topRules: TopRuleStat[];
  sessionEvents: SessionEventAggregates;
}

export interface Statistics {
  tabGroupsCreatedCount: number;
  tabsDeduplicatedCount: number;
  dailyBuckets: DailyBuckets;
  firstUsedAt?: string;
  sessionEvents?: SessionEventCounters;
}

export const defaultSessionEventCounters: SessionEventCounters = {
  created: 0,
  restored: 0,
  tabsRestored: 0,
  archived: 0,
  dailyBuckets: {},
};

export const defaultStatistics: Statistics = {
  tabGroupsCreatedCount: 0,
  tabsDeduplicatedCount: 0,
  dailyBuckets: {},
  sessionEvents: defaultSessionEventCounters,
};
