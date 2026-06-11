import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { browser } from 'wxt/browser';
import {
  DEFAULT_WORKSPACE_ID,
  WORKSPACE_SCOPED_KEYS,
  activeWorkspaceIdItem,
  defineWorkspaceItems,
  workspacesIndexItem,
  workspaceStorageKey,
  type ScopedItems,
} from '@/utils/workspaceStorage.js';
import type { WorkspaceMeta, WorkspaceAccentColor } from '@/schemas/workspace.js';
import { performWorkspaceSwitch } from '@/utils/workspaceSwitch.js';
import { previousWorkspaceIdItem } from '@/utils/workspaceStorage.js';
import { logger } from '@/utils/logger.js';

export interface ActiveWorkspaceContextValue {
  workspaces: WorkspaceMeta[];
  activeId: string;
  active: WorkspaceMeta | null;
  accentColor: WorkspaceAccentColor;
  scopedItems: ScopedItems;
  isLoaded: boolean;
  switchTo: (id: string) => Promise<void>;
  /** Create a new workspace and return its metadata. Auto-switches to it. */
  createWorkspace: (name: string, accentColor: WorkspaceAccentColor) => Promise<WorkspaceMeta>;
  renameWorkspace: (id: string, name: string) => Promise<void>;
  setWorkspaceColor: (id: string, accentColor: WorkspaceAccentColor) => Promise<void>;
  /**
   * Delete a workspace and wipe its scoped data. Throws when:
   * - it is the default workspace (immovable, holds legacy data),
   * - it is the only remaining workspace.
   * If the deleted workspace was active, the next available one becomes active.
   */
  removeWorkspace: (id: string) => Promise<void>;
}

const FALLBACK_ACCENT: WorkspaceAccentColor = 'indigo';

function asyncNoop<T>(): Promise<T> {
  return Promise.resolve(undefined as T);
}

const defaultValue: ActiveWorkspaceContextValue = {
  workspaces: [],
  activeId: DEFAULT_WORKSPACE_ID,
  active: null,
  accentColor: FALLBACK_ACCENT,
  scopedItems: defineWorkspaceItems(DEFAULT_WORKSPACE_ID),
  isLoaded: false,
  switchTo: async () => undefined,
  createWorkspace: () => asyncNoop(),
  renameWorkspace: async () => undefined,
  setWorkspaceColor: async () => undefined,
  removeWorkspace: async () => undefined,
};

export const ActiveWorkspaceContext = createContext<ActiveWorkspaceContextValue>(defaultValue);

export function useActiveWorkspaceContext(): ActiveWorkspaceContextValue {
  return useContext(ActiveWorkspaceContext);
}

function generateWorkspaceId(): string {
  return crypto.randomUUID();
}

async function deleteScopedKeys(wsId: string): Promise<void> {
  if (wsId === DEFAULT_WORKSPACE_ID) return;
  const keys = WORKSPACE_SCOPED_KEYS.map((field) =>
    workspaceStorageKey(wsId, field).slice('local:'.length),
  );
  await browser.storage.local.remove(keys);
}

interface ActiveWorkspaceProviderProps {
  children: React.ReactNode;
}

