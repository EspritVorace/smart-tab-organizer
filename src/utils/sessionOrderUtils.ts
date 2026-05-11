import { arrayMove } from '@dnd-kit/helpers';
import type { Session } from '@/types/session';

/**
 * Move a session to the first position.
 */
export function moveSessionToFirst(sessions: Session[], sessionId: string): Session[] {
  const currentIndex = sessions.findIndex(s => s.id === sessionId);
  if (currentIndex <= 0) return sessions;
  return arrayMove(sessions, currentIndex, 0);
}

/**
 * Move a session to the last position.
 */
export function moveSessionToLast(sessions: Session[], sessionId: string): Session[] {
  const currentIndex = sessions.findIndex(s => s.id === sessionId);
  if (currentIndex < 0 || currentIndex === sessions.length - 1) return sessions;
  return arrayMove(sessions, currentIndex, sessions.length - 1);
}

/**
 * Move a session to the first position within its group (pinned or unpinned).
 * Returns the full recombined array: [...pinned, ...unpinned].
 */
export function moveSessionToFirstInGroup(sessions: Session[], sessionId: string): Session[] {
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return sessions;
  const pinned = sessions.filter(s => s.isPinned);
  const unpinned = sessions.filter(s => !s.isPinned);
  const group = session.isPinned ? pinned : unpinned;
  const reordered = moveSessionToFirst(group, sessionId);
  return session.isPinned ? [...reordered, ...unpinned] : [...pinned, ...reordered];
}

/**
 * Move a session to the last position within its group (pinned or unpinned).
 * Returns the full recombined array: [...pinned, ...unpinned].
 */
export function moveSessionToLastInGroup(sessions: Session[], sessionId: string): Session[] {
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return sessions;
  const pinned = sessions.filter(s => s.isPinned);
  const unpinned = sessions.filter(s => !s.isPinned);
  const group = session.isPinned ? pinned : unpinned;
  const reordered = moveSessionToLast(group, sessionId);
  return session.isPinned ? [...reordered, ...unpinned] : [...pinned, ...reordered];
}

/**
 * Move a tab up or down within its context (ungrouped list or a specific group).
 *
 * - When `groupId` is `null`, the tab is moved within the ungrouped list.
 * - When `groupId` is a non-null string, the tab is moved within that group.
 * - When `groupId` is `undefined` (omitted), the function auto-detects the
 *   container of the tab (ungrouped list first, then each group in order).
 *
 * Returns the original session unchanged if the tab is not found or is already
 * at the boundary in the requested direction.
 */
export function moveTabInGroup(
  session: Session,
  tabId: string,
  direction: 'up' | 'down',
  groupId?: string | null,
): Session {
  // Resolve whether the tab lives in the ungrouped list or in a specific group.
  const resolvedInUngrouped =
    groupId === null ||
    (groupId === undefined && session.ungroupedTabs.some((t) => t.id === tabId));

  if (resolvedInUngrouped) {
    const idx = session.ungroupedTabs.findIndex((t) => t.id === tabId);
    if (idx === -1) return session;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= session.ungroupedTabs.length) return session;
    const tabs = [...session.ungroupedTabs];
    [tabs[idx], tabs[newIdx]] = [tabs[newIdx], tabs[idx]];
    return { ...session, ungroupedTabs: tabs };
  }

  // Tab is in a group: either the explicitly provided one or the auto-detected one.
  const groups = session.groups.map((g) => {
    if (groupId !== undefined && g.id !== groupId) return g;
    const idx = g.tabs.findIndex((t) => t.id === tabId);
    if (idx === -1) return g;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= g.tabs.length) return g;
    const tabs = [...g.tabs];
    [tabs[idx], tabs[newIdx]] = [tabs[newIdx], tabs[idx]];
    return { ...g, tabs };
  });

  return { ...session, groups };
}

type Tab = Session['ungroupedTabs'][number];
type RemoveResult = { tab: Tab | undefined; nextUngrouped: Session['ungroupedTabs']; nextGroups: Session['groups'] };

function removeTabFromSource(
  session: Session,
  tabId: string,
  sourceGroupId: string | null | undefined,
): RemoveResult {
  if (sourceGroupId === null) {
    return {
      tab: session.ungroupedTabs.find((t) => t.id === tabId),
      nextUngrouped: session.ungroupedTabs.filter((t) => t.id !== tabId),
      nextGroups: session.groups,
    };
  }

  if (sourceGroupId !== undefined) {
    const group = session.groups.find((g) => g.id === sourceGroupId);
    return {
      tab: group?.tabs.find((t) => t.id === tabId),
      nextUngrouped: session.ungroupedTabs,
      nextGroups: session.groups.map((g) =>
        g.id === sourceGroupId ? { ...g, tabs: g.tabs.filter((t) => t.id !== tabId) } : g
      ),
    };
  }

  // Auto-detect source
  const ungroupedIdx = session.ungroupedTabs.findIndex((t) => t.id === tabId);
  if (ungroupedIdx !== -1) {
    return {
      tab: session.ungroupedTabs[ungroupedIdx],
      nextUngrouped: session.ungroupedTabs.filter((t) => t.id !== tabId),
      nextGroups: session.groups,
    };
  }

  let found: Tab | undefined;
  for (const g of session.groups) {
    found = g.tabs.find((t) => t.id === tabId);
    if (found) break;
  }
  return {
    tab: found,
    nextUngrouped: session.ungroupedTabs,
    nextGroups: session.groups.map((g) => ({ ...g, tabs: g.tabs.filter((t) => t.id !== tabId) })),
  };
}

function insertTabInTarget(
  ungrouped: Session['ungroupedTabs'],
  groups: Session['groups'],
  tab: Tab,
  targetGroupId: string | null,
): { nextUngrouped: Session['ungroupedTabs']; nextGroups: Session['groups'] } {
  if (targetGroupId === null) {
    return { nextUngrouped: [...ungrouped, tab], nextGroups: groups };
  }
  return {
    nextUngrouped: ungrouped,
    nextGroups: groups.map((g) =>
      g.id === targetGroupId ? { ...g, tabs: [...g.tabs, tab] } : g
    ),
  };
}

/**
 * Reassign a tab from its source location to a target group (or to ungrouped).
 *
 * - `sourceGroupId === null` means the tab is currently ungrouped.
 * - `sourceGroupId === undefined` means the source is auto-detected (ungrouped
 *   list first, then each group in order).
 * - `targetGroupId === null` means the tab should become ungrouped.
 * - `targetGroupId` being a string moves the tab into that group.
 *
 * Returns the original session unchanged if the tab is not found.
 */
export function reassignTabToGroup(
  session: Session,
  tabId: string,
  sourceGroupId: string | null | undefined,
  targetGroupId: string | null,
): Session {
  const { tab, nextUngrouped, nextGroups } = removeTabFromSource(session, tabId, sourceGroupId);
  if (!tab) return session;
  const { nextUngrouped: finalUngrouped, nextGroups: finalGroups } = insertTabInTarget(nextUngrouped, nextGroups, tab, targetGroupId);
  return { ...session, ungroupedTabs: finalUngrouped, groups: finalGroups };
}
