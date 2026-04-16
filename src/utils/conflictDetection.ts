import { browser } from 'wxt/browser';
import type { SavedTab, SavedTabGroup } from '@/types/session';

/** A tab that already exists in the current window */
export interface TabConflict {
  savedTab: SavedTab;
  existingTabUrl: string;
}

/** A group that matches an existing group by title + color */
export interface GroupConflict {
  savedGroup: SavedTabGroup;
  existingGroupId: number;
  existingGroupTitle: string;
}

/** Result of conflict analysis */
export interface ConflictAnalysis {
  /** Tabs whose URL exactly matches an already-open tab */
  duplicateTabs: TabConflict[];
  /** Tabs with no duplicate in the current window */
  newTabs: SavedTab[];
  /** Groups whose title+color match an existing group */
  conflictingGroups: GroupConflict[];
  /** Groups with no match */
  newGroups: SavedTabGroup[];
}

/** Decision for duplicate tabs — global */
export type DuplicateTabAction = 'skip' | 'open_anyway';

/** Decision for a conflicting group — per group */
export type GroupConflictAction = 'merge' | 'create_new' | 'skip';

/** All conflict resolution decisions */
export interface ConflictResolution {
  duplicateTabAction: DuplicateTabAction;
  groupActions: Map<string, GroupConflictAction>;
}

/**
 * Analyze conflicts between the tabs/groups to restore
 * and what's currently open in the browser window.
 */
export async function analyzeConflicts(
  selectedTabs: SavedTab[],
  selectedGroups: SavedTabGroup[],
): Promise<ConflictAnalysis> {
  const openTabs = await browser.tabs.query({ currentWindow: true });
  const openUrls = new Set(openTabs.map(t => t.url).filter(Boolean) as string[]);

  // Analyze tab duplicates
  const duplicateTabs: TabConflict[] = [];
  const newTabs: SavedTab[] = [];
  for (const tab of selectedTabs) {
    if (openUrls.has(tab.url)) {
      duplicateTabs.push({ savedTab: tab, existingTabUrl: tab.url });
    } else {
      newTabs.push(tab);
    }
  }

  // Analyze group conflicts: match on title (case-insensitive) + color
  let openGroups: Array<{ id: number; title: string; color: string }> = [];
  try {
    const currentWindow = await browser.windows.getCurrent();
    if (currentWindow.id != null) {
      openGroups = await (browser.tabGroups as any).query({ windowId: currentWindow.id });
    }
  } catch {
    // tabGroups API may not be available
  }

  const conflictingGroups: GroupConflict[] = [];
  const newGroups: SavedTabGroup[] = [];
  for (const group of selectedGroups) {
    const match = openGroups.find(
      og => og.title.toLowerCase() === group.title.toLowerCase() && og.color === group.color,
    );
    if (match) {
      conflictingGroups.push({
        savedGroup: group,
        existingGroupId: match.id,
        existingGroupTitle: match.title,
      });
    } else {
      newGroups.push(group);
    }
  }

  return { duplicateTabs, newTabs, conflictingGroups, newGroups };
}