export function ActiveWorkspaceProvider({ children }: ActiveWorkspaceProviderProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceMeta[]>([]);
  const [activeId, setActiveId] = useState<string>(DEFAULT_WORKSPACE_ID);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([workspacesIndexItem.getValue(), activeWorkspaceIdItem.getValue()])
      .then(([list, id]) => {
        if (cancelled) return;
        setWorkspaces(list ?? []);
        setActiveId((id ?? DEFAULT_WORKSPACE_ID) || DEFAULT_WORKSPACE_ID);
        setIsLoaded(true);
      })
      .catch((error) => logger.error('[ActiveWorkspaceProvider] load error:', error));

    const unwatchIndex = workspacesIndexItem.watch((next) => setWorkspaces(next ?? []));
    const unwatchActive = activeWorkspaceIdItem.watch((next) =>
      setActiveId(next ?? DEFAULT_WORKSPACE_ID),
    );

    return () => {
      cancelled = true;
      unwatchIndex();
      unwatchActive();
    };
  }, []);

  const switchTo = useCallback(async (id: string) => {
    // Delegate to the shared switch routine so the "previous workspace" pointer
    // (powering the "last used" shortcut) stays in sync no matter how the
    // switch was triggered. It stamps lastActivatedAt on the target and records
    // the outgoing workspace as the previous one.
    await performWorkspaceSwitch(id);
  }, []);

  const createWorkspace = useCallback(
    async (name: string, accentColor: WorkspaceAccentColor): Promise<WorkspaceMeta> => {
      const now = new Date().toISOString();
      const meta: WorkspaceMeta = {
        id: generateWorkspaceId(),
        name: name.trim(),
        accentColor,
        createdAt: now,
        updatedAt: now,
      };
      const current = (await workspacesIndexItem.getValue()) ?? [];
      await workspacesIndexItem.setValue([...current, meta]);
      // Creating a workspace auto-switches to it: record the outgoing one as
      // the previous pointer so "last used" can jump straight back.
      const outgoing = (await activeWorkspaceIdItem.getValue()) ?? DEFAULT_WORKSPACE_ID;
      if (outgoing !== meta.id) {
        await previousWorkspaceIdItem.setValue(outgoing);
      }
      await activeWorkspaceIdItem.setValue(meta.id);
      return meta;
    },
    [],
  );

  const renameWorkspace = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const current = (await workspacesIndexItem.getValue()) ?? [];
    const next = current.map((w) =>
      w.id === id ? { ...w, name: trimmed, updatedAt: new Date().toISOString() } : w,
    );
    await workspacesIndexItem.setValue(next);
  }, []);

  const setWorkspaceColor = useCallback(
    async (id: string, accentColor: WorkspaceAccentColor) => {
      const current = (await workspacesIndexItem.getValue()) ?? [];
      const next = current.map((w) =>
        w.id === id ? { ...w, accentColor, updatedAt: new Date().toISOString() } : w,
      );
      await workspacesIndexItem.setValue(next);
    },
    [],
  );

  const removeWorkspace = useCallback(async (id: string) => {
    if (id === DEFAULT_WORKSPACE_ID) {
      throw new Error('The default workspace cannot be removed.');
    }
    const current = (await workspacesIndexItem.getValue()) ?? [];
    if (current.length <= 1) {
      throw new Error('Cannot remove the last workspace.');
    }
    const next = current.filter((w) => w.id !== id);
    await workspacesIndexItem.setValue(next);

    const currentActive = (await activeWorkspaceIdItem.getValue()) ?? DEFAULT_WORKSPACE_ID;
    if (currentActive === id) {
      const fallback = next.find((w) => w.id === DEFAULT_WORKSPACE_ID) ?? next[0];
      await activeWorkspaceIdItem.setValue(fallback.id);
    }

    // Drop a now-dangling "last used" pointer so the shortcut never targets a
    // deleted workspace.
    const previous = await previousWorkspaceIdItem.getValue();
    if (previous === id) {
      await previousWorkspaceIdItem.setValue(null);
    }

    await deleteScopedKeys(id);
  }, []);

  const value = useMemo<ActiveWorkspaceContextValue>(() => {
    const active = workspaces.find((w) => w.id === activeId) ?? null;
    return {
      workspaces,
      activeId,
      active,
      accentColor: active?.accentColor ?? FALLBACK_ACCENT,
      scopedItems: defineWorkspaceItems(activeId),
      isLoaded,
      switchTo,
      createWorkspace,
      renameWorkspace,
      setWorkspaceColor,
      removeWorkspace,
    };
  }, [
    workspaces,
    activeId,
    isLoaded,
    switchTo,
    createWorkspace,
    renameWorkspace,
    setWorkspaceColor,
    removeWorkspace,
  ]);

  return (
    <ActiveWorkspaceContext.Provider value={value}>{children}</ActiveWorkspaceContext.Provider>
  );
}
