import { useCallback, useEffect, useState } from 'react';
import type { WxtStorageItem } from 'wxt/utils/storage';
import type { Session } from '@/types/session';

export interface UseSessionBucketLoaderOptions {
  /**
   * The WXT storage item to watch for changes. When the item is updated the
   * hook re-runs `loader` automatically.
   */
  item: WxtStorageItem<Session[], Record<string, unknown>>;
  /**
   * Async function that returns the current sessions for the bucket. Injected
   * so each per-bucket hook can call its own dedicated loader without coupling
   * this hook to a concrete storage key.
   */
  loader: () => Promise<Session[]>;
  /**
   * When `false` the hook stays completely inert: it does not load on mount
   * and does not set up a storage watcher. Defaults to `true`.
   * Useful for the archived bucket, which should only be loaded on demand.
   */
  enabled?: boolean;
}

export interface UseSessionBucketLoaderReturn {
  sessions: Session[];
  isLoaded: boolean;
  reload: () => Promise<void>;
}

/**
 * Generic hook that loads a session bucket on mount, watches its storage item
 * for external changes and exposes a manual `reload` function.
 *
 * Extracted from `useActiveSessions`, `usePinnedSessions` and
 * `useArchivedSessions`, which all share this load-and-watch pattern.
 */
export function useSessionBucketLoader({
  item,
  loader,
  enabled = true,
}: UseSessionBucketLoaderOptions): UseSessionBucketLoaderReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const data = await loader();
    setSessions(data);
    setIsLoaded(true);
  }, [enabled, loader]);

  useEffect(() => {
    if (!enabled) return;
    reload();
  }, [enabled, reload]);

  useEffect(() => {
    if (!enabled) return;
    return item.watch(() => {
      reload();
    });
  }, [enabled, item, reload]);

  return { sessions, isLoaded, reload };
}
