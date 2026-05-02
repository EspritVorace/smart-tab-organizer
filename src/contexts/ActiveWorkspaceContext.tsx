import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  DEFAULT_WORKSPACE_ID,
  activeWorkspaceIdItem,
  defineWorkspaceItems,
  workspacesIndexItem,
  type ScopedItems,
} from '@/utils/workspaceStorage.js';
import type { WorkspaceMeta, WorkspaceAccentColor } from '@/schemas/workspace.js';
import { logger } from '@/utils/logger.js';

export interface ActiveWorkspaceContextValue {
  /** All known workspaces, in storage order. Always at least one entry. */
  workspaces: WorkspaceMeta[];
  /** The active workspace id (defaults to DEFAULT_WORKSPACE_ID before load completes). */
  activeId: string;
  /** Resolved metadata for the active workspace, or null if not yet loaded. */
  active: WorkspaceMeta | null;
  /** Effective accent color for the Radix Theme; falls back to indigo. */
  accentColor: WorkspaceAccentColor;
  /** Storage items scoped to the active workspace. Stable for a given activeId. */
  scopedItems: ScopedItems;
  /** True once the initial load from storage completed. */
  isLoaded: boolean;
  /** Switch the active workspace (persists to storage; consumers remount via key={activeId}). */
  switchTo: (id: string) => Promise<void>;
}

const FALLBACK_ACCENT: WorkspaceAccentColor = 'indigo';

const defaultValue: ActiveWorkspaceContextValue = {
  workspaces: [],
  activeId: DEFAULT_WORKSPACE_ID,
  active: null,
  accentColor: FALLBACK_ACCENT,
  scopedItems: defineWorkspaceItems(DEFAULT_WORKSPACE_ID),
  isLoaded: false,
  switchTo: async () => undefined,
};

export const ActiveWorkspaceContext = createContext<ActiveWorkspaceContextValue>(defaultValue);

export function useActiveWorkspaceContext(): ActiveWorkspaceContextValue {
  return useContext(ActiveWorkspaceContext);
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
    await activeWorkspaceIdItem.setValue(id);
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
    };
  }, [workspaces, activeId, isLoaded, switchTo]);

  return (
    <ActiveWorkspaceContext.Provider value={value}>{children}</ActiveWorkspaceContext.Provider>
  );
}
