import { describe, it, expect, vi, beforeEach } from 'vitest';
import { restoreTabs } from '../src/utils/tabRestore';
import type { SavedTab, SavedTabGroup } from '../src/types/session';
import type { ConflictAnalysis, ConflictResolution } from '../src/utils/conflictDetection';

// Mock wxt/browser with explicit vi.fn()s so each test can assert on call args.
vi.mock('wxt/browser', () => {
  return {
    browser: {
      tabs: {
        create: vi.fn(),
        remove: vi.fn(),
        query: vi.fn(),
        group: vi.fn(),
      },
      windows: {
        create: vi.fn(),
      },
      tabGroups: {
        update: vi.fn(),
      },
    },
  };
});

import { browser } from 'wxt/browser';

const mockTabsCreate = browser.tabs.create as ReturnType<typeof vi.fn>;
const mockTabsRemove = browser.tabs.remove as ReturnType<typeof vi.fn>;
const mockTabsQuery = browser.tabs.query as ReturnType<typeof vi.fn>;
const mockTabsGroup = (browser.tabs as any).group as ReturnType<typeof vi.fn>;
const mockWindowsCreate = browser.windows.create as ReturnType<typeof vi.fn>;
const mockTabGroupsUpdate = (browser.tabGroups as any).update as ReturnType<typeof vi.fn>;

// Incrementing tab ID generator for tabs.create — used by merge tests that
// need to inspect which IDs were passed to tabs.group().
let tabIdCounter = 0;
function nextTabId(): number {
  return ++tabIdCounter;
}

function makeTab(url: string, title = 'Tab'): SavedTab {
  return { id: `saved-${url}`, title, url };
}

function makeGroup(title: string, tabs: SavedTab[], color: 'blue' | 'red' = 'blue', collapsed?: boolean): SavedTabGroup {
  return { id: `group-${title}`, title, color, tabs, ...(collapsed !== undefined ? { collapsed } : {}) };
}

beforeEach(() => {
  vi.clearAllMocks();
  tabIdCounter = 0;
  // Default: tabs.create returns a tab with a fresh ID
  mockTabsCreate.mockImplementation(async () => ({ id: nextTabId() }));
  mockTabsGroup.mockResolvedValue(100);
  mockTabGroupsUpdate.mockResolvedValue(undefined);
  mockTabsQuery.mockResolvedValue([]);
  mockTabsRemove.mockResolvedValue(undefined);
});

