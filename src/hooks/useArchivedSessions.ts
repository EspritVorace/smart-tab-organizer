import { loadArchivedSessions } from '@/utils/sessionStorage';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext';
import type { Session } from '@/types/session';
import { useSessionBucketLoader } from './useSessionBucketLoader';

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
  const { sessions, isLoaded, reload } = useSessionBucketLoader({
    item: scopedItems.archivedSessionsItem,
    loader: loadArchivedSessions,
    enabled,
  });
  return { archivedSessions: sessions, isLoaded, reload };
}
