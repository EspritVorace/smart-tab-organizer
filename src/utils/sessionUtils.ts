import type { Session, SavedTab, SavedTabGroup } from '../types/session';
import type { TabTreeData, TabItem, TabGroupItem } from '../components/Core/TabTree/tabTreeTypes';
import { generateUUID } from './utils';
import { foldAccents } from './stringUtils';

/**
 * Result of matching a session against a search term.
 * Used to determine which sessions to show and how to render them.
 */
export interface SessionSearchMatch {
  /** Whether the session name matches the search term */
  matchesName: boolean;
  /** Whether any tab title, tab URL, or group title matches */
  matchesTabs: boolean;
  /** IDs of groups that have at least one matching tab or a matching group title */
  matchingGroupIds: Set<string>;
  /** Whether the session note matches the search term */
  matchesNote: boolean;
}

/**
 * Test whether a session matches a pre-folded (accent/case-normalized) search term.
 * Returns null if there is no match at all.
 *
 * The search covers:
 *  - session name
 *  - each group title
 *  - each tab title (grouped and ungrouped)
 *  - each tab URL  (grouped and ungrouped)
 */
export function matchSessionSearch(
  session: Session,
  foldedTerm: string,
): SessionSearchMatch | null {
  const matchesName = foldAccents(session.name).includes(foldedTerm);

  const matchingGroupIds = new Set<string>();

  // Ungrouped tabs
  const hasUngroupedMatch = session.ungroupedTabs.some(
    tab =>
      foldAccents(tab.title).includes(foldedTerm) ||
      foldAccents(tab.url).includes(foldedTerm),
  );

  // Groups: check group title and each tab
  for (const group of session.groups) {
    const groupTitleMatches = foldAccents(group.title).includes(foldedTerm);
    const tabMatches = group.tabs.some(
      tab =>
        foldAccents(tab.title).includes(foldedTerm) ||
        foldAccents(tab.url).includes(foldedTerm),
    );
    if (groupTitleMatches || tabMatches) {
      matchingGroupIds.add(group.id);
    }
  }

  const matchesTabs = hasUngroupedMatch || matchingGroupIds.size > 0;
  const matchesNote = session.note ? foldAccents(session.note).includes(foldedTerm) : false;

  if (!matchesName && !matchesTabs && !matchesNote) return null;

  return { matchesName, matchesTabs, matchingGroupIds, matchesNote };
}

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
  options?: { isPinned?: boolean; categoryId?: string | null; note?: string },
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
    categoryId: options?.categoryId ?? null,
    note: options?.note,
  };
}