describe('restoreTabs — new window', () => {
  it('creates a new window seeded with the first ungrouped tab URL', async () => {
    mockWindowsCreate.mockResolvedValue({ id: 42, tabs: [{ id: 1 }] });

    const result = await restoreTabs({
      tabs: [makeTab('https://a.com'), makeTab('https://b.com')],
      groups: [],
      target: 'new',
    });

    expect(mockWindowsCreate).toHaveBeenCalledWith({ url: 'https://a.com' });
    // First tab created by windows.create, second by tabs.create
    expect(mockTabsCreate).toHaveBeenCalledTimes(1);
    expect(mockTabsCreate).toHaveBeenCalledWith({ url: 'https://b.com', windowId: 42 });
    expect(result.tabsCreated).toBe(2);
    expect(result.windowId).toBe(42);
    expect(result.errors).toHaveLength(0);
  });

  it('creates a new window and restores groups', async () => {
    mockWindowsCreate.mockResolvedValue({ id: 42, tabs: [{ id: 1 }] });

    const result = await restoreTabs({
      tabs: [],
      groups: [
        makeGroup('Work', [makeTab('https://work1.com'), makeTab('https://work2.com')], 'blue'),
      ],
      target: 'new',
    });

    expect(mockWindowsCreate).toHaveBeenCalledWith({ url: 'https://work1.com' });
    // First group tab consumed from windows.create → only work2 created via tabs.create
    expect(mockTabsCreate).toHaveBeenCalledTimes(1);
    expect(mockTabsCreate).toHaveBeenCalledWith({ url: 'https://work2.com', windowId: 42 });
    expect(mockTabsGroup).toHaveBeenCalledOnce();
    const groupCall = mockTabsGroup.mock.calls[0][0];
    expect(groupCall.tabIds).toHaveLength(2);
    expect(groupCall.tabIds).toContain(1); // reused firstTabId
    expect(mockTabGroupsUpdate).toHaveBeenCalledWith(100, { title: 'Work', color: 'blue', collapsed: false });
    expect(result.groupsCreated).toBe(1);
    expect(result.tabsCreated).toBe(2);
  });

  it('records errors from tabs.create failures without crashing', async () => {
    mockWindowsCreate.mockResolvedValue({ id: 42, tabs: [{ id: 1 }] });
    mockTabsCreate
      .mockResolvedValueOnce({ id: 2 })
      .mockRejectedValueOnce(new Error('boom'));

    const result = await restoreTabs({
      tabs: [
        makeTab('https://a.com'),
        makeTab('https://b.com'),
        makeTab('https://c.com'),
      ],
      groups: [],
      target: 'new',
    });

    expect(result.tabsCreated).toBe(2); // seeded a.com + successful b.com
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('https://c.com');
  });

  it('passes collapsed: true to tabGroups.update when group has collapsed: true [US-S017]', async () => {
    mockWindowsCreate.mockResolvedValue({ id: 42, tabs: [{ id: 1 }] });

    await restoreTabs({
      tabs: [],
      groups: [makeGroup('Work', [makeTab('https://a.com')], 'blue', true)],
      target: 'new',
    });

    expect(mockTabGroupsUpdate).toHaveBeenCalledWith(100, {
      title: 'Work',
      color: 'blue',
      collapsed: true,
    });
  });

  it('passes collapsed: false to tabGroups.update when group has no collapsed field [US-S017]', async () => {
    mockWindowsCreate.mockResolvedValue({ id: 42, tabs: [{ id: 1 }] });

    await restoreTabs({
      tabs: [],
      groups: [makeGroup('Work', [makeTab('https://a.com')], 'blue')],
      target: 'new',
    });

    expect(mockTabGroupsUpdate).toHaveBeenCalledWith(100, {
      title: 'Work',
      color: 'blue',
      collapsed: false,
    });
  });

  it('returns an error when windows.create does not yield an id', async () => {
    mockWindowsCreate.mockResolvedValue({ id: undefined, tabs: [] });

    const result = await restoreTabs({
      tabs: [makeTab('https://a.com')],
      groups: [],
      target: 'new',
    });

    expect(result.errors).toContain('Failed to create new window');
    expect(result.tabsCreated).toBe(0); // early return before any counting
    expect(mockTabsCreate).not.toHaveBeenCalled();
  });
});

