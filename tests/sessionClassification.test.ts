import { describe, it, expect } from 'vitest';
import {
  areSessionsEqual,
  getSessionDiff,
  classifyImportedSessions,
} from '../src/utils/sessionClassification';
import type { Session, SavedTab, SavedTabGroup } from '../src/types/session';

function tab(url: string, id = url): SavedTab {
  return { id, title: url, url };
}

function group(
  title: string,
  tabUrls: string[],
  color: 'blue' | 'red' | 'green' | 'yellow' = 'blue',
): SavedTabGroup {
  return {
    id: `group-${title}`,
    title,
    color,
    tabs: tabUrls.map(u => tab(u)),
  };
}

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: overrides.id ?? 'session-id',
    name: overrides.name ?? 'My session',
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
    groups: overrides.groups ?? [],
    ungroupedTabs: overrides.ungroupedTabs ?? [],
    isPinned: overrides.isPinned ?? false,
    categoryId: overrides.categoryId,
    note: overrides.note,
  };
}

describe('areSessionsEqual', () => {
  it('ignores id, name, createdAt, updatedAt', async () => {
    const a = session({ id: 'a', name: 'Alpha', createdAt: '2020', updatedAt: '2021' });
    const b = session({ id: 'b', name: 'Beta', createdAt: '2030', updatedAt: '2031' });
    expect(areSessionsEqual(a, b)).toBe(true);
  });

  it('returns false when isPinned differs', () => {
    const a = session({ isPinned: true });
    const b = session({ isPinned: false });
    expect(areSessionsEqual(a, b)).toBe(false);
  });

  it('normalizes null vs undefined categoryId', () => {
    const a = session({ categoryId: null });
    const b = session({ categoryId: undefined });
    expect(areSessionsEqual(a, b)).toBe(true);
  });

  it('returns false when categoryId value differs', () => {
    const a = session({ categoryId: 'work' });
    const b = session({ categoryId: 'home' });
    expect(areSessionsEqual(a, b)).toBe(false);
  });

  it('returns false when note differs', () => {
    const a = session({ note: 'Remember to deploy' });
    const b = session({ note: 'Waiting on review' });
    expect(areSessionsEqual(a, b)).toBe(false);
  });

  it('treats empty string note and undefined note as equivalent', () => {
    const a = session({ note: '' });
    const b = session({ note: undefined });
    expect(areSessionsEqual(a, b)).toBe(true);
  });

  it('returns false when only one session has a non-empty note', () => {
    const a = session({ note: 'Important' });
    const b = session({ note: undefined });
    expect(areSessionsEqual(a, b)).toBe(false);
  });

  it('returns false when group count differs', () => {
    const a = session({ groups: [group('A', ['https://x.com'])] });
    const b = session({ groups: [] });
    expect(areSessionsEqual(a, b)).toBe(false);
  });

  it('returns false when groups have the same title but different color', () => {
    const a = session({ groups: [group('Work', ['https://x.com'], 'blue')] });
    const b = session({ groups: [group('Work', ['https://x.com'], 'red')] });
    expect(areSessionsEqual(a, b)).toBe(false);
  });

  it('returns false when groups have the same title but different tabs', () => {
    const a = session({ groups: [group('Work', ['https://x.com'])] });
    const b = session({ groups: [group('Work', ['https://y.com'])] });
    expect(areSessionsEqual(a, b)).toBe(false);
  });

  it('treats group titles as case-insensitive', () => {
    const a = session({ groups: [group('Work', ['https://x.com'])] });
    const b = session({ groups: [group('WORK', ['https://x.com'])] });
    expect(areSessionsEqual(a, b)).toBe(true);
  });

  it('treats ungrouped tab order as irrelevant (compares by URL set)', () => {
    const a = session({
      ungroupedTabs: [tab('https://a.com'), tab('https://b.com')],
    });
    const b = session({
      ungroupedTabs: [tab('https://b.com'), tab('https://a.com')],
    });
    expect(areSessionsEqual(a, b)).toBe(true);
  });

  it('returns false when ungrouped tab count differs', () => {
    const a = session({ ungroupedTabs: [tab('https://a.com')] });
    const b = session({
      ungroupedTabs: [tab('https://a.com'), tab('https://b.com')],
    });
    expect(areSessionsEqual(a, b)).toBe(false);
  });

  it('returns false when tab counts match but URLs differ', () => {
    const a = session({
      ungroupedTabs: [tab('https://a.com'), tab('https://b.com')],
    });
    const b = session({
      ungroupedTabs: [tab('https://a.com'), tab('https://c.com')],
    });
    expect(areSessionsEqual(a, b)).toBe(false);
  });
});

