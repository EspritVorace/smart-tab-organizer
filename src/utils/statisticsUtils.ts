import type { Statistics, DailyBuckets } from '@/types/statistics.js';
import { defaultStatistics } from '@/types/statistics.js';
import { logger } from './logger.js';
import { statisticsItem } from './storageItems.js';

export function purgeOldBuckets(buckets: DailyBuckets, maxDays = 90): DailyBuckets {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return Object.fromEntries(
    Object.entries(buckets).filter(([date]) => date >= cutoffStr),
  );
}

export async function getStatisticsData(): Promise<Statistics> {
  try {
    const value = await statisticsItem.getValue();
    return { ...defaultStatistics, ...value };
  } catch (error) {
    logger.error('Error getting statistics:', error);
    return defaultStatistics;
  }
}

export async function setStatisticsData(statistics: Statistics): Promise<void> {
  try {
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
  return statisticsItem.watch((newValue) => {
    callback({ ...defaultStatistics, ...newValue });
  });
}
