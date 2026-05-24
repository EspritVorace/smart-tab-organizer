import { loadActiveSessions } from '@/utils/sessionStorage';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext';
import type { Session } from '@/types/session';
import { useSessionBucketLoader } from './useSessionBucketLoader';

export interface UseActiveSessionsReturn {
  activeSessions: Session[];
  isLoaded: boolean;
  reload: () => Promise<void>;
}

/**
 * Subscribes to the `sessions` storage item (active, non-pinned,
 * non-archived sessions) of the active workspace.
 */
export function useActiveSessions(): UseActiveSessionsReturn {
  const { scopedItems } = useActiveWorkspaceContext();
  const { sessions, isLoaded, reload } = useSessionBucketLoader({
    item: scopedItems.sessionsItem,
    loader: loadActiveSessions,
  });
  return { activeSessions: sessions, isLoaded, reload };
}
