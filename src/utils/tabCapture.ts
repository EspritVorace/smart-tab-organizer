import { browser } from 'wxt/browser';
import { generateUUID } from './utils';
import type { SavedTab, SavedTabGroup } from '@/types/session';
import type { TabTreeData, TabItem, TabGroupItem, ChromeGroupColor } from '@/types/tabTree';
import type { ChromeTab, ChromeTabGroupsExtended } from '@/types/chromeApi';

const SYSTEM_URL_PREFIXES = ['chrome://', 'chrome-extension://', 'moz-extension://', 'about:', 'edge://'];

const VALID_COLORS: ChromeGroupColor[] = [
  'grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange',
];

function isSystemUrl(url: string | undefined): boolean {
  if (!url) return true;
  return SYSTEM_URL_PREFIXES.some(prefix => url.startsWith(prefix));
}

function normalizeColor(color: string | undefined): ChromeGroupColor {
  if (color && VALID_COLORS.includes(color as ChromeGroupColor)) {
    return color as ChromeGroupColor;
  }
  return 'grey';
}

interface CaptureResult {
  /** TabTreeData for displaying in TabTree component */
  treeData: TabTreeData;
  /** SavedTab/SavedTabGroup data for creating a session */
  ungroupedTabs: SavedTab[];
  groups: SavedTabGroup[];
  /** Map from numeric TabTree ID to SavedTab UUID */
  numericIdToSavedTabId: Map<number, string>;
  /** Map from Chrome's numeric groupId to SavedTabGroup UUID */
  chromeGroupIdToSavedGroupId: Map<number, string>;
}

/**
 * Returns true if the current window contains at least one capturable tab
 * (i.e. a tab whose URL is not a system URL).
 */
export async function hasCapturableTabs(): Promise<boolean> {
  const tabs = await browser.tabs.query({ currentWindow: true });
  return tabs.some(tab => !isSystemUrl(tab.url));
}

interface GroupEntry {
  savedGroup: SavedTabGroup;
  treeGroup: TabGroupItem;
}

function collectChromeGroupIds(tabs: ChromeTab[]): Set<number> {
  const seen = new Set<number>();
  for (const tab of tabs) {
    const groupId = tab.groupId;
    if (typeof groupId === 'number' && groupId >= 0) {
      seen.add(groupId);
    }
  }
  return seen;
}

/**
 * Fetch metadata for each Chrome group referenced by `tabs` and build
 * matching saved/tree group entries. Numeric tree IDs start at
 * `startingNumericId` and increment by one per successfully fetched group.
 * Groups that no longer exist are silently skipped.
 */
async function fetchChromeGroups(
  tabs: ChromeTab[],
  startingNumericId: number,
): Promise<{ groupMap: Map<number, GroupEntry>; nextNumericId: number }> {
  const groupMap = new Map<number, GroupEntry>();
  let numericCounter = startingNumericId;

  for (const groupId of collectChromeGroupIds(tabs)) {
    try {
      const group = await (browser.tabGroups as unknown as ChromeTabGroupsExtended).get(groupId);
      const savedGroupId = generateUUID();
      const treeGroupId = numericCounter++;
      const color = normalizeColor(group.color);
      const title = group.title || '';
      groupMap.set(groupId, {
        savedGroup: {
          id: savedGroupId,
          title,
          color,
          tabs: [],
          collapsed: group.collapsed || false,
        },
        treeGroup: {
          id: treeGroupId,
          title,
          color,
          tabs: [],
        },
      });
    } catch {
      // Group may no longer exist
    }
  }

  return { groupMap, nextNumericId: numericCounter };
}

/**
 * Build a SavedTab and a parallel TabItem from a single Chrome tab,
 * sharing title/url/favIconUrl while keeping their respective ID schemes.
 */
function mapBrowserTabToSavedTab(
  tab: ChromeTab,
  savedTabId: string,
  numericId: number,
): { savedTab: SavedTab; treeTab: TabItem } {
  const title = tab.title || tab.url || '';
  const url = tab.url || '';
  const favIconUrl = tab.favIconUrl || undefined;
  return {
    savedTab: { id: savedTabId, title, url, favIconUrl },
    treeTab: { id: numericId, title, url, favIconUrl },
  };
}

