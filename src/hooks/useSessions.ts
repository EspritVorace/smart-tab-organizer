import { useState, useEffect, useCallback } from 'react';
import {
  loadSessions,
  addSession,
  updateSession,
  deleteSession,
  saveSessions,
} from '@/utils/sessionStorage';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext';
import type { Session } from '@/types/session';

export interface UseSessionsReturn {
  sessions: Session[];
  isLoaded: boolean;
  createSession: (session: Session) => Promise<void>;
  renameSession: (id: string, name: string) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  reload: () => Promise<void>;
  /** Optimistically reorder sessions: updates state immediately, then persists. */
  updateOrder: (ordered: Session[]) => Promise<void>;
}

export function useSessions(): UseSessionsReturn {
  const { scopedItems } = useActiveWorkspaceContext();
  const sessionsItem = scopedItems.sessionsItem;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const reload = useCallback(async () => {
    const data = await loadSessions();
    setSessions(data);
    setIsLoaded(true);
  }, []);

  // Initial load
  useEffect(() => {
    reload();
  }, [reload]);

  // Watch changes to the active workspace's sessions item
  useEffect(() => {
    return sessionsItem.watch(() => {
      reload();
    });
  }, [sessionsItem, reload]);

  const createSession = useCallback(
    async (session: Session) => {
      await addSession(session);
      await reload();
    },
    [reload],
  );

  const renameSession = useCallback(
    async (id: string, name: string) => {
      await updateSession(id, { name });
      await reload();
    },
    [reload],
  );

  const removeSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
      await reload();
    },
    [reload],
  );

  const updateOrder = useCallback(
    async (ordered: Session[]) => {
      setSessions(ordered);
      await saveSessions(ordered);
    },
    [],
  );

  return { sessions, isLoaded, createSession, renameSession, removeSession, reload, updateOrder };
}
