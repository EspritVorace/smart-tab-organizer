import { useCallback, useEffect, useRef, useState } from 'react';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext.js';
import {
  measureAllWorkspacesStorageUsage,
  measureGlobalStorageUsage,
  getStorageQuotaBytes,
  type StorageCategoryUsage,
} from '@/utils/storageUsageUtils.js';
import type { WorkspaceAccentColor } from '@/schemas/workspace.js';
import { logger } from '@/utils/logger.js';

/** Per-workspace storage breakdown, used to split the usage view by workspace. */
export interface WorkspaceUsageBreakdown {
  workspaceId: string;
  name: string;
  accentColor: WorkspaceAccentColor;
  /** Per-category breakdown for this workspace, sorted by size desc. */
  categories: StorageCategoryUsage[];
  totalBytes: number;
}

export interface StorageUsageSnapshot {
  /** Per-category breakdown for the active workspace, sorted by size desc. */
  categories: StorageCategoryUsage[];
  /** Sum of the active workspace categories. */
  workspaceTotalBytes: number;
  /** Per-workspace breakdowns, sorted by total size desc. */
  workspaces: WorkspaceUsageBreakdown[];
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
  workspaces: [],
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
  const { activeId, workspaces, scopedItems } = useActiveWorkspaceContext();
  const [snapshot, setSnapshot] = useState<StorageUsageSnapshot>(EMPTY_SNAPSHOT);
  const mountedRef = useRef(true);

  const recompute = useCallback(async () => {
    try {
      const [entries, globalTotalBytes] = await Promise.all([
        measureAllWorkspacesStorageUsage(workspaces.map((w) => w.id)),
        measureGlobalStorageUsage(),
      ]);
      if (!mountedRef.current) return;

      const metaById = new Map(workspaces.map((w) => [w.id, w]));
      const breakdowns: WorkspaceUsageBreakdown[] = entries
        .map((entry) => {
          const meta = metaById.get(entry.workspaceId);
          return {
            workspaceId: entry.workspaceId,
            name: meta?.name ?? entry.workspaceId,
            accentColor: meta?.accentColor ?? 'indigo',
            categories: [...entry.categories].sort((a, b) => b.bytes - a.bytes),
            totalBytes: entry.workspaceTotalBytes,
          };
        })
        .sort((a, b) => b.totalBytes - a.totalBytes);

      // Active-workspace breakdown, kept for the single-workspace view and
      // backward compatibility with the summary KPI.
      const activeEntry = entries.find((e) => e.workspaceId === activeId);
      const activeCategories = activeEntry
        ? [...activeEntry.categories].sort((a, b) => b.bytes - a.bytes)
        : [];

      const quotaBytes = getStorageQuotaBytes();
      const quotaPercent = quotaBytes > 0 ? (globalTotalBytes / quotaBytes) * 100 : 0;

      setSnapshot({
        categories: activeCategories,
        workspaceTotalBytes: activeEntry?.workspaceTotalBytes ?? 0,
        workspaces: breakdowns,
        globalTotalBytes,
        quotaBytes,
        quotaPercent,
        isLoaded: true,
      });
    } catch (error) {
      logger.error('[STORAGE_USAGE] recompute failed:', error);
    }
  }, [activeId, workspaces]);

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
