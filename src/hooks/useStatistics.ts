import { useCallback } from 'react';
import type { Statistics } from '@/types/statistics.js';
import { defaultStatistics } from '@/types/statistics.js';
import { statisticsItem } from '@/utils/storageItems.js';
import { useSyncedState } from './useSyncedState.js';

export interface UseStatisticsReturn {
  statistics: Statistics | null;
  isLoaded: boolean;

  setTabGroupsCreatedCount: (value: number) => Promise<void>;
  setTabsDeduplicatedCount: (value: number) => Promise<void>;

  onTabGroupsCreatedCountChange: (callback: (value: number) => void) => () => void;
  onTabsDeduplicatedCountChange: (callback: (value: number) => void) => () => void;

  updateStatistics: (updates: Partial<Statistics>) => Promise<void>;
  resetStatistics: () => Promise<void>;
  incrementTabGroupsCreated: () => Promise<void>;
  incrementTabsDeduplicated: () => Promise<void>;
  reloadStatistics: () => Promise<void>;
}

function mergeWithDefaults(v: Statistics | null): Statistics {
  return { ...defaultStatistics, ...v };
}

export function useStatistics(): UseStatisticsReturn {
  const { value: statistics, isLoaded, update, reset, onFieldChange, reload } =
    useSyncedState<Statistics>({
      load: async () => mergeWithDefaults(await statisticsItem.getValue()),

      // The statistics object is stored as a single item.
      // Pass the full updated value to the watcher as a partial so the
      // generic hook merges it into state (effectively replacing all fields).
      watch: (onChanged) =>
        statisticsItem.watch(v => onChanged(mergeWithDefaults(v))),

      // Save the full current state (updates are already merged into `current`).
      save: async (_updates, current) => {
        await statisticsItem.setValue(current);
      },

      defaults: defaultStatistics,
    });

  const incrementTabGroupsCreated = useCallback(async () => {
    if (!statistics) return;
    await update({ tabGroupsCreatedCount: statistics.tabGroupsCreatedCount + 1 });
  }, [statistics, update]);

  const incrementTabsDeduplicated = useCallback(async () => {
    if (!statistics) return;
    await update({ tabsDeduplicatedCount: statistics.tabsDeduplicatedCount + 1 });
  }, [statistics, update]);

  return {
    statistics,
    isLoaded,

    setTabGroupsCreatedCount: (value) => update({ tabGroupsCreatedCount: value }),
    setTabsDeduplicatedCount: (value) => update({ tabsDeduplicatedCount: value }),

    onTabGroupsCreatedCountChange: (cb) => onFieldChange('tabGroupsCreatedCount', cb),
    onTabsDeduplicatedCountChange: (cb) => onFieldChange('tabsDeduplicatedCount', cb),

    updateStatistics: update,
    resetStatistics: reset,
    incrementTabGroupsCreated,
    incrementTabsDeduplicated,
    reloadStatistics: reload,
  };
}