describe('getSessionDiff', () => {
  it('returns an empty-ish diff when sessions are structurally identical', () => {
    const existing = session({ groups: [group('Work', ['https://x.com'])] });
    const imported = session({ groups: [group('Work', ['https://x.com'])] });
    const diff = getSessionDiff(existing, imported);
    expect(diff.groupsAdded).toHaveLength(0);
    expect(diff.groupsRemoved).toHaveLength(0);
    expect(diff.groupsChanged).toHaveLength(0);
    expect(diff.ungroupedTabsAdded).toHaveLength(0);
    expect(diff.ungroupedTabsRemoved).toHaveLength(0);
    expect(diff.isPinned).toBeUndefined();
    expect(diff.categoryId).toBeUndefined();
  });

  it('populates isPinned diff', () => {
    const existing = session({ isPinned: false });
    const imported = session({ isPinned: true });
    const diff = getSessionDiff(existing, imported);
    expect(diff.isPinned).toEqual({ current: false, imported: true });
  });

  it('populates categoryId diff and normalizes null/undefined', () => {
    const existing = session({ categoryId: 'work' });
    const imported = session({ categoryId: 'home' });
    const diff = getSessionDiff(existing, imported);
    expect(diff.categoryId).toEqual({ current: 'work', imported: 'home' });
  });

  it('does not flag categoryId diff when one is null and the other undefined', () => {
    const existing = session({ categoryId: null });
    const imported = session({ categoryId: undefined });
    const diff = getSessionDiff(existing, imported);
    expect(diff.categoryId).toBeUndefined();
  });

  it('populates note diff when note content differs', () => {
    const existing = session({ note: 'Old note' });
    const imported = session({ note: 'New note' });
    const diff = getSessionDiff(existing, imported);
    expect(diff.note).toEqual({ current: 'Old note', imported: 'New note' });
  });

  it('populates note diff when a note is added', () => {
    const existing = session({ note: undefined });
    const imported = session({ note: 'Freshly added' });
    const diff = getSessionDiff(existing, imported);
    expect(diff.note).toEqual({ current: undefined, imported: 'Freshly added' });
  });

  it('does not flag a note diff when one is empty string and the other undefined', () => {
    const existing = session({ note: '' });
    const imported = session({ note: undefined });
    const diff = getSessionDiff(existing, imported);
    expect(diff.note).toBeUndefined();
  });

  it('lists groups present only in imported under groupsAdded', () => {
    const existing = session({ groups: [group('Work', ['https://x.com'])] });
    const imported = session({
      groups: [
        group('Work', ['https://x.com']),
        group('Research', ['https://r.com']),
      ],
    });
    const diff = getSessionDiff(existing, imported);
    expect(diff.groupsAdded).toEqual(['Research']);
    expect(diff.groupsRemoved).toHaveLength(0);
  });

  it('lists groups present only in existing under groupsRemoved', () => {
    const existing = session({
      groups: [
        group('Work', ['https://x.com']),
        group('Old', ['https://old.com']),
      ],
    });
    const imported = session({ groups: [group('Work', ['https://x.com'])] });
    const diff = getSessionDiff(existing, imported);
    expect(diff.groupsRemoved).toEqual(['Old']);
    expect(diff.groupsAdded).toHaveLength(0);
  });

  it('reports color change in groupsChanged', () => {
    const existing = session({ groups: [group('Work', ['https://x.com'], 'blue')] });
    const imported = session({ groups: [group('Work', ['https://x.com'], 'red')] });
    const diff = getSessionDiff(existing, imported);
    expect(diff.groupsChanged).toHaveLength(1);
    expect(diff.groupsChanged[0].title).toBe('Work');
    expect(diff.groupsChanged[0].colorChanged).toEqual({
      current: 'blue',
      imported: 'red',
    });
    expect(diff.groupsChanged[0].tabsAdded).toHaveLength(0);
    expect(diff.groupsChanged[0].tabsRemoved).toHaveLength(0);
  });

  it('reports added and removed tabs within a changed group', () => {
    const existing = session({
      groups: [group('Work', ['https://a.com', 'https://b.com'])],
    });
    const imported = session({
      groups: [group('Work', ['https://b.com', 'https://c.com'])],
    });
    const diff = getSessionDiff(existing, imported);
    expect(diff.groupsChanged).toHaveLength(1);
    expect(diff.groupsChanged[0].tabsAdded).toEqual(['https://c.com']);
    expect(diff.groupsChanged[0].tabsRemoved).toEqual(['https://a.com']);
    expect(diff.groupsChanged[0].colorChanged).toBeUndefined();
  });

  it('does not add unchanged groups to groupsChanged', () => {
    const existing = session({
      groups: [
        group('Work', ['https://x.com']),
        group('Home', ['https://h.com']),
      ],
    });
    const imported = session({
      groups: [
        group('Work', ['https://x.com']), // unchanged
        group('Home', ['https://h.com', 'https://new.com']), // changed
      ],
    });
    const diff = getSessionDiff(existing, imported);
    expect(diff.groupsChanged).toHaveLength(1);
    expect(diff.groupsChanged[0].title).toBe('Home');
  });

  it('reports ungrouped tabs added and removed', () => {
    const existing = session({
      ungroupedTabs: [tab('https://keep.com'), tab('https://gone.com')],
    });
    const imported = session({
      ungroupedTabs: [tab('https://keep.com'), tab('https://new.com')],
    });
    const diff = getSessionDiff(existing, imported);
    expect(diff.ungroupedTabsAdded).toEqual(['https://new.com']);
    expect(diff.ungroupedTabsRemoved).toEqual(['https://gone.com']);
  });

  it('matches groups case-insensitively when diffing', () => {
    const existing = session({ groups: [group('Work', ['https://x.com'], 'blue')] });
    const imported = session({ groups: [group('WORK', ['https://x.com'], 'red')] });
    const diff = getSessionDiff(existing, imported);
    expect(diff.groupsAdded).toHaveLength(0);
    expect(diff.groupsRemoved).toHaveLength(0);
    expect(diff.groupsChanged).toHaveLength(1);
    expect(diff.groupsChanged[0].colorChanged).toEqual({
      current: 'blue',
      imported: 'red',
    });
  });
});

