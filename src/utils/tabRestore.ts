import { browser } from 'wxt/browser';
import type { SavedTab, SavedTabGroup } from '../types/session';
import type { ConflictAnalysis, ConflictResolution, GroupConflictAction } from './conflictDetection';

export interface RestoreOptions {
  /** Ungrouped tabs to restore */
  tabs: SavedTab[];
  /** Groups to restore with their tabs */
  groups: SavedTabGroup[];
  /** Restore target */
  target: 'current' | 'new';
  /** Conflict resolution (only used when target === 'current') */
  conflictResolution?: ConflictResolution;
  /** Conflict analysis (only used when target === 'current') */
  conflictAnalysis?: ConflictAnalysis;
}

export interface RestoreResult {
  tabsCreated: number;
  duplicatesSkipped: number;
  groupsCreated: number;
  groupsMerged: number;
  errors: string[];
  /** ID of the newly created window when target === 'new' */
  windowId?: number;
}

/** Restore tabs and groups in Chrome */
export async function restoreTabs(options: RestoreOptions): Promise<RestoreResult> {
  const { tabs, groups, target, conflictResolution, conflictAnalysis } = options;
  const result: RestoreResult = {
    tabsCreated: 0,
    duplicatesSkipped: 0,
    groupsCreated: 0,
    groupsMerged: 0,
    errors: [],
  };

  if (target === 'new') {
    return restoreInNewWindow(tabs, groups, result);
  }

  return restoreInCurrentWindow(tabs, groups, conflictResolution, conflictAnalysis, result);
}

async function restoreInNewWindow(
  tabs: SavedTab[],
  groups: SavedTabGroup[],
  result: RestoreResult,
): Promise<RestoreResult> {
  // Create a new window with the first tab (or a blank one)
  const firstUrl = tabs[0]?.url || groups[0]?.tabs[0]?.url;
  const newWindow = await browser.windows.create({ url: firstUrl || undefined });
  const windowId = newWindow.id;
  if (!windowId) {
    result.errors.push('Failed to create new window');
    return result;
  }
  result.windowId = windowId;

  // Track the first tab created by windows.create (to avoid duplicating it)
  const firstTabId = newWindow.tabs?.[0]?.id;
  let firstWindowTabConsumed = false;
  if (firstUrl) result.tabsCreated++;

  // Create remaining ungrouped tabs (skip the first one already created)
  const startIndex = firstUrl && tabs.length > 0 && tabs[0].url === firstUrl ? 1 : 0;
  for (let i = startIndex; i < tabs.length; i++) {
    try {
      await browser.tabs.create({ url: tabs[i].url, windowId });
      result.tabsCreated++;
    } catch (e) {
      result.errors.push(`Failed to create tab: ${tabs[i].url}`);
    }
  }

  // Create groups
  for (const group of groups) {
    const tabIds: number[] = [];
    for (const tab of group.tabs) {
      // Reuse the tab already created by windows.create instead of creating a duplicate.
      // Without this, when firstUrl comes from a group tab, that URL would be created
      // twice in the same window, triggering deduplication on the still-loading tab.
      if (!firstWindowTabConsumed && firstTabId != null && tab.url === firstUrl) {
        tabIds.push(firstTabId);
        firstWindowTabConsumed = true;
        continue;
      }
      try {
        const created = await browser.tabs.create({ url: tab.url, windowId });
        if (created.id != null) tabIds.push(created.id);
        result.tabsCreated++;
      } catch (e) {
        result.errors.push(`Failed to create tab: ${tab.url}`);
      }
    }
    if (tabIds.length > 0) {
      try {
        const groupId = await (browser.tabs as any).group({ tabIds, createProperties: { windowId } });
        await (browser.tabGroups as any).update(groupId, { title: group.title, color: group.color });
        result.groupsCreated++;
      } catch (e) {
        result.errors.push(`Failed to create group: ${group.title}`);
      }
    }
  }

  // Close the default empty tab if we created other tabs
  if (firstTabId && !firstUrl && result.tabsCreated > 0) {
    try {
      await browser.tabs.remove(firstTabId);
    } catch {
      // Ignore — tab may have been reused
    }
  }

  return result;
}

