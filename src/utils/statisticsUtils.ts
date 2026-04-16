import type { Statistics } from '@/types/statistics.js';
import { defaultStatistics } from '@/types/statistics.js';
import { logger } from './logger.js';
import { statisticsItem } from './storageItems.js';

/**
 * Utilitaires pour les statistiques utilisables dans tous les contextes
 * (background, content scripts, popup, options)
 */

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
    const updated = { ...current, ...updates };
    await setStatisticsData(updated);
  } catch (error) {
    logger.error('Error updating statistics:', error);
  }
}

export async function incrementTabGroupsCreated(): Promise<void> {
  try {
    const current = await getStatisticsData();
    await updateStatisticsData({
      tabGroupsCreatedCount: current.tabGroupsCreatedCount + 1,
    });
  } catch (error) {
    logger.error('Error incrementing tab groups created:', error);
  }
}

export async function incrementTabsDeduplicated(): Promise<void> {
  try {
    const current = await getStatisticsData();
    await updateStatisticsData({
      tabsDeduplicatedCount: current.tabsDeduplicatedCount + 1,
    });
  } catch (error) {
    logger.error('Error incrementing tabs deduplicated:', error);
  }
}

export async function incrementStat(key: keyof Statistics): Promise<Statistics> {
  try {
    const current = await getStatisticsData();
    const updated = { ...current, [key]: (current[key] || 0) + 1 };
    await setStatisticsData(updated);
    return updated;
  } catch (error) {
    logger.error(`Error incrementing stat ${key}:`, error);
    return await getStatisticsData();
  }
}

export async function resetStatisticsData(): Promise<void> {
  try {
    await setStatisticsData(defaultStatistics);
  } catch (error) {
    logger.error('Error resetting statistics:', error);
  }
}

/**
 * Écouter les changements de statistiques
 * Retourne une fonction de cleanup
 */
export function watchStatisticsData(
  callback: (statistics: Statistics) => void,
): () => void {
  return statisticsItem.watch((newValue) => {
    callback({ ...defaultStatistics, ...newValue });
  });
}
