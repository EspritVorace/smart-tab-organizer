import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureCurrentTabs, hasCapturableTabs } from '../src/utils/tabCapture';

// Mock wxt/browser
vi.mock('wxt/browser', () => {
  const mockTabsQuery = vi.fn();
  const mockTabGroupsGet = vi.fn();
  return {
    browser: {
      tabs: { query: mockTabsQuery },
      tabGroups: { get: mockTabGroupsGet },
    },
  };
});

import { browser } from 'wxt/browser';

const mockTabsQuery = browser.tabs.query as ReturnType<typeof vi.fn>;
const mockTabGroupsGet = (browser.tabGroups as any).get as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('hasCapturableTabs', () => {
  it('returns true when at least one non-system tab exists', async () => {
    mockTabsQuery.mockResolvedValue([
      { id: 1, url: 'https://example.com', title: 'Example' },
    ]);
    expect(await hasCapturableTabs()).toBe(true);
  });

  it('returns false when all tabs are system URLs', async () => {
    mockTabsQuery.mockResolvedValue([
      { id: 1, url: 'chrome://newtab/', title: 'New Tab' },
      { id: 2, url: 'about:blank', title: 'Blank' },
    ]);
    expect(await hasCapturableTabs()).toBe(false);
  });

  it('returns false when only the Firefox extension options page is open', async () => {
    // Regression: moz-extension:// must be treated as a system URL,
    // otherwise the Options page ends up captured in Firefox snapshots.
    mockTabsQuery.mockResolvedValue([
      { id: 1, url: 'moz-extension://abcd-1234/options.html', title: 'Options' },
    ]);
    expect(await hasCapturableTabs()).toBe(false);
  });

  it.each([
    ['chrome://', 'chrome://settings/'],
    ['chrome-extension://', 'chrome-extension://abc/popup.html'],
    ['moz-extension://', 'moz-extension://abc/options.html'],
    ['about:', 'about:preferences'],
    ['edge://', 'edge://newtab/'],
  ])('treats %s URLs as system URLs', async (_prefix, url) => {
    mockTabsQuery.mockResolvedValue([
      { id: 1, url, title: 'System page' },
      { id: 2, url: 'https://example.com', title: 'Real page' },
    ]);
    expect(await hasCapturableTabs()).toBe(true); // has at least one real tab
  });

  it('returns false when there are no tabs', async () => {
    mockTabsQuery.mockResolvedValue([]);
    expect(await hasCapturableTabs()).toBe(false);
  });
});

