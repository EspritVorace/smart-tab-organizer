import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { analyzeConflicts } from '../src/utils/conflictDetection';
import type { SavedTab, SavedTabGroup } from '../src/types/session';

// fakeBrowser implements tabs + windows + storage, but NOT tabGroups.
// We attach a stubbable tabGroups.query directly on the fake instance.
const mockTabGroupsQuery = vi.fn();
(fakeBrowser as any).tabGroups = { query: mockTabGroupsQuery };

function makeTab(url: string, title = 'Tab'): SavedTab {
  return { id: `saved-${url}`, title, url };
}

function makeGroup(
  title: string,
  color: 'blue' | 'red' | 'green' = 'blue',
  tabs: SavedTab[] = [],
): SavedTabGroup {
  return { id: `group-${title}`, title, color, tabs };
}

/** Seed real tabs in fakeBrowser's current window. */
async function seedOpenTabs(urls: (string | undefined)[]): Promise<void> {
  for (const url of urls) {
    await fakeBrowser.tabs.create({ url });
  }
}

beforeEach(async () => {
  fakeBrowser.reset();
  mockTabGroupsQuery.mockReset();
  mockTabGroupsQuery.mockResolvedValue([]);
  // Reattach after reset (fakeBrowser.reset() wipes everything)
  (fakeBrowser as any).tabGroups = { query: mockTabGroupsQuery };
  // fakeBrowser does not auto-create a window — we need one focused for
  // tabs.query({ currentWindow: true }) and windows.getCurrent() to resolve.
  // `focused: true` is required: fake-browser only sets focusedWindowId then.
  await fakeBrowser.windows.create({ focused: true });
});

describe('analyzeConflicts — tabs', () => {
  it('classifies all tabs as new when no open URLs match', async () => {
    await seedOpenTabs(['https://other.com']);

    const result = await analyzeConflicts(
      [makeTab('https://a.com'), makeTab('https://b.com')],
      [],
    );

    expect(result.newTabs).toHaveLength(2);
    expect(result.duplicateTabs).toHaveLength(0);
  });

  it('classifies all tabs as duplicates when every URL is already open', async () => {
    await seedOpenTabs(['https://a.com', 'https://b.com']);

    const result = await analyzeConflicts(
      [makeTab('https://a.com'), makeTab('https://b.com')],
      [],
    );

    expect(result.duplicateTabs).toHaveLength(2);
    expect(result.duplicateTabs[0].savedTab.url).toBe('https://a.com');
    expect(result.duplicateTabs[0].existingTabUrl).toBe('https://a.com');
    expect(result.newTabs).toHaveLength(0);
  });

  it('splits new and duplicate tabs correctly', async () => {
    await seedOpenTabs(['https://a.com', 'https://c.com']);

    const result = await analyzeConflicts(
      [makeTab('https://a.com'), makeTab('https://b.com'), makeTab('https://c.com')],
      [],
    );

    expect(result.duplicateTabs.map(d => d.savedTab.url)).toEqual([
      'https://a.com',
      'https://c.com',
    ]);
    expect(result.newTabs.map(t => t.url)).toEqual(['https://b.com']);
  });

  it('handles empty selected tabs', async () => {
    await seedOpenTabs(['https://a.com']);

    const result = await analyzeConflicts([], []);

    expect(result.newTabs).toHaveLength(0);
    expect(result.duplicateTabs).toHaveLength(0);
  });

  it('ignores open tabs that have no URL', async () => {
    await seedOpenTabs([undefined, 'https://a.com']);

    const result = await analyzeConflicts([makeTab('https://a.com')], []);

    expect(result.duplicateTabs).toHaveLength(1);
  });
});

describe('analyzeConflicts — groups', () => {
  it('classifies all groups as new when no open group matches', async () => {
    mockTabGroupsQuery.mockResolvedValue([
      { id: 100, title: 'Other', color: 'red' },
    ]);

    const result = await analyzeConflicts(
      [],
      [makeGroup('Work', 'blue'), makeGroup('Research', 'green')],
    );

    expect(result.newGroups).toHaveLength(2);
    expect(result.conflictingGroups).toHaveLength(0);
  });

  it('detects a conflict when title + color match (case-insensitive on title)', async () => {
    mockTabGroupsQuery.mockResolvedValue([
      { id: 500, title: 'WORK', color: 'blue' },
    ]);

    const result = await analyzeConflicts([], [makeGroup('work', 'blue')]);

    expect(result.conflictingGroups).toHaveLength(1);
    expect(result.conflictingGroups[0].existingGroupId).toBe(500);
    expect(result.conflictingGroups[0].existingGroupTitle).toBe('WORK');
  });

  it('does NOT flag a conflict when title matches but color differs', async () => {
    mockTabGroupsQuery.mockResolvedValue([
      { id: 500, title: 'Work', color: 'red' },
    ]);

    const result = await analyzeConflicts([], [makeGroup('Work', 'blue')]);

    expect(result.conflictingGroups).toHaveLength(0);
    expect(result.newGroups).toHaveLength(1);
  });

  it('does NOT flag a conflict when color matches but title differs', async () => {
    mockTabGroupsQuery.mockResolvedValue([
      { id: 500, title: 'Home', color: 'blue' },
    ]);

    const result = await analyzeConflicts([], [makeGroup('Work', 'blue')]);

    expect(result.conflictingGroups).toHaveLength(0);
    expect(result.newGroups).toHaveLength(1);
  });

  it('splits matching and non-matching groups correctly', async () => {
    mockTabGroupsQuery.mockResolvedValue([
      { id: 500, title: 'Work', color: 'blue' },
      { id: 501, title: 'Research', color: 'red' },
    ]);

    const result = await analyzeConflicts(
      [],
      [
        makeGroup('Work', 'blue'),
        makeGroup('Unknown', 'green'),
        makeGroup('Research', 'red'),
      ],
    );

    expect(result.conflictingGroups.map(c => c.savedGroup.title)).toEqual([
      'Work',
      'Research',
    ]);
    expect(result.newGroups.map(g => g.title)).toEqual(['Unknown']);
  });

  it('falls back to no group conflicts when tabGroups.query throws', async () => {
    mockTabGroupsQuery.mockRejectedValue(new Error('tabGroups API unavailable'));

    const result = await analyzeConflicts([], [makeGroup('Work', 'blue')]);

    expect(result.conflictingGroups).toHaveLength(0);
    expect(result.newGroups).toHaveLength(1);
  });

  it('handles empty selected groups', async () => {
    mockTabGroupsQuery.mockResolvedValue([
      { id: 500, title: 'Work', color: 'blue' },
    ]);

    const result = await analyzeConflicts([], []);

    expect(result.newGroups).toHaveLength(0);
    expect(result.conflictingGroups).toHaveLength(0);
  });
});

describe('analyzeConflicts — combined', () => {
  it('analyzes tabs and groups in one call', async () => {
    await seedOpenTabs(['https://a.com']);
    mockTabGroupsQuery.mockResolvedValue([
      { id: 500, title: 'Work', color: 'blue' },
    ]);

    const result = await analyzeConflicts(
      [makeTab('https://a.com'), makeTab('https://b.com')],
      [makeGroup('Work', 'blue'), makeGroup('Home', 'red')],
    );

    expect(result.duplicateTabs).toHaveLength(1);
    expect(result.newTabs).toHaveLength(1);
    expect(result.conflictingGroups).toHaveLength(1);
    expect(result.newGroups).toHaveLength(1);
  });
});
