import { useState, useEffect, useCallback } from 'react';
import { browser } from 'wxt/browser';
import {
  loadSessions,
  addSession,
  updateSession,
  deleteSession,
  saveSessions,
} from '../utils/sessionStorage';
import type { Session } from '../types/session';

/** Sort sessions with pinned ones first, preserving order within each group */
function sortSessionsByPinned(sessions: Session[]): Session[] {
  const pinned = sessions.filter(s => s.isPinned);
  const unpinned = sessions.filter(s => !s.isPinned);
  return [...pinned, ...unpinned];
}

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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const reload = useCallback(async () => {
    const data = await loadSessions();
    setSessions(sortSessionsByPinned(data));
    setIsLoaded(true);
  }, []);

  // Initial load
  useEffect(() => {
    reload();
  }, [reload]);

  // Listen for storage changes
  useEffect(() => {
    const listener = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes.sessions) {
        reload();
      }
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, [reload]);

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
      const sorted = sortSessionsByPinned(ordered);
      setSessions(sorted);
      await saveSessions(sorted);
    },
    [],
  );

  return { sessions, isLoaded, createSession, renameSession, removeSession, reload, updateOrder };
}