describe('captureCurrentTabs', () => {
  it('returns chromeGroupIdToSavedGroupId with correct mapping', async () => {
    mockTabsQuery.mockResolvedValue([
      { id: 10, index: 0, url: 'https://a.com', title: 'A', groupId: 5 },
      { id: 11, index: 1, url: 'https://b.com', title: 'B', groupId: 5 },
      { id: 12, index: 2, url: 'https://c.com', title: 'C', groupId: -1 },
    ]);
    mockTabGroupsGet.mockResolvedValue({ title: 'Work', color: 'blue' });

    const result = await captureCurrentTabs();

    expect(result.chromeGroupIdToSavedGroupId.size).toBe(1);
    expect(result.chromeGroupIdToSavedGroupId.has(5)).toBe(true);
    // The saved group UUID corresponds to an entry in groups
    const savedGroupId = result.chromeGroupIdToSavedGroupId.get(5);
    expect(result.groups.some(g => g.id === savedGroupId)).toBe(true);
  });

  it('does not include groupId -1 in chromeGroupIdToSavedGroupId', async () => {
    mockTabsQuery.mockResolvedValue([
      { id: 10, index: 0, url: 'https://a.com', title: 'A', groupId: -1 },
    ]);

    const result = await captureCurrentTabs();

    expect(result.chromeGroupIdToSavedGroupId.size).toBe(0);
    expect(result.ungroupedTabs).toHaveLength(1);
  });

  it('excludes groups whose tabs are all system URLs from chromeGroupIdToSavedGroupId', async () => {
    mockTabsQuery.mockResolvedValue([
      { id: 10, index: 0, url: 'chrome://settings/', title: 'Settings', groupId: 7 },
    ]);
    mockTabGroupsGet.mockResolvedValue({ title: 'System', color: 'grey' });

    const result = await captureCurrentTabs();

    // Group 7 has no capturable tabs, so it should not appear in the map
    expect(result.chromeGroupIdToSavedGroupId.has(7)).toBe(false);
    expect(result.groups).toHaveLength(0);
  });

  it('maps multiple groups independently', async () => {
    mockTabsQuery.mockResolvedValue([
      { id: 10, index: 0, url: 'https://a.com', title: 'A', groupId: 3 },
      { id: 11, index: 1, url: 'https://b.com', title: 'B', groupId: 4 },
    ]);
    mockTabGroupsGet
      .mockResolvedValueOnce({ title: 'Group A', color: 'red' })
      .mockResolvedValueOnce({ title: 'Group B', color: 'green' });

    const result = await captureCurrentTabs();

    expect(result.chromeGroupIdToSavedGroupId.size).toBe(2);
    expect(result.chromeGroupIdToSavedGroupId.has(3)).toBe(true);
    expect(result.chromeGroupIdToSavedGroupId.has(4)).toBe(true);

    const idA = result.chromeGroupIdToSavedGroupId.get(3);
    const idB = result.chromeGroupIdToSavedGroupId.get(4);
    expect(idA).not.toBe(idB);

    const groupA = result.groups.find(g => g.id === idA);
    const groupB = result.groups.find(g => g.id === idB);
    expect(groupA?.title).toBe('Group A');
    expect(groupB?.title).toBe('Group B');
  });

  it('returns numericIdToSavedTabId only for non-system tabs', async () => {
    mockTabsQuery.mockResolvedValue([
      { id: 10, index: 0, url: 'https://example.com', title: 'Example', groupId: -1 },
      { id: 11, index: 1, url: 'chrome://newtab/', title: 'New Tab', groupId: -1 },
    ]);

    const result = await captureCurrentTabs();

    expect(result.numericIdToSavedTabId.size).toBe(1);
    expect(result.ungroupedTabs).toHaveLength(1);
  });

  it('captures collapsed: true when Chrome group is collapsed [US-S016]', async () => {
    mockTabsQuery.mockResolvedValue([
      { id: 10, index: 0, url: 'https://a.com', title: 'A', groupId: 5 },
    ]);
    mockTabGroupsGet.mockResolvedValue({ title: 'Work', color: 'blue', collapsed: true });

    const result = await captureCurrentTabs();

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].collapsed).toBe(true);
  });

  it('captures collapsed: false when Chrome group is expanded [US-S016]', async () => {
    mockTabsQuery.mockResolvedValue([
      { id: 10, index: 0, url: 'https://a.com', title: 'A', groupId: 5 },
    ]);
    mockTabGroupsGet.mockResolvedValue({ title: 'Work', color: 'blue', collapsed: false });

    const result = await captureCurrentTabs();

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].collapsed).toBe(false);
  });

  it('defaults collapsed to false when Chrome group has no collapsed property [US-S016]', async () => {
    mockTabsQuery.mockResolvedValue([
      { id: 10, index: 0, url: 'https://a.com', title: 'A', groupId: 5 },
    ]);
    mockTabGroupsGet.mockResolvedValue({ title: 'Work', color: 'blue' });

    const result = await captureCurrentTabs();

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].collapsed).toBe(false);
  });

  it('normalizeColor : retourne la couleur inchangée si elle est valide', async () => {
    mockTabsQuery.mockResolvedValue([
      { id: 10, index: 0, url: 'https://a.com', title: 'A', groupId: 5 },
    ]);
    mockTabGroupsGet.mockResolvedValue({ title: 'Work', color: 'blue' });

    const result = await captureCurrentTabs();

    expect(result.groups[0].color).toBe('blue');
  });

  it('normalizeColor : retourne "grey" quand la couleur est invalide ou absente', async () => {
    mockTabsQuery.mockResolvedValue([
      { id: 10, index: 0, url: 'https://a.com', title: 'A', groupId: 5 },
    ]);
    mockTabGroupsGet.mockResolvedValue({ title: 'Work', color: 'not-a-valid-color' });

    const result = await captureCurrentTabs();

    expect(result.groups[0].color).toBe('grey');
  });

  it('ignore silencieusement un groupe si tabGroups.get rejette', async () => {
    mockTabsQuery.mockResolvedValue([
      { id: 10, index: 0, url: 'https://a.com', title: 'A', groupId: 5 },
    ]);
    mockTabGroupsGet.mockRejectedValue(new Error('Group no longer exists'));

    const result = await captureCurrentTabs();

    expect(result.groups).toHaveLength(0);
    expect(result.ungroupedTabs).toHaveLength(1);
    expect(result.ungroupedTabs[0].url).toBe('https://a.com');
  });

  it('excludes Firefox extension Options page from captured tabs', async () => {
    // Regression: moz-extension:// URLs were previously kept, so the Options
    // page itself showed up in the snapshot wizard and got auto-selected.
    mockTabsQuery.mockResolvedValue([
      { id: 10, index: 0, url: 'https://example.com', title: 'Example', groupId: -1 },
      { id: 11, index: 1, url: 'moz-extension://abcd-1234/options.html', title: 'SmartTab Options', groupId: -1 },
    ]);

    const result = await captureCurrentTabs();

    expect(result.ungroupedTabs).toHaveLength(1);
    expect(result.ungroupedTabs[0].url).toBe('https://example.com');
    expect(result.ungroupedTabs.some(t => t.url.startsWith('moz-extension://'))).toBe(false);
  });
});
