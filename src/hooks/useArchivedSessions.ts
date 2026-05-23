import { useCallback, useEffect, useState } from 'react';
import { loadArchivedSessions } from '@/utils/sessionStorage';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext';
import type { Session } from '@/types/session';

export interface UseArchivedSessionsOptions {
  /**
   * When false, the hook stays inert (no initial load, no watcher). Flip to
   * true the first time the user reveals the archived view to avoid loading
   * the archive in surfaces that never display it (popup, home).
   */
  enabled: boolean;
}

export interface UseArchivedSessionsReturn {
  archivedSessions: Session[];
  isLoaded: boolean;
  reload: () => Promise<void>;
}

/**
 * Subscribes to the `archivedSessions` storage item of the active workspace.
 * Lazy by design: pass `enabled: false` to keep the archive out of memory
 * until it is actually needed (segmented control switch, export wizard).
 */
export function useArchivedSessions({ enabled }: UseArchivedSessionsOptions): UseArchivedSessionsReturn {
  const { scopedItems } = useActiveWorkspaceContext();
  const item = scopedItems.archivedSessionsItem;
  const [archivedSessions, setArchivedSessions] = useState<Session[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const data = await loadArchivedSessions();
    setArchivedSessions(data);
    setIsLoaded(true);
  }, [enabled]);

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

  return { archivedSessions, isLoaded, reload };
}
