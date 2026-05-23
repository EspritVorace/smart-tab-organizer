import { useCallback, useMemo } from 'react';
import {
  addSession,
  archiveSession as archiveSessionStorage,
  deleteSession,
  pinSession as pinSessionStorage,
  reorderSessions,
  unarchiveSession as unarchiveSessionStorage,
  unpinSession as unpinSessionStorage,
  updateSession,
  type SessionBucket,
} from '@/utils/sessionStorage';
import { usePinnedSessions } from './usePinnedSessions';
import { useActiveSessions } from './useActiveSessions';
import { useArchivedSessions } from './useArchivedSessions';
import type { Session } from '@/types/session';

export interface UseSessionsOptions {
  /**
   * Eagerly load and watch the archived bucket. Defaults to `true` so legacy
   * call sites still see the full session list. Surfaces that never display
   * the archive (popup, home) should consume `usePinnedSessions` directly
   * instead of paying this cost.
   */
  includeArchived?: boolean;
}

export interface UseSessionsReturn {
  /** Concatenation of pinned, active and (when included) archived sessions. */
  sessions: Session[];
  pinnedSessions: Session[];
  activeSessions: Session[];
  archivedSessions: Session[];
  isLoaded: boolean;
  createSession: (session: Session) => Promise<void>;
  renameSession: (id: string, name: string) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  archiveSession: (id: string) => Promise<void>;
  unarchiveSession: (id: string) => Promise<void>;
  pinSession: (id: string) => Promise<void>;
  unpinSession: (id: string) => Promise<void>;
  reload: () => Promise<void>;
  /** Optimistic per-bucket reorder. */
  updateOrder: (ordered: Session[], bucket?: SessionBucket) => Promise<void>;
}

/**
 * Facade combining the three per-bucket hooks. Each bucket lives in its own
 * storage key (`pinnedSessions`, `sessions`, `archivedSessions`) and is
 * watched independently, so a write to one bucket only triggers a reload of
 * that bucket. Mutations are routed through the bucket-aware sessionStorage
 * helpers, which keep the right item in sync.
 */
export function useSessions({ includeArchived = true }: UseSessionsOptions = {}): UseSessionsReturn {
  const pinned = usePinnedSessions();
  const active = useActiveSessions();
  const archived = useArchivedSessions({ enabled: includeArchived });

  const sessions = useMemo<Session[]>(
    () => [...pinned.pinnedSessions, ...active.activeSessions, ...archived.archivedSessions],
    [pinned.pinnedSessions, active.activeSessions, archived.archivedSessions],
  );

  const isLoaded = pinned.isLoaded && active.isLoaded && (!includeArchived || archived.isLoaded);

  const reload = useCallback(async () => {
    await Promise.all([
      pinned.reload(),
      active.reload(),
      includeArchived ? archived.reload() : Promise.resolve(),
    ]);
  }, [pinned, active, archived, includeArchived]);

  const createSession = useCallback(
    async (session: Session) => {
      await addSession(session);
    },
    [],
  );

  const renameSession = useCallback(
    async (id: string, name: string) => {
      await updateSession(id, { name });
    },
    [],
  );

  const removeSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
    },
    [],
  );

  const archive = useCallback(
    async (id: string) => {
      await archiveSessionStorage(id);
    },
    [],
  );

  const unarchive = useCallback(
    async (id: string) => {
      await unarchiveSessionStorage(id);
    },
    [],
  );

  const pin = useCallback(
    async (id: string) => {
      await pinSessionStorage(id);
    },
    [],
  );

  const unpin = useCallback(
    async (id: string) => {
      await unpinSessionStorage(id);
    },
    [],
  );

  const updateOrder = useCallback(
    async (ordered: Session[], bucket?: SessionBucket) => {
      if (bucket) {
        await reorderSessions(ordered, bucket);
        return;
      }
      const byBucket: Record<SessionBucket, Session[]> = { pinned: [], active: [], archived: [] };
      for (const session of ordered) {
        if (session.isArchived) byBucket.archived.push(session);
        else if (session.isPinned) byBucket.pinned.push(session);
        else byBucket.active.push(session);
      }
      await Promise.all([
        byBucket.pinned.length > 0 ? reorderSessions(byBucket.pinned, 'pinned') : Promise.resolve(),
        byBucket.active.length > 0 ? reorderSessions(byBucket.active, 'active') : Promise.resolve(),
        byBucket.archived.length > 0 ? reorderSessions(byBucket.archived, 'archived') : Promise.resolve(),
      ]);
    },
    [],
  );

  return {
    sessions,
    pinnedSessions: pinned.pinnedSessions,
    activeSessions: active.activeSessions,
    archivedSessions: archived.archivedSessions,
    isLoaded,
    createSession,
    renameSession,
    removeSession,
    archiveSession: archive,
    unarchiveSession: unarchive,
    pinSession: pin,
    unpinSession: unpin,
    reload,
    updateOrder,
  };
}