async function restoreInCurrentWindow(
  tabs: SavedTab[],
  groups: SavedTabGroup[],
  conflictResolution: ConflictResolution | undefined,
  conflictAnalysis: ConflictAnalysis | undefined,
  result: RestoreResult,
): Promise<RestoreResult> {
  const dupAction = conflictResolution?.duplicateTabAction ?? 'skip';
  const duplicateUrls = new Set(
    (conflictAnalysis?.duplicateTabs ?? []).map(d => d.savedTab.url),
  );

  // Restore ungrouped tabs
  for (const tab of tabs) {
    if (dupAction === 'skip' && duplicateUrls.has(tab.url)) {
      result.duplicatesSkipped++;
      continue;
    }
    try {
      await browser.tabs.create({ url: tab.url });
      result.tabsCreated++;
    } catch (e) {
      result.errors.push(`Failed to create tab: ${tab.url}`);
    }
  }

  // Restore groups
  for (const group of groups) {
    const groupAction: GroupConflictAction =
      conflictResolution?.groupActions.get(group.id) ?? 'create_new';

    if (groupAction === 'skip') {
      result.duplicatesSkipped += group.tabs.length;
      continue;
    }

    // Find existing group for merge
    const existingConflict = conflictAnalysis?.conflictingGroups.find(
      c => c.savedGroup.id === group.id,
    );

    // Filter tabs based on duplicate action (global duplicate check)
    let tabsToCreate =
      dupAction === 'skip'
        ? group.tabs.filter(t => !duplicateUrls.has(t.url))
        : group.tabs;

    result.duplicatesSkipped += group.tabs.length - tabsToCreate.length;

    // For merge: also filter out tabs already present in the target group
    // This must happen BEFORE creating tabs to avoid race conditions with
    // the background deduplication system that would remove them immediately
    if (groupAction === 'merge' && existingConflict) {
      try {
        const existingGroupTabs = await browser.tabs.query({
          groupId: existingConflict.existingGroupId,
        } as any);
        const existingGroupUrls = new Set(
          existingGroupTabs.map(t => t.url).filter(Boolean) as string[],
        );
        const beforeCount = tabsToCreate.length;
        tabsToCreate = tabsToCreate.filter(t => !existingGroupUrls.has(t.url));
        result.duplicatesSkipped += beforeCount - tabsToCreate.length;
      } catch {
        // If we can't query existing group tabs, proceed with all tabs
      }
    }

    if (tabsToCreate.length === 0) {
      if (groupAction === 'merge' && existingConflict) result.groupsMerged++;
      continue;
    }

    // Create the tabs
    const newTabIds: number[] = [];
    for (const tab of tabsToCreate) {
      try {
        const created = await browser.tabs.create({ url: tab.url });
        if (created.id != null) newTabIds.push(created.id);
        result.tabsCreated++;
      } catch (e) {
        result.errors.push(`Failed to create tab: ${tab.url}`);
      }
    }

    if (newTabIds.length === 0) continue;

    if (groupAction === 'merge' && existingConflict) {
      try {
        await (browser.tabs as any).group({
          tabIds: newTabIds,
          groupId: existingConflict.existingGroupId,
        });
        result.groupsMerged++;
      } catch (e) {
        result.errors.push(`Failed to merge into group: ${group.title}`);
      }
    } else {
      // Create new group
      try {
        const groupId = await (browser.tabs as any).group({ tabIds: newTabIds });
        await (browser.tabGroups as any).update(groupId, {
          title: group.title,
          color: group.color,
        });
        result.groupsCreated++;
      } catch (e) {
        result.errors.push(`Failed to create group: ${group.title}`);
      }
    }
  }

  return result;
}
