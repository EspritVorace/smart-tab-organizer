import type { Statistics } from '../types/statistics.js';
import { defaultStatistics } from '../types/statistics.js';

/**
 * Utilitaires pour les statistiques utilisables dans tous les contextes
 * (background, content scripts, popup, options)
 */

export async function getStatisticsData(): Promise<Statistics> {
  try {
    const result = await browser.storage.local.get({
      statistics: defaultStatistics
    });
    
    return { 
      ...defaultStatistics, 
      ...result.statistics 
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    return defaultStatistics;
  }
}

export async function setStatisticsData(statistics: Statistics): Promise<void> {
  try {
    await browser.storage.local.set({ statistics });
  } catch (error) {
    console.error('Error setting statistics:', error);
  }
}

export async function updateStatisticsData(updates: Partial<Statistics>): Promise<void> {
  try {
    const current = await getStatisticsData();
    const updated = { ...current, ...updates };
    await setStatisticsData(updated);
  } catch (error) {
    console.error('Error updating statistics:', error);
  }
}

export async function incrementTabGroupsCreated(): Promise<void> {
  try {
    const current = await getStatisticsData();
    await updateStatisticsData({ 
      tabGroupsCreatedCount: current.tabGroupsCreatedCount + 1 
    });
  } catch (error) {
    console.error('Error incrementing tab groups created:', error);
  }
}

export async function incrementTabsDeduplicated(): Promise<void> {
  try {
    const current = await getStatisticsData();
    await updateStatisticsData({ 
      tabsDeduplicatedCount: current.tabsDeduplicatedCount + 1 
    });
  } catch (error) {
    console.error('Error incrementing tabs deduplicated:', error);
  }
}

export async function resetStatisticsData(): Promise<void> {
  try {
    await setStatisticsData(defaultStatistics);
  } catch (error) {
    console.error('Error resetting statistics:', error);
  }
}

/**
 * Écouter les changements de statistiques
 * Retourne une fonction de cleanup
 */
export function watchStatisticsData(
  callback: (statistics: Statistics) => void
): () => void {
  const listener = (changes: any, areaName: string) => {
    if (areaName === 'local' && changes.statistics) {
      const statistics = { 
        ...defaultStatistics, 
        ...changes.statistics.newValue 
      };
      callback(statistics);
    }
  };

  browser.storage.onChanged.addListener(listener);
  
  return () => {
    browser.storage.onChanged.removeListener(listener);
  };
}