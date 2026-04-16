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

/** Compute the structured diff between an existing and an imported session */
export function getSessionDiff(existing: Session, imported: Session): SessionDiff {
  const diff: SessionDiff = {
    groupsAdded: [],
    groupsRemoved: [],
    groupsChanged: [],
    ungroupedTabsAdded: [],
    ungroupedTabsRemoved: [],
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

  // Groups diff
  const existingGroups = new Map(existing.groups.map(g => [g.title.toLowerCase(), g]));
  const importedGroups = new Map(imported.groups.map(g => [g.title.toLowerCase(), g]));

  for (const [title, importedGroup] of importedGroups) {
    const existingGroup = existingGroups.get(title);
    if (!existingGroup) {
      diff.groupsAdded.push(importedGroup.title);
    } else {
      const groupDiff: GroupDiff = { title: importedGroup.title, tabsAdded: [], tabsRemoved: [] };
      if (existingGroup.color !== importedGroup.color) {
        groupDiff.colorChanged = { current: existingGroup.color, imported: importedGroup.color };
      }
      const existingUrls = getTabUrls(existingGroup.tabs);
      const importedUrls = getTabUrls(importedGroup.tabs);
      for (const url of importedUrls) {
        if (!existingUrls.has(url)) groupDiff.tabsAdded.push(url);
      }
      for (const url of existingUrls) {
        if (!importedUrls.has(url)) groupDiff.tabsRemoved.push(url);
      }
      if (groupDiff.colorChanged || groupDiff.tabsAdded.length > 0 || groupDiff.tabsRemoved.length > 0) {
        diff.groupsChanged.push(groupDiff);
      }
    }
  }

  for (const [title, existingGroup] of existingGroups) {
    if (!importedGroups.has(title)) {
      diff.groupsRemoved.push(existingGroup.title);
    }
  }

  // Ungrouped tabs diff
  const existingUngroupedUrls = getTabUrls(existing.ungroupedTabs);
  const importedUngroupedUrls = getTabUrls(imported.ungroupedTabs);
  for (const url of importedUngroupedUrls) {
    if (!existingUngroupedUrls.has(url)) diff.ungroupedTabsAdded.push(url);
  }
  for (const url of existingUngroupedUrls) {
    if (!importedUngroupedUrls.has(url)) diff.ungroupedTabsRemoved.push(url);
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