function resolveGroupEntry(
  tab: ChromeTab,
  groupMap: Map<number, GroupEntry>,
): GroupEntry | undefined {
  const groupId = tab.groupId;
  if (typeof groupId !== 'number' || groupId < 0) return undefined;
  return groupMap.get(groupId);
}

/**
 * Distribute non-system tabs into their resolved Chrome groups (mutating
 * each entry's `tabs` array) and accumulate the ungrouped ones plus the
 * numeric→UUID mapping needed by the TabTree component.
 */
function groupTabsByChromeGroup(
  tabs: ChromeTab[],
  groupMap: Map<number, GroupEntry>,
  startingNumericId: number,
): {
  ungroupedSavedTabs: SavedTab[];
  ungroupedTreeTabs: TabItem[];
  numericIdToSavedTabId: Map<number, string>;
} {
  const ungroupedSavedTabs: SavedTab[] = [];
  const ungroupedTreeTabs: TabItem[] = [];
  const numericIdToSavedTabId = new Map<number, string>();
  let numericCounter = startingNumericId;

  for (const tab of tabs) {
    if (isSystemUrl(tab.url)) continue;

    const savedTabId = generateUUID();
    const numericId = numericCounter++;
    numericIdToSavedTabId.set(numericId, savedTabId);

    const { savedTab, treeTab } = mapBrowserTabToSavedTab(tab, savedTabId, numericId);
    const entry = resolveGroupEntry(tab, groupMap);
    if (entry) {
      entry.savedGroup.tabs.push(savedTab);
      entry.treeGroup.tabs.push(treeTab);
    } else {
      ungroupedSavedTabs.push(savedTab);
      ungroupedTreeTabs.push(treeTab);
    }
  }

  return { ungroupedSavedTabs, ungroupedTreeTabs, numericIdToSavedTabId };
}

/**
 * Filter out groups whose tabs were all system URLs and return the
 * surviving saved/tree groups plus the chrome→saved id mapping.
 */
function collectNonEmptyGroups(groupMap: Map<number, GroupEntry>): {
  savedGroups: SavedTabGroup[];
  treeGroups: TabGroupItem[];
  chromeGroupIdToSavedGroupId: Map<number, string>;
} {
  const savedGroups: SavedTabGroup[] = [];
  const treeGroups: TabGroupItem[] = [];
  const chromeGroupIdToSavedGroupId = new Map<number, string>();
  for (const [chromeId, entry] of groupMap) {
    if (entry.savedGroup.tabs.length > 0) {
      savedGroups.push(entry.savedGroup);
      treeGroups.push(entry.treeGroup);
      chromeGroupIdToSavedGroupId.set(chromeId, entry.savedGroup.id);
    }
  }
  return { savedGroups, treeGroups, chromeGroupIdToSavedGroupId };
}

/**
 * Capture the current window's tabs and groups.
 * Returns both TabTreeData (for display) and Session-ready data (for saving).
 */
export async function captureCurrentTabs(): Promise<CaptureResult> {
  const tabs = (await browser.tabs.query({ currentWindow: true })) as ChromeTab[];
  tabs.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  const { groupMap, nextNumericId } = await fetchChromeGroups(tabs, 1);
  const { ungroupedSavedTabs, ungroupedTreeTabs, numericIdToSavedTabId } =
    groupTabsByChromeGroup(tabs, groupMap, nextNumericId);
  const { savedGroups, treeGroups, chromeGroupIdToSavedGroupId } = collectNonEmptyGroups(groupMap);

  return {
    treeData: { ungroupedTabs: ungroupedTreeTabs, groups: treeGroups },
    ungroupedTabs: ungroupedSavedTabs,
    groups: savedGroups,
    numericIdToSavedTabId,
    chromeGroupIdToSavedGroupId,
  };
}