describe('restoreTabs — current window', () => {
  it('creates ungrouped tabs in the current window', async () => {
    const result = await restoreTabs({
      tabs: [makeTab('https://a.com'), makeTab('https://b.com')],
      groups: [],
      target: 'current',
    });

    expect(mockTabsCreate).toHaveBeenCalledTimes(2);
    expect(mockTabsCreate).toHaveBeenCalledWith({ url: 'https://a.com' });
    expect(mockTabsCreate).toHaveBeenCalledWith({ url: 'https://b.com' });
    expect(mockWindowsCreate).not.toHaveBeenCalled();
    expect(result.tabsCreated).toBe(2);
  });

  it('skips duplicates when conflict resolution is "skip"', async () => {
    const analysis: ConflictAnalysis = {
      duplicateTabs: [
        { savedTab: makeTab('https://a.com'), existingTabId: 999 },
      ],
      conflictingGroups: [],
      // any other fields the type needs
    } as unknown as ConflictAnalysis;

    const resolution: ConflictResolution = {
      duplicateTabAction: 'skip',
      groupActions: new Map(),
    } as unknown as ConflictResolution;

    const result = await restoreTabs({
      tabs: [makeTab('https://a.com'), makeTab('https://b.com')],
      groups: [],
      target: 'current',
      conflictAnalysis: analysis,
      conflictResolution: resolution,
    });

    expect(mockTabsCreate).toHaveBeenCalledTimes(1);
    expect(mockTabsCreate).toHaveBeenCalledWith({ url: 'https://b.com' });
    expect(result.tabsCreated).toBe(1);
    expect(result.duplicatesSkipped).toBe(1);
  });

  it('creates a new group when groupAction is "create_new" (default)', async () => {
    const group = makeGroup('Research', [
      makeTab('https://r1.com'),
      makeTab('https://r2.com'),
    ]);

    const result = await restoreTabs({
      tabs: [],
      groups: [group],
      target: 'current',
    });

    expect(mockTabsCreate).toHaveBeenCalledTimes(2);
    expect(mockTabsGroup).toHaveBeenCalledOnce();
    const groupCall = mockTabsGroup.mock.calls[0][0];
    expect(groupCall.tabIds).toHaveLength(2);
    expect(groupCall.groupId).toBeUndefined();
    expect(mockTabGroupsUpdate).toHaveBeenCalledWith(100, {
      title: 'Research',
      color: 'blue',
      collapsed: false,
    });
    expect(result.groupsCreated).toBe(1);
    expect(result.tabsCreated).toBe(2);
  });

  it('passes collapsed state to tabGroups.update in current window [US-S017]', async () => {
    const group = makeGroup('Research', [makeTab('https://r1.com')], 'red', true);

    await restoreTabs({
      tabs: [],
      groups: [group],
      target: 'current',
    });

    expect(mockTabGroupsUpdate).toHaveBeenCalledWith(100, {
      title: 'Research',
      color: 'red',
      collapsed: true,
    });
  });

  it('skips a group entirely when groupAction is "skip"', async () => {
    const group = makeGroup('Work', [
      makeTab('https://a.com'),
      makeTab('https://b.com'),
    ]);
    const resolution: ConflictResolution = {
      duplicateTabAction: 'keep',
      groupActions: new Map([['group-Work', 'skip']]),
    } as unknown as ConflictResolution;

    const result = await restoreTabs({
      tabs: [],
      groups: [group],
      target: 'current',
      conflictResolution: resolution,
    });

    expect(mockTabsCreate).not.toHaveBeenCalled();
    expect(mockTabsGroup).not.toHaveBeenCalled();
    expect(result.duplicatesSkipped).toBe(2);
    expect(result.groupsCreated).toBe(0);
  });

  it('merges into an existing group and skips tabs already present in it', async () => {
    const group = makeGroup('Work', [
      makeTab('https://a.com'),
      makeTab('https://b.com'),
      makeTab('https://c.com'),
    ]);
    const analysis: ConflictAnalysis = {
      duplicateTabs: [],
      conflictingGroups: [
        { savedGroup: group, existingGroupId: 500 },
      ],
    } as unknown as ConflictAnalysis;
    const resolution: ConflictResolution = {
      duplicateTabAction: 'keep',
      groupActions: new Map([['group-Work', 'merge']]),
    } as unknown as ConflictResolution;

    // Existing group already contains a.com → should not be recreated
    mockTabsQuery.mockResolvedValue([
      { id: 999, url: 'https://a.com', groupId: 500 },
    ]);

    const result = await restoreTabs({
      tabs: [],
      groups: [group],
      target: 'current',
      conflictAnalysis: analysis,
      conflictResolution: resolution,
    });

    expect(mockTabsQuery).toHaveBeenCalledWith({ groupId: 500 });
    // Only b.com and c.com should be created
    expect(mockTabsCreate).toHaveBeenCalledTimes(2);
    expect(mockTabsCreate).toHaveBeenCalledWith({ url: 'https://b.com' });
    expect(mockTabsCreate).toHaveBeenCalledWith({ url: 'https://c.com' });
    // tabs.group called with existing groupId (merge)
    const groupCall = mockTabsGroup.mock.calls[0][0];
    expect(groupCall.groupId).toBe(500);
    expect(result.groupsMerged).toBe(1);
    expect(result.groupsCreated).toBe(0);
    expect(result.duplicatesSkipped).toBe(1); // a.com skipped
  });

  it('counts merge as success even when every tab is already present', async () => {
    const group = makeGroup('Work', [makeTab('https://a.com')]);
    const analysis: ConflictAnalysis = {
      duplicateTabs: [],
      conflictingGroups: [{ savedGroup: group, existingGroupId: 500 }],
    } as unknown as ConflictAnalysis;
    const resolution: ConflictResolution = {
      duplicateTabAction: 'keep',
      groupActions: new Map([['group-Work', 'merge']]),
    } as unknown as ConflictResolution;

    mockTabsQuery.mockResolvedValue([{ id: 999, url: 'https://a.com', groupId: 500 }]);

    const result = await restoreTabs({
      tabs: [],
      groups: [group],
      target: 'current',
      conflictAnalysis: analysis,
      conflictResolution: resolution,
    });

    expect(mockTabsCreate).not.toHaveBeenCalled();
    expect(mockTabsGroup).not.toHaveBeenCalled();
    expect(result.groupsMerged).toBe(1);
    expect(result.duplicatesSkipped).toBe(1);
  });

  it('combines global duplicate skip with group creation', async () => {
    const group = makeGroup('Work', [
      makeTab('https://dup.com'),
      makeTab('https://fresh.com'),
    ]);
    const analysis: ConflictAnalysis = {
      duplicateTabs: [{ savedTab: makeTab('https://dup.com'), existingTabId: 999 }],
      conflictingGroups: [],
    } as unknown as ConflictAnalysis;
    const resolution: ConflictResolution = {
      duplicateTabAction: 'skip',
      groupActions: new Map(),
    } as unknown as ConflictResolution;

    const result = await restoreTabs({
      tabs: [],
      groups: [group],
      target: 'current',
      conflictAnalysis: analysis,
      conflictResolution: resolution,
    });

    expect(mockTabsCreate).toHaveBeenCalledTimes(1);
    expect(mockTabsCreate).toHaveBeenCalledWith({ url: 'https://fresh.com' });
    expect(result.tabsCreated).toBe(1);
    expect(result.duplicatesSkipped).toBe(1);
    expect(result.groupsCreated).toBe(1);
  });

  it('records an error when tabs.group fails but still counts created tabs', async () => {
    const group = makeGroup('Work', [makeTab('https://a.com')]);
    mockTabsGroup.mockRejectedValue(new Error('group failed'));

    const result = await restoreTabs({
      tabs: [],
      groups: [group],
      target: 'current',
    });

    expect(result.tabsCreated).toBe(1);
    expect(result.groupsCreated).toBe(0);
    expect(result.errors.some(e => e.includes('Work'))).toBe(true);
  });

  it('records an error when tabs.create fails inside a group restore', async () => {
    const group = makeGroup('Work', [
      makeTab('https://ok.com'),
      makeTab('https://fail.com'),
    ]);
    mockTabsCreate
      .mockResolvedValueOnce({ id: 1 })
      .mockRejectedValueOnce(new Error('network error'));

    const result = await restoreTabs({
      tabs: [],
      groups: [group],
      target: 'current',
    });

    expect(result.tabsCreated).toBe(1);
    expect(result.errors.some(e => e.includes('https://fail.com'))).toBe(true);
    // Group still created with the 1 successful tab
    expect(result.groupsCreated).toBe(1);
  });

  it('does not call tabs.group at all when no tabs could be created for a group', async () => {
    const group = makeGroup('Work', [makeTab('https://fail.com')]);
    mockTabsCreate.mockRejectedValue(new Error('network error'));

    const result = await restoreTabs({
      tabs: [],
      groups: [group],
      target: 'current',
    });

    expect(mockTabsGroup).not.toHaveBeenCalled();
    expect(result.groupsCreated).toBe(0);
    expect(result.errors).toHaveLength(1);
  });
});
