import type { Session, SavedTab, SavedTabGroup } from '@/types/session';

export interface GroupDiff {
  title: string;
  colorChanged?: { current: string; imported: string };
  tabsAdded: string[];   // urls
  tabsRemoved: string[]; // urls
}

export interface SessionDiff {
  isPinned?: { current: boolean; imported: boolean };
  categoryId?: { current: string | null | undefined; imported: string | null | undefined };
  note?: { current: string | undefined; imported: string | undefined };
  groupsAdded: string[];       // titles
  groupsRemoved: string[];     // titles
  groupsChanged: GroupDiff[];
  ungroupedTabsAdded: string[];   // urls
  ungroupedTabsRemoved: string[]; // urls
}

export interface ConflictingSession {
  imported: Session;
  existing: Session;
  diff: SessionDiff;
}

export interface SessionClassification {
  newSessions: Session[];
  conflictingSessions: ConflictingSession[];
  identicalSessions: Session[];
}

function getTabUrls(tabs: SavedTab[]): Set<string> {
  return new Set(tabs.map(t => t.url));
}

function areTabArraysEqual(a: SavedTab[], b: SavedTab[]): boolean {
  if (a.length !== b.length) return false;
  const urlsA = getTabUrls(a);
  const urlsB = getTabUrls(b);
  if (urlsA.size !== urlsB.size) return false;
  for (const url of urlsA) {
    if (!urlsB.has(url)) return false;
  }
  return true;
}

function areGroupArraysEqual(a: SavedTabGroup[], b: SavedTabGroup[]): boolean {
  if (a.length !== b.length) return false;
  const byTitleA = new Map(a.map(g => [g.title.toLowerCase(), g]));
  const byTitleB = new Map(b.map(g => [g.title.toLowerCase(), g]));
  if (byTitleA.size !== byTitleB.size) return false;
  for (const [title, groupA] of byTitleA) {
    const groupB = byTitleB.get(title);
    if (!groupB) return false;
    if (groupA.color !== groupB.color) return false;
    if (!areTabArraysEqual(groupA.tabs, groupB.tabs)) return false;
  }
  return true;
}

/** Compare two sessions ignoring id, name, createdAt, updatedAt */
export function areSessionsEqual(a: Session, b: Session): boolean {
  return (
    a.isPinned === b.isPinned &&
    (a.categoryId ?? null) === (b.categoryId ?? null) &&
    (a.note ?? '') === (b.note ?? '') &&
    areGroupArraysEqual(a.groups, b.groups) &&
    areTabArraysEqual(a.ungroupedTabs, b.ungroupedTabs)
  );
}

interface UngroupedTabsDiff {
  added: string[];
  removed: string[];
}

interface GroupContentDiff {
  tabsAdded: string[];
  tabsRemoved: string[];
  colorChanged?: { current: string; imported: string };
}

interface GroupsDiff {
  added: string[];
  removed: string[];
  changed: GroupDiff[];
}

function diffUngroupedTabs(existing: SavedTab[], imported: SavedTab[]): UngroupedTabsDiff {
  const existingUrls = getTabUrls(existing);
  const importedUrls = getTabUrls(imported);
  const added: string[] = [];
  const removed: string[] = [];
  for (const url of importedUrls) {
    if (!existingUrls.has(url)) added.push(url);
  }
  for (const url of existingUrls) {
    if (!importedUrls.has(url)) removed.push(url);
  }
  return { added, removed };
}

function compareGroupContents(existing: SavedTabGroup, imported: SavedTabGroup): GroupContentDiff {
  const tabsDiff = diffUngroupedTabs(existing.tabs, imported.tabs);
  const result: GroupContentDiff = { tabsAdded: tabsDiff.added, tabsRemoved: tabsDiff.removed };
  if (existing.color !== imported.color) {
    result.colorChanged = { current: existing.color, imported: imported.color };
  }
  return result;
}

function isGroupContentChanged(content: GroupContentDiff): boolean {
  return Boolean(content.colorChanged) || content.tabsAdded.length > 0 || content.tabsRemoved.length > 0;
}

function diffGroups(existing: SavedTabGroup[], imported: SavedTabGroup[]): GroupsDiff {
  const existingByTitle = new Map(existing.map(g => [g.title.toLowerCase(), g]));
  const importedByTitle = new Map(imported.map(g => [g.title.toLowerCase(), g]));

  const added: string[] = [];
  const changed: GroupDiff[] = [];

  for (const [title, importedGroup] of importedByTitle) {
    const existingGroup = existingByTitle.get(title);
    if (!existingGroup) {
      added.push(importedGroup.title);
      continue;
    }
    const content = compareGroupContents(existingGroup, importedGroup);
    if (isGroupContentChanged(content)) {
      changed.push({
        title: importedGroup.title,
        tabsAdded: content.tabsAdded,
        tabsRemoved: content.tabsRemoved,
        ...(content.colorChanged ? { colorChanged: content.colorChanged } : {}),
      });
    }
  }

  const removed: string[] = [];
  for (const [title, existingGroup] of existingByTitle) {
    if (!importedByTitle.has(title)) {
      removed.push(existingGroup.title);
    }
  }

  return { added, removed, changed };
}

/** Compute the structured diff between an existing and an imported session */
export function getSessionDiff(existing: Session, imported: Session): SessionDiff {
  const groups = diffGroups(existing.groups, imported.groups);
  const ungrouped = diffUngroupedTabs(existing.ungroupedTabs, imported.ungroupedTabs);

  const diff: SessionDiff = {
    groupsAdded: groups.added,
    groupsRemoved: groups.removed,
    groupsChanged: groups.changed,
    ungroupedTabsAdded: ungrouped.added,
    ungroupedTabsRemoved: ungrouped.removed,
  };

  if (existing.isPinned !== imported.isPinned) {
    diff.isPinned = { current: existing.isPinned, imported: imported.isPinned };
  }

  const existingCat = existing.categoryId ?? null;
  const importedCat = imported.categoryId ?? null;
  if (existingCat !== importedCat) {
    diff.categoryId = { current: existingCat, imported: importedCat };
  }

  // Empty string and undefined are treated as equivalent (no note set).
  if ((existing.note ?? '') !== (imported.note ?? '')) {
    diff.note = { current: existing.note, imported: imported.note };
  }

  return diff;
}

/** Classify imported sessions into new, conflicting, and identical groups */
export function classifyImportedSessions(
  importedSessions: Session[],
  existingSessions: Session[]
): SessionClassification {
  const existingByName = new Map<string, Session>();
  for (const session of existingSessions) {
    existingByName.set(session.name.toLowerCase(), session);
  }

  const newSessions: Session[] = [];
  const conflictingSessions: ConflictingSession[] = [];
  const identicalSessions: Session[] = [];

  for (const imported of importedSessions) {
    const existing = existingByName.get(imported.name.toLowerCase());
    if (!existing) {
      newSessions.push(imported);
    } else if (areSessionsEqual(existing, imported)) {
      identicalSessions.push(imported);
    } else {
      conflictingSessions.push({
        imported,
        existing,
        diff: getSessionDiff(existing, imported),
      });
    }
  }

  return { newSessions, conflictingSessions, identicalSessions };
}