describe('classifyImportedSessions', () => {
  it('returns empty classification when nothing is imported', () => {
    const result = classifyImportedSessions([], [session({ name: 'existing' })]);
    expect(result.newSessions).toHaveLength(0);
    expect(result.conflictingSessions).toHaveLength(0);
    expect(result.identicalSessions).toHaveLength(0);
  });

  it('flags all sessions as new when existing list is empty', () => {
    const imported = [session({ name: 'A' }), session({ name: 'B' })];
    const result = classifyImportedSessions(imported, []);
    expect(result.newSessions).toHaveLength(2);
    expect(result.conflictingSessions).toHaveLength(0);
    expect(result.identicalSessions).toHaveLength(0);
  });

  it('flags sessions as identical when structure matches (ignoring name casing)', () => {
    const existing = [
      session({ name: 'Work', groups: [group('G1', ['https://x.com'])] }),
    ];
    const imported = [
      session({ name: 'WORK', groups: [group('G1', ['https://x.com'])] }),
    ];
    const result = classifyImportedSessions(imported, existing);
    expect(result.identicalSessions).toHaveLength(1);
    expect(result.conflictingSessions).toHaveLength(0);
    expect(result.newSessions).toHaveLength(0);
  });

  it('flags sessions as conflicting when name matches but content differs', () => {
    const existing = [
      session({ name: 'Work', groups: [group('G1', ['https://x.com'])] }),
    ];
    const imported = [
      session({ name: 'Work', groups: [group('G1', ['https://y.com'])] }),
    ];
    const result = classifyImportedSessions(imported, existing);
    expect(result.conflictingSessions).toHaveLength(1);
    expect(result.conflictingSessions[0].existing).toBe(existing[0]);
    expect(result.conflictingSessions[0].imported).toBe(imported[0]);
    expect(result.conflictingSessions[0].diff.groupsChanged).toHaveLength(1);
  });

  it('splits a mixed import into new, identical, and conflicting buckets', () => {
    const existing = [
      session({ name: 'Work', groups: [group('G1', ['https://a.com'])] }),
      session({ name: 'Home', ungroupedTabs: [tab('https://h.com')] }),
    ];
    const imported = [
      session({ name: 'Work', groups: [group('G1', ['https://a.com'])] }), // identical
      session({ name: 'Home', ungroupedTabs: [tab('https://h2.com')] }), // conflicting
      session({ name: 'Research' }), // new
    ];
    const result = classifyImportedSessions(imported, existing);
    expect(result.identicalSessions.map(s => s.name)).toEqual(['Work']);
    expect(result.conflictingSessions.map(c => c.imported.name)).toEqual(['Home']);
    expect(result.newSessions.map(s => s.name)).toEqual(['Research']);
  });
});
