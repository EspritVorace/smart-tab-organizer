import { useCallback, useEffect, useState } from 'react';
import { loadPinnedSessions } from '@/utils/sessionStorage';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext';
import type { Session } from '@/types/session';

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
  const item = scopedItems.pinnedSessionsItem;
  const [pinnedSessions, setPinnedSessions] = useState<Session[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const reload = useCallback(async () => {
    const data = await loadPinnedSessions();
    setPinnedSessions(data);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    return item.watch(() => {
      reload();
    });
  }, [item, reload]);

  return { pinnedSessions, isLoaded, reload };
}
