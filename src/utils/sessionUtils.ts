import type { Session, SavedTab, SavedTabGroup, ProfileIcon } from '../types/session';
import type { TabTreeData, TabItem, TabGroupItem } from '../components/Core/TabTree/tabTreeTypes';
import { generateUUID } from './utils';

/**
 * Convert a Session to TabTreeData for display in the TabTree component.
 * Generates sequential numeric IDs required by TabTree.
 * Returns a map from numeric ID back to the SavedTab UUID.
 */
export function sessionToTabTreeData(session: Session): {
  treeData: TabTreeData;
  numericIdToSavedTabId: Map<number, string>;
} {
  let counter = 1;
  const numericIdToSavedTabId = new Map<number, string>();

  const ungroupedTabs: TabItem[] = session.ungroupedTabs.map(tab => {
    const numId = counter++;
    numericIdToSavedTabId.set(numId, tab.id);
    return { id: numId, title: tab.title, url: tab.url, favIconUrl: tab.favIconUrl };
  });

  const groups: TabGroupItem[] = session.groups.map(group => {
    const groupNumId = counter++;
    const tabs: TabItem[] = group.tabs.map(tab => {
      const numId = counter++;
      numericIdToSavedTabId.set(numId, tab.id);
      return { id: numId, title: tab.title, url: tab.url, favIconUrl: tab.favIconUrl };
    });
    return { id: groupNumId, title: group.title, color: group.color, tabs };
  });

  return { treeData: { ungroupedTabs, groups }, numericIdToSavedTabId };
}

/** Format an ISO date string to a localized readable string */
export function formatSessionDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

/** Count total tabs in a session (ungrouped + all groups) */
export function countSessionTabs(session: Pick<Session, 'ungroupedTabs' | 'groups'>): number {
  return (
    session.ungroupedTabs.length +
    session.groups.reduce((sum, g) => sum + g.tabs.length, 0)
  );
}

/** Create a Session object from TabTreeData and selected tab IDs */
export function createSessionFromSelection(
  ungroupedTabs: SavedTab[],
  groups: SavedTabGroup[],
  selectedSavedTabIds: Set<string>,
  sessionName: string,
  options?: { isPinned?: boolean; icon?: ProfileIcon },
): Session {
  const now = new Date().toISOString();

  const filteredUngrouped = ungroupedTabs.filter(t => selectedSavedTabIds.has(t.id));
  const filteredGroups = groups
    .map(g => ({ ...g, tabs: g.tabs.filter(t => selectedSavedTabIds.has(t.id)) }))
    .filter(g => g.tabs.length > 0);

  return {
    id: generateUUID(),
    name: sessionName,
    createdAt: now,
    updatedAt: now,
    groups: filteredGroups,
    ungroupedTabs: filteredUngrouped,
    isPinned: options?.isPinned ?? false,
    icon: options?.icon,
  };
}
