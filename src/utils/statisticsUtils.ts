import type {
  Statistics,
  DailyBuckets,
  SessionDailyBuckets,
  SessionEventType,
} from '@/types/statistics.js';
import { defaultStatistics, defaultSessionEventCounters } from '@/types/statistics.js';
import { logger } from './logger.js';
import { getActiveScopedItems, getActiveScopedItemsSync } from './workspaceContext.js';

function purgeBucketsByDate<T extends Record<string, unknown>>(buckets: T, maxDays: number): T {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return Object.fromEntries(
    Object.entries(buckets).filter(([date]) => date >= cutoffStr),
  ) as T;
}

export function purgeOldBuckets(buckets: DailyBuckets, maxDays = 90): DailyBuckets {
  return purgeBucketsByDate(buckets, maxDays);
}

export function purgeOldSessionBuckets(
  buckets: SessionDailyBuckets,
  maxDays = 90,
): SessionDailyBuckets {
  return purgeBucketsByDate(buckets, maxDays);
}

export async function getStatisticsData(): Promise<Statistics> {
  try {
    const { statisticsItem } = await getActiveScopedItems();
    const value = await statisticsItem.getValue();
    return { ...defaultStatistics, ...value };
  } catch (error) {
    logger.error('Error getting statistics:', error);
    return defaultStatistics;
  }
}

export async function setStatisticsData(statistics: Statistics): Promise<void> {
  try {
    const { statisticsItem } = await getActiveScopedItems();
    await statisticsItem.setValue(statistics);
  } catch (error) {
    logger.error('Error setting statistics:', error);
  }
}

export async function updateStatisticsData(updates: Partial<Statistics>): Promise<void> {
  try {
    const current = await getStatisticsData();
    await setStatisticsData({ ...current, ...updates });
  } catch (error) {
    logger.error('Error updating statistics:', error);
  }
}

export async function incrementStat(type: 'grouping' | 'dedup', ruleId: string): Promise<void> {
  try {
    const current = await getStatisticsData();
    const today = new Date().toISOString().slice(0, 10);

    const buckets = current.dailyBuckets ?? {};
    const dayBucket = buckets[today] ?? {};
    const ruleBucket = dayBucket[ruleId] ?? { grouping: 0, dedup: 0 };

    const updatedDayBucket = {
      ...dayBucket,
      [ruleId]: { ...ruleBucket, [type]: ruleBucket[type] + 1 },
    };

    const updated: Statistics = {
      ...current,
      tabGroupsCreatedCount: type === 'grouping'
        ? current.tabGroupsCreatedCount + 1
        : current.tabGroupsCreatedCount,
      tabsDeduplicatedCount: type === 'dedup'
        ? current.tabsDeduplicatedCount + 1
        : current.tabsDeduplicatedCount,
      dailyBuckets: purgeOldBuckets({ ...buckets, [today]: updatedDayBucket }),
      firstUsedAt: current.firstUsedAt ?? new Date().toISOString(),
    };

    await setStatisticsData(updated);
  } catch (error) {
    logger.error(`Error incrementing stat ${type} for rule ${ruleId}:`, error);
  }
}

/**
 * Stamp `lastUsedAt` (ISO 8601) on the rule that just grouped tabs or closed a
 * duplicate. Re-reads the active-workspace rules right before writing to keep
 * the race window with a concurrent user edit minimal. The synthetic
 * `'__unmatched__'` id (used by dedup when no rule matched) is ignored.
 */
export async function stampRuleLastUsed(ruleId: string): Promise<void> {
  if (!ruleId || ruleId === '__unmatched__') return;
  try {
    const { domainRulesItem } = await getActiveScopedItems();
    const rules = (await domainRulesItem.getValue()) ?? [];
    let changed = false;
    const next = rules.map((rule) => {
      if (rule.id !== ruleId) return rule;
      changed = true;
      return { ...rule, lastUsedAt: new Date().toISOString() };
    });
    if (changed) await domainRulesItem.setValue(next);
  } catch (error) {
    logger.error(`Error stamping lastUsedAt for rule ${ruleId}:`, error);
  }
}

export async function incrementSessionEvent(
  event: SessionEventType,
  opts?: { tabsRestored?: number },
): Promise<void> {
  try {
    const current = await getStatisticsData();
    const events = current.sessionEvents ?? defaultSessionEventCounters;
    const today = new Date().toISOString().slice(0, 10);

    const buckets = events.dailyBuckets ?? {};
    const dayBucket = buckets[today] ?? {
      created: 0,
      restored: 0,
      tabsRestored: 0,
      archived: 0,
    };

    const tabsRestoredDelta = event === 'restored' ? (opts?.tabsRestored ?? 0) : 0;

    const updatedDayBucket = {
      ...dayBucket,
      [event]: dayBucket[event] + 1,
      tabsRestored: dayBucket.tabsRestored + tabsRestoredDelta,
    };

    const updatedEvents = {
      ...events,
      [event]: events[event] + 1,
      tabsRestored: events.tabsRestored + tabsRestoredDelta,
      dailyBuckets: purgeOldSessionBuckets({ ...buckets, [today]: updatedDayBucket }),
    };

    const updated: Statistics = {
      ...current,
      sessionEvents: updatedEvents,
      firstUsedAt: current.firstUsedAt ?? new Date().toISOString(),
    };

    await setStatisticsData(updated);
  } catch (error) {
    logger.error(`Error incrementing session event ${event}:`, error);
  }
}

export async function resetStatisticsData(): Promise<void> {
  try {
    await setStatisticsData(defaultStatistics);
  } catch (error) {
    logger.error('Error resetting statistics:', error);
  }
}

export function watchStatisticsData(
  callback: (statistics: Statistics) => void,
): () => void {
  const { statisticsItem } = getActiveScopedItemsSync();
  return statisticsItem.watch((newValue) => {
    callback({ ...defaultStatistics, ...newValue });
  });
}
