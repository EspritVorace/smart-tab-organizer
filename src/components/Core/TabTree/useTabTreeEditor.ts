import { useState, useEffect, useCallback, useRef } from 'react';
import { getMessage } from '../../../utils/i18n';
import type { Session, SavedTab, SavedTabGroup } from '../../../types/session';
import type { ChromeGroupColor } from './tabTreeTypes';

export type AlertDialogState =
  | { type: 'delete_last_tab'; tabId: string; groupId: string }
  | { type: 'delete_group'; groupId: string; groupTitle: string; tabCount: number }
  | null;

export function useTabTreeEditor(session: Session, onSessionChange: (updated: Session) => void) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(session.groups.filter((g) => !g.collapsed).map((g) => g.id))
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupColor, setEditGroupColor] = useState<ChromeGroupColor>('grey');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>(null);

  // Track known group IDs so we only auto-expand genuinely new groups,
  // not groups that were intentionally initialized as collapsed.
  const knownGroupIds = useRef<Set<string>>(new Set(session.groups.map((g) => g.id)));

  // Auto-expand newly added groups (not groups collapsed at init)
  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const group of session.groups) {
        if (!knownGroupIds.current.has(group.id)) {
          next.add(group.id);
          changed = true;
        }
      }
      knownGroupIds.current = new Set(session.groups.map((g) => g.id));
      return changed ? next : prev;
    });
  }, [session.groups]);

  const now = () => new Date().toISOString();

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      const wasExpanded = next.has(groupId);
      if (wasExpanded) next.delete(groupId);
      else next.add(groupId);

      onSessionChange({
        ...session,
        groups: session.groups.map((g) =>
          g.id === groupId ? { ...g, collapsed: wasExpanded } : g
        ),
        updatedAt: new Date().toISOString(),
      });

      return next;
    });
  }, [session, onSessionChange]);

  function openTabEdit(tab: SavedTab) {
    setEditingItemId(tab.id);
    setEditUrl(tab.url);
    setUrlError(null);
  }

  function openGroupEdit(group: SavedTabGroup) {
    setEditingItemId(group.id);
    setEditGroupName(group.title);
    setEditGroupColor(group.color);
  }

  function cancelEdit() {
    setEditingItemId(null);
    setUrlError(null);
  }

  function saveTabEdit(tabId: string) {
    let url = editUrl.trim();
    if (url && !/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)) {
      url = 'https://' + url;
    }
    try {
      new URL(url);
    } catch {
      setUrlError(getMessage('tabEditorUrlInvalid'));
      return;
    }
    onSessionChange({
      ...session,
      ungroupedTabs: session.ungroupedTabs.map((t) => (t.id === tabId ? { ...t, url } : t)),
      groups: session.groups.map((g) => ({
        ...g,
        tabs: g.tabs.map((t) => (t.id === tabId ? { ...t, url } : t)),
      })),
      updatedAt: now(),
    });
    setEditingItemId(null);
    setUrlError(null);
  }

  function saveGroupEdit(groupId: string) {
    onSessionChange({
      ...session,
      groups: session.groups.map((g) =>
        g.id === groupId ? { ...g, title: editGroupName, color: editGroupColor } : g
      ),
      updatedAt: now(),
    });
    setEditingItemId(null);
  }

  function moveTabInContext(tabId: string, direction: 'up' | 'down', contextGroupId: string | null) {
    if (contextGroupId === null) {
      const tabs = [...session.ungroupedTabs];
      const idx = tabs.findIndex((t) => t.id === tabId);
      if (idx === -1) return;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= tabs.length) return;
      [tabs[idx], tabs[newIdx]] = [tabs[newIdx], tabs[idx]];
      onSessionChange({ ...session, ungroupedTabs: tabs, updatedAt: now() });
    } else {
      const groups = session.groups.map((g) => {
        if (g.id !== contextGroupId) return g;
        const tabs = [...g.tabs];
        const idx = tabs.findIndex((t) => t.id === tabId);
        if (idx === -1) return g;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= tabs.length) return g;
        [tabs[idx], tabs[newIdx]] = [tabs[newIdx], tabs[idx]];
        return { ...g, tabs };
      });
      onSessionChange({ ...session, groups, updatedAt: now() });
    }
  }

  function moveGroupInList(groupId: string, direction: 'up' | 'down') {
    const groups = [...session.groups];
    const idx = groups.findIndex((g) => g.id === groupId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= groups.length) return;
    [groups[idx], groups[newIdx]] = [groups[newIdx], groups[idx]];
    onSessionChange({ ...session, groups, updatedAt: now() });
  }

  function moveTabToGroup(tabId: string, sourceGroupId: string | null, targetGroupId: string | null) {
    let tab: SavedTab | undefined;
    let newUngrouped = session.ungroupedTabs;
    let newGroups = session.groups;

    if (sourceGroupId === null) {
      tab = session.ungroupedTabs.find((t) => t.id === tabId);
      newUngrouped = session.ungroupedTabs.filter((t) => t.id !== tabId);
    } else {
      const group = session.groups.find((g) => g.id === sourceGroupId);
      tab = group?.tabs.find((t) => t.id === tabId);
      newGroups = session.groups.map((g) =>
        g.id === sourceGroupId ? { ...g, tabs: g.tabs.filter((t) => t.id !== tabId) } : g
      );
    }

    if (!tab) return;

    if (targetGroupId === null) {
      newUngrouped = [...newUngrouped, tab];
    } else {
      newGroups = newGroups.map((g) =>
        g.id === targetGroupId ? { ...g, tabs: [...g.tabs, tab!] } : g
      );
    }

    onSessionChange({ ...session, ungroupedTabs: newUngrouped, groups: newGroups, updatedAt: now() });
  }

  function handleDeleteTab(tabId: string, sourceGroupId: string | null) {
    if (sourceGroupId !== null) {
      const group = session.groups.find((g) => g.id === sourceGroupId);
      if (group && group.tabs.length === 1) {
        setAlertDialog({ type: 'delete_last_tab', tabId, groupId: sourceGroupId });
        return;
      }
    }
    performDeleteTab(tabId, sourceGroupId, false);
  }

  function performDeleteTab(tabId: string, sourceGroupId: string | null, deleteEmptyGroup: boolean) {
    const newUngrouped = session.ungroupedTabs.filter((t) => t.id !== tabId);
    let newGroups = session.groups.map((g) => ({
      ...g,
      tabs: g.tabs.filter((t) => t.id !== tabId),
    }));
    if (deleteEmptyGroup && sourceGroupId) {
      newGroups = newGroups.filter((g) => g.id !== sourceGroupId);
    }
    onSessionChange({ ...session, ungroupedTabs: newUngrouped, groups: newGroups, updatedAt: now() });
    setAlertDialog(null);
  }

  function handleDeleteGroup(groupId: string, action: 'delete_tabs' | 'ungroup_tabs') {
    const group = session.groups.find((g) => g.id === groupId);
    if (!group) return;
    const newUngrouped =
      action === 'ungroup_tabs'
        ? [...session.ungroupedTabs, ...group.tabs]
        : session.ungroupedTabs;
    const newGroups = session.groups.filter((g) => g.id !== groupId);
    onSessionChange({ ...session, ungroupedTabs: newUngrouped, groups: newGroups, updatedAt: now() });
    setAlertDialog(null);
  }

  return {
    expandedGroups,
    editingItemId,
    editUrl,
    setEditUrl,
    editGroupName,
    setEditGroupName,
    editGroupColor,
    setEditGroupColor,
    urlError,
    setUrlError,
    alertDialog,
    setAlertDialog,
    toggleGroup,
    openTabEdit,
    openGroupEdit,
    cancelEdit,
    saveTabEdit,
    saveGroupEdit,
    moveTabInContext,
    moveGroupInList,
    moveTabToGroup,
    handleDeleteTab,
    performDeleteTab,
    handleDeleteGroup,
  };
}
