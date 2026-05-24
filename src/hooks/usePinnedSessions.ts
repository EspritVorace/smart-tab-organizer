import { loadPinnedSessions } from '@/utils/sessionStorage';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext';
import type { Session } from '@/types/session';
import { useSessionBucketLoader } from './useSessionBucketLoader';

export interface UsePinnedSessionsReturn {
  pinnedSessions: Session[];
  isLoaded: boolean;
  reload: () => Promise<void>;
}

/**
 * Subscribes to the `pinnedSessions` storage item of the active workspace.
 * Used by the popup and any surface that only needs profiles, so neither
 * active nor archived sessions are loaded into memory.
 */
export function usePinnedSessions(): UsePinnedSessionsReturn {
  const { scopedItems } = useActiveWorkspaceContext();
  const { sessions, isLoaded, reload } = useSessionBucketLoader({
    item: scopedItems.pinnedSessionsItem,
    loader: loadPinnedSessions,
  });
  return { pinnedSessions: sessions, isLoaded, reload };
}
