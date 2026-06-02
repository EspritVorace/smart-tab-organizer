import { useCallback, useEffect, useRef, useState } from 'react';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext.js';
import {
  measureWorkspaceStorageUsage,
  measureGlobalStorageUsage,
  getStorageQuotaBytes,
  type StorageCategoryUsage,
} from '@/utils/storageUsageUtils.js';
import { logger } from '@/utils/logger.js';

export interface StorageUsageSnapshot {
  /** Per-category breakdown for the active workspace, sorted by size desc. */
  categories: StorageCategoryUsage[];
  /** Sum of the active workspace categories. */
  workspaceTotalBytes: number;
  /** Total bytes used across the whole `storage.local` area (all workspaces). */
  globalTotalBytes: number;
  /** `storage.local` quota in bytes (with portable fallback). */
  quotaBytes: number;
  /** `globalTotalBytes` as a percentage of `quotaBytes`. */
  quotaPercent: number;
  isLoaded: boolean;
}

const EMPTY_SNAPSHOT: StorageUsageSnapshot = {
  categories: [],
  workspaceTotalBytes: 0,
  globalTotalBytes: 0,
  quotaBytes: 0,
  quotaPercent: 0,
  isLoaded: false,
};

/**
 * Computes live `storage.local` usage for the active workspace plus the whole
 * browser area. The snapshot is recomputed on mount and whenever any of the
 * measured storage items changes, so sizes stay fresh while the page is open.
 */
export function useStorageUsage(): StorageUsageSnapshot {
  const { activeId, scopedItems } = useActiveWorkspaceContext();
  const [snapshot, setSnapshot] = useState<StorageUsageSnapshot>(EMPTY_SNAPSHOT);
  const mountedRef = useRef(true);

  const recompute = useCallback(async () => {
    try {
      const [usage, globalTotalBytes] = await Promise.all([
        measureWorkspaceStorageUsage(activeId),
        measureGlobalStorageUsage(),
      ]);
      if (!mountedRef.current) return;

      const quotaBytes = getStorageQuotaBytes();
      const quotaPercent = quotaBytes > 0 ? (globalTotalBytes / quotaBytes) * 100 : 0;

      setSnapshot({
        categories: [...usage.categories].sort((a, b) => b.bytes - a.bytes),
        workspaceTotalBytes: usage.workspaceTotalBytes,
        globalTotalBytes,
        quotaBytes,
        quotaPercent,
        isLoaded: true,
      });
    } catch (error) {
      logger.error('[STORAGE_USAGE] recompute failed:', error);
    }
  }, [activeId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void recompute();

    const watched = [
      scopedItems.domainRulesItem,
      scopedItems.sessionsItem,
      scopedItems.pinnedSessionsItem,
      scopedItems.archivedSessionsItem,
      scopedItems.statisticsItem,
    ];
    const unwatchers = watched.map((item) => item.watch(() => void recompute()));

    return () => {
      unwatchers.forEach((unwatch) => unwatch());
    };
  }, [recompute, scopedItems]);

  return snapshot;
}
