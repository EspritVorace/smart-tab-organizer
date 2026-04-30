import { browser } from 'wxt/browser';
import { logger } from '@/utils/logger';
import type { SavedTab, SavedTabGroup, Session } from '@/types/session';
import type {
  ConflictAnalysis,
  ConflictResolution,
  DuplicateTabAction,
  GroupConflictAction,
} from './conflictDetection';

export type RestoreTarget = 'current' | 'new' | 'replace';

export interface RestoreOptions {
  /** Ungrouped tabs to restore */
  tabs: SavedTab[];
  /** Groups to restore with their tabs */
  groups: SavedTabGroup[];
  /** Restore target */
  target: RestoreTarget;
  /** Conflict resolution (only used when target === 'current') */
  conflictResolution?: ConflictResolution;
  /** Conflict analysis (only used when target === 'current') */
  conflictAnalysis?: ConflictAnalysis;
  /**
   * Tab to preserve when target === 'replace'. Used when the action is
   * triggered from the options page so the host tab doesn't get closed.
   * Pinned tabs are always preserved regardless of this value.
   */
  protectedTabId?: number;
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

/**
 * Quick restore of a whole session (no conflict resolution wizard, no filtering).
 * Thin wrapper around {@link restoreTabs} that maps a Session to RestoreOptions.
 * Shared by SessionsPage quick actions and PopupProfilesList.
 * The RestoreWizard uses {@link restoreTabs} directly because it needs to pass
 * a filtered subset of tabs/groups plus conflict resolution data.
 */
export async function restoreSessionTabs(
  session: Pick<Session, 'ungroupedTabs' | 'groups'>,
  target: RestoreTarget,
  protectedTabId?: number,
): Promise<RestoreResult> {
  return restoreTabs({
    tabs: session.ungroupedTabs,
    groups: session.groups,
    target,
    protectedTabId,
  });
}

/**
 * Tell the background script to skip automatic deduplication for the URLs
 * we are about to restore. Without this, pinned tabs or other kept tabs
 * whose URL matches a session tab would cause the freshly created tab to
 * be closed by the background dedup handler.
 */
async function requestSkipDeduplication(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  try {
    await browser.runtime.sendMessage({
      type: 'SESSION_RESTORE_SKIP_DEDUP',
      urls,
    });
  } catch {
    // Non-blocking: if the background is unreachable, restore proceeds anyway.
  }
}

/** Restore tabs and groups in Chrome */
export async function restoreTabs(options: RestoreOptions): Promise<RestoreResult> {
  const { tabs, groups, target, conflictResolution, conflictAnalysis, protectedTabId } = options;
  const result: RestoreResult = {
    tabsCreated: 0,
    duplicatesSkipped: 0,
    groupsCreated: 0,
    groupsMerged: 0,
    errors: [],
  };

  const allUrls = [
    ...tabs.map(t => t.url),
    ...groups.flatMap(g => g.tabs.map(t => t.url)),
  ];
  await requestSkipDeduplication(allUrls);

  if (target === 'new') {
    await restoreInNewWindow(tabs, groups, result);
  } else if (target === 'replace') {
    await restoreReplaceInCurrentWindow(tabs, groups, protectedTabId, result);
  } else {
    await restoreInCurrentWindow(tabs, groups, conflictResolution, conflictAnalysis, result);
  }

  return result;
}

/** Mutable seed context shared with createGroupInWindow so the first window
 *  tab created by `windows.create` can be reused by the matching group tab. */
interface SeedContext {
  firstTabId: number | undefined;
  firstUrl: string | undefined;
  firstWindowTabConsumed: boolean;
}

async function seedNewWindow(
  firstUrl: string | undefined,
  result: RestoreResult,
): Promise<{ windowId: number; firstTabId: number | undefined } | null> {
  const newWindow = await browser.windows.create({ url: firstUrl || undefined });
  const windowId = newWindow.id;
  if (!windowId) {
    result.errors.push('Failed to create new window');
    return null;
  }
  result.windowId = windowId;
  if (firstUrl) result.tabsCreated++;
  return { windowId, firstTabId: newWindow.tabs?.[0]?.id };
}

async function createUngroupedTabsInWindow(
  tabs: SavedTab[],
  windowId: number,
  startIndex: number,
  result: RestoreResult,
): Promise<void> {
  for (let i = startIndex; i < tabs.length; i++) {
    try {
      await browser.tabs.create({ url: tabs[i].url, windowId });
      result.tabsCreated++;
    } catch (e) {
      logger.debug('[TAB_RESTORE] Failed to create tab:', e);
      result.errors.push(`Failed to create tab: ${tabs[i].url}`);
    }
  }
}

async function createGroupInWindow(
  group: SavedTabGroup,
  windowId: number,
  seed: SeedContext,
  result: RestoreResult,
): Promise<void> {
  const tabIds: number[] = [];
  for (const tab of group.tabs) {
    // Reuse the tab already created by windows.create instead of creating a duplicate.
    // Without this, when firstUrl comes from a group tab, that URL would be created
    // twice in the same window, triggering deduplication on the still-loading tab.
    if (!seed.firstWindowTabConsumed && seed.firstTabId != null && tab.url === seed.firstUrl) {
      tabIds.push(seed.firstTabId);
      seed.firstWindowTabConsumed = true;
      continue;
    }
    try {
      const created = await browser.tabs.create({ url: tab.url, windowId });
      if (created.id != null) tabIds.push(created.id);
      result.tabsCreated++;
    } catch (e) {
      logger.debug('[TAB_RESTORE] Failed to create tab:', e);
      result.errors.push(`Failed to create tab: ${tab.url}`);
    }
  }
  if (tabIds.length === 0) return;
  try {
    const groupId = (await browser.tabs.group({
      tabIds: tabIds as [number, ...number[]],
      createProperties: { windowId },
    })) as unknown as number;
    await browser.tabGroups.update(groupId, {
      title: group.title,
      color: group.color,
      collapsed: group.collapsed ?? false,
    });
    result.groupsCreated++;
  } catch (e) {
    logger.debug('[TAB_RESTORE] Failed to create group:', e);
    result.errors.push(`Failed to create group: ${group.title}`);
  }
}

async function cleanupDefaultEmptyTab(
  firstTabId: number | undefined,
  firstUrl: string | undefined,
  tabsCreated: number,
): Promise<void> {
  if (!firstTabId || firstUrl || tabsCreated === 0) return;
  try {
    await browser.tabs.remove(firstTabId);
  } catch {
    // Ignore — tab may have been reused
  }
}

async function restoreInNewWindow(
  tabs: SavedTab[],
  groups: SavedTabGroup[],
  result: RestoreResult,
): Promise<void> {
  const firstUrl = tabs[0]?.url || groups[0]?.tabs[0]?.url;
  const seed = await seedNewWindow(firstUrl, result);
  if (!seed) return;
  const { windowId, firstTabId } = seed;

  const startIndex = firstUrl && tabs.length > 0 && tabs[0].url === firstUrl ? 1 : 0;
  await createUngroupedTabsInWindow(tabs, windowId, startIndex, result);

  const seedCtx: SeedContext = { firstTabId, firstUrl, firstWindowTabConsumed: false };
  for (const group of groups) {
    await createGroupInWindow(group, windowId, seedCtx, result);
  }

  await cleanupDefaultEmptyTab(firstTabId, firstUrl, result.tabsCreated);
}

async function restoreReplaceInCurrentWindow(
  tabs: SavedTab[],
  groups: SavedTabGroup[],
  protectedTabId: number | undefined,
  result: RestoreResult,
): Promise<void> {
  // Snapshot tabs to close before creating new ones. Keep pinned tabs and
  // the optional protectedTabId (the options page tab hosting the action).
  const existingTabs = await browser.tabs.query({ currentWindow: true });
  const tabIdsToClose = existingTabs
    .filter(t => t.id != null && !t.pinned && t.id !== protectedTabId)
    .map(t => t.id as number);

  // Create new tabs first (no conflict resolution: kept tabs are pinned or
  // the options page, neither participates in group merging).
  await restoreInCurrentWindow(tabs, groups, undefined, undefined, result);

  // Close the previous tabs afterwards so the window never becomes empty.
  if (tabIdsToClose.length === 0) return;
  try {
    await browser.tabs.remove(tabIdsToClose);
  } catch (e) {
    result.errors.push(`Failed to close existing tabs: ${String(e)}`);
  }
}

async function restoreUngroupedTabsToCurrentWindow(
  tabs: SavedTab[],
  dupAction: DuplicateTabAction,
  duplicateUrls: ReadonlySet<string>,
  result: RestoreResult,
): Promise<void> {
  for (const tab of tabs) {
    if (dupAction === 'skip' && duplicateUrls.has(tab.url)) {
      result.duplicatesSkipped++;
      continue;
    }
    try {
      await browser.tabs.create({ url: tab.url });
      result.tabsCreated++;
    } catch (e) {
      logger.debug('[TAB_RESTORE] Failed to create tab:', e);
      result.errors.push(`Failed to create tab: ${tab.url}`);
    }
  }
}

async function createTabsForGroup(
  tabsToCreate: SavedTab[],
  result: RestoreResult,
): Promise<number[]> {
  const newTabIds: number[] = [];
  for (const tab of tabsToCreate) {
    try {
      const created = await browser.tabs.create({ url: tab.url });
      if (created.id != null) newTabIds.push(created.id);
      result.tabsCreated++;
    } catch (e) {
      logger.debug('[TAB_RESTORE] Failed to create tab:', e);
      result.errors.push(`Failed to create tab: ${tab.url}`);
    }
  }
  return newTabIds;
}

async function mergeIntoExistingGroup(
  group: SavedTabGroup,
  existingGroupId: number,
  dupAction: DuplicateTabAction,
  duplicateUrls: ReadonlySet<string>,
  result: RestoreResult,
): Promise<void> {
  let tabsToCreate =
    dupAction === 'skip' ? group.tabs.filter(t => !duplicateUrls.has(t.url)) : group.tabs;
  result.duplicatesSkipped += group.tabs.length - tabsToCreate.length;

  // Filter out tabs already present in the target group.
  // This must happen BEFORE creating tabs to avoid race conditions with
  // the background deduplication system that would remove them immediately.
  try {
    const existingGroupTabs = await browser.tabs.query({
      groupId: existingGroupId,
    } as unknown as Parameters<typeof browser.tabs.query>[0]);
    const existingGroupUrls = new Set(
      existingGroupTabs.map(t => t.url).filter(Boolean) as string[],
    );
    const beforeCount = tabsToCreate.length;
    tabsToCreate = tabsToCreate.filter(t => !existingGroupUrls.has(t.url));
    result.duplicatesSkipped += beforeCount - tabsToCreate.length;
  } catch {
    // If we can't query existing group tabs, proceed with all tabs
  }

  if (tabsToCreate.length === 0) {
    result.groupsMerged++;
    return;
  }

  const newTabIds = await createTabsForGroup(tabsToCreate, result);
  if (newTabIds.length === 0) return;

  try {
    await browser.tabs.group({
      tabIds: newTabIds as [number, ...number[]],
      groupId: existingGroupId,
    });
    result.groupsMerged++;
  } catch (e) {
    logger.debug('[TAB_RESTORE] Failed to merge into group:', e);
    result.errors.push(`Failed to merge into group: ${group.title}`);
  }
}

async function createNewGroupInCurrentWindow(
  group: SavedTabGroup,
  dupAction: DuplicateTabAction,
  duplicateUrls: ReadonlySet<string>,
  result: RestoreResult,
): Promise<void> {
  const tabsToCreate =
    dupAction === 'skip' ? group.tabs.filter(t => !duplicateUrls.has(t.url)) : group.tabs;
  result.duplicatesSkipped += group.tabs.length - tabsToCreate.length;

  if (tabsToCreate.length === 0) return;

  const newTabIds = await createTabsForGroup(tabsToCreate, result);
  if (newTabIds.length === 0) return;

  try {
    const groupId = (await browser.tabs.group({
      tabIds: newTabIds as [number, ...number[]],
    })) as unknown as number;
    await browser.tabGroups.update(groupId, {
      title: group.title,
      color: group.color,
      collapsed: group.collapsed ?? false,
    });
    result.groupsCreated++;
  } catch (e) {
    logger.debug('[TAB_RESTORE] Failed to create group:', e);
    result.errors.push(`Failed to create group: ${group.title}`);
  }
}

async function restoreGroupToCurrentWindow(
  group: SavedTabGroup,
  groupAction: GroupConflictAction,
  conflictAnalysis: ConflictAnalysis | undefined,
  dupAction: DuplicateTabAction,
  duplicateUrls: ReadonlySet<string>,
  result: RestoreResult,
): Promise<void> {
  if (groupAction === 'skip') {
    result.duplicatesSkipped += group.tabs.length;
    return;
  }

  const existingConflict = conflictAnalysis?.conflictingGroups.find(
    c => c.savedGroup.id === group.id,
  );

  if (groupAction === 'merge' && existingConflict) {
    await mergeIntoExistingGroup(
      group,
      existingConflict.existingGroupId,
      dupAction,
      duplicateUrls,
      result,
    );
    return;
  }

  // Fallback: 'create_new', or 'merge' without a matching existingConflict
  await createNewGroupInCurrentWindow(group, dupAction, duplicateUrls, result);
}

async function restoreInCurrentWindow(
  tabs: SavedTab[],
  groups: SavedTabGroup[],
  conflictResolution: ConflictResolution | undefined,
  conflictAnalysis: ConflictAnalysis | undefined,
  result: RestoreResult,
): Promise<void> {
  const dupAction = conflictResolution?.duplicateTabAction ?? 'skip';
  const duplicateUrls = new Set(
    (conflictAnalysis?.duplicateTabs ?? []).map(d => d.savedTab.url),
  );

  await restoreUngroupedTabsToCurrentWindow(tabs, dupAction, duplicateUrls, result);

  for (const group of groups) {
    const groupAction: GroupConflictAction =
      conflictResolution?.groupActions.get(group.id) ?? 'create_new';
    await restoreGroupToCurrentWindow(
      group,
      groupAction,
      conflictAnalysis,
      dupAction,
      duplicateUrls,
      result,
    );
  }
}
