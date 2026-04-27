import { useState, useMemo } from 'react';
import type { Session } from '@/types/session';
import type { ChromeGroupColor } from '@/types/tabTree';
import { moveTabInGroup, reassignTabToGroup } from '@/utils/sessionOrderUtils';

export interface UseSessionEditorReturn {
  /** The session being edited (working copy) */
  editedSession: Session;
  /** True if the session has been modified from the original */
  isDirty: boolean;
  /** Update the session name */
  updateSessionName: (name: string) => void;
  /** Update the session note */
  updateSessionNote: (note: string) => void;
  /** Apply a full session update (used as TabTreeEditor's onSessionChange) */
  applySessionUpdate: (updatedSession: Session) => void;
  /** Remove a tab (grouped or ungrouped) by ID */
  removeTab: (tabId: string) => void;
  /** Update the URL of a tab */
  updateTabUrl: (tabId: string, url: string) => void;
  /** Move a tab up or down within its context */
  moveTab: (tabId: string, direction: 'up' | 'down') => void;
  /** Move a tab to another group (or ungroup it if targetGroupId is null) */
  moveTabToGroup: (tabId: string, targetGroupId: string | null) => void;
  /** Remove a group, either deleting or ungrouping its tabs */
  removeGroup: (groupId: string, action: 'delete_tabs' | 'ungroup_tabs') => void;
  /** Update a group's title and/or color */
  updateGroup: (groupId: string, updates: { title?: string; color?: ChromeGroupColor }) => void;
  /** Move a group up or down in the list */
  moveGroup: (groupId: string, direction: 'up' | 'down') => void;
  /** Reset the edited session to the original (discard all changes) */
  reset: () => void;
}

export function useSessionEditor(initialSession: Session): UseSessionEditorReturn {
  const [editedSession, setEditedSession] = useState<Session>(() =>
    structuredClone(initialSession)
  );

  const isDirty = useMemo(() => {
    return JSON.stringify(editedSession) !== JSON.stringify(initialSession);
  }, [editedSession, initialSession]);

  // updatedAt is intentionally NOT touched here — the save path (SessionEditDialog
  // + sessionStorage.updateSession) is responsible for stamping the new timestamp.
  // Bumping it on every edit would falsely flag isDirty=true on pure no-ops.

  function updateSessionName(name: string) {
    setEditedSession((prev) => ({ ...prev, name }));
  }

  function updateSessionNote(note: string) {
    setEditedSession((prev) => ({ ...prev, note: note || undefined }));
  }

  function applySessionUpdate(updatedSession: Session) {
    setEditedSession(updatedSession);
  }

  function removeTab(tabId: string) {
    setEditedSession((prev) => {
      const inUngrouped = prev.ungroupedTabs.some((t) => t.id === tabId);
      const inGroup = prev.groups.some((g) => g.tabs.some((t) => t.id === tabId));
      if (!inUngrouped && !inGroup) return prev;
      return {
        ...prev,
        ungroupedTabs: prev.ungroupedTabs.filter((t) => t.id !== tabId),
        groups: prev.groups.map((g) => ({ ...g, tabs: g.tabs.filter((t) => t.id !== tabId) })),
      };
    });
  }

  function updateTabUrl(tabId: string, url: string) {
    setEditedSession((prev) => ({
      ...prev,
      ungroupedTabs: prev.ungroupedTabs.map((t) => (t.id === tabId ? { ...t, url } : t)),
      groups: prev.groups.map((g) => ({
        ...g,
        tabs: g.tabs.map((t) => (t.id === tabId ? { ...t, url } : t)),
      })),
    }));
  }

  function moveTab(tabId: string, direction: 'up' | 'down') {
    setEditedSession((prev) => {
      const next = moveTabInGroup(prev, tabId, direction);
      return next === prev ? prev : next;
    });
  }

  function moveTabToGroup(tabId: string, targetGroupId: string | null) {
    setEditedSession((prev) => {
      const next = reassignTabToGroup(prev, tabId, undefined, targetGroupId);
      return next === prev ? prev : next;
    });
  }

  function removeGroup(groupId: string, action: 'delete_tabs' | 'ungroup_tabs') {
    setEditedSession((prev) => {
      const group = prev.groups.find((g) => g.id === groupId);
      if (!group) return prev;
      const newUngrouped =
        action === 'ungroup_tabs'
          ? [...prev.ungroupedTabs, ...group.tabs]
          : prev.ungroupedTabs;
      return {
        ...prev,
        ungroupedTabs: newUngrouped,
        groups: prev.groups.filter((g) => g.id !== groupId),
      };
    });
  }

  function updateGroup(groupId: string, updates: { title?: string; color?: ChromeGroupColor }) {
    setEditedSession((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
    }));
  }

  function moveGroup(groupId: string, direction: 'up' | 'down') {
    setEditedSession((prev) => {
      const groups = [...prev.groups];
      const idx = groups.findIndex((g) => g.id === groupId);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= groups.length) return prev;
      [groups[idx], groups[newIdx]] = [groups[newIdx], groups[idx]];
      return { ...prev, groups };
    });
  }

  function reset() {
    setEditedSession(structuredClone(initialSession));
  }

  return {
    editedSession,
    isDirty,
    updateSessionName,
    updateSessionNote,
    applySessionUpdate,
    removeTab,
    updateTabUrl,
    moveTab,
    moveTabToGroup,
    removeGroup,
    updateGroup,
    moveGroup,
    reset,
  };
}
