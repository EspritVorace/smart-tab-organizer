import { useCallback, useEffect, useState } from 'react';
import { loadActiveSessions } from '@/utils/sessionStorage';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext';
import type { Session } from '@/types/session';

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
  const item = scopedItems.sessionsItem;
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const reload = useCallback(async () => {
    const data = await loadActiveSessions();
    setActiveSessions(data);
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

  return { activeSessions, isLoaded, reload };
}
