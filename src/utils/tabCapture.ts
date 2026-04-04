import { browser } from 'wxt/browser';
import { generateUUID } from './utils';
import type { SavedTab, SavedTabGroup } from '../types/session';
import type { TabTreeData, TabItem, TabGroupItem, ChromeGroupColor } from '../components/Core/TabTree/tabTreeTypes';

const SYSTEM_URL_PREFIXES = ['chrome://', 'chrome-extension://', 'about:', 'edge://'];

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
}

/**
 * Returns true if the current window contains at least one capturable tab
 * (i.e. a tab whose URL is not a system URL).
 */
export async function hasCapturableTabs(): Promise<boolean> {
  const tabs = await browser.tabs.query({ currentWindow: true });
  return tabs.some(tab => !isSystemUrl(tab.url));
}

/**
 * Capture the current window's tabs and groups.
 * Returns both TabTreeData (for display) and Session-ready data (for saving).
 */
export async function captureCurrentTabs(): Promise<CaptureResult> {
  const tabs = await browser.tabs.query({ currentWindow: true });
  // Sort by index to preserve tab order
  tabs.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  // Fetch tab groups
  const groupMap = new Map<number, { savedGroup: SavedTabGroup; treeGroup: TabGroupItem }>();
  const seenGroupIds = new Set<number>();

  for (const tab of tabs) {
    const groupId = (tab as any).groupId;
    if (typeof groupId === 'number' && groupId >= 0) {
      seenGroupIds.add(groupId);
    }
  }

  let numericCounter = 1;
  const numericIdToSavedTabId = new Map<number, string>();

  // Fetch group metadata
  for (const groupId of seenGroupIds) {
    try {
      const group = await (browser.tabGroups as any).get(groupId);
      const savedGroupId = generateUUID();
      const treeGroupId = numericCounter++;
      groupMap.set(groupId, {
        savedGroup: {
          id: savedGroupId,
          title: group.title || '',
          color: normalizeColor(group.color),
          tabs: [],
        },
        treeGroup: {
          id: treeGroupId,
          title: group.title || '',
          color: normalizeColor(group.color),
          tabs: [],
        },
      });
    } catch {
      // Group may no longer exist
    }
  }

  const ungroupedSavedTabs: SavedTab[] = [];
  const ungroupedTreeTabs: TabItem[] = [];

  for (const tab of tabs) {
    if (isSystemUrl(tab.url)) continue;

    const savedTabId = generateUUID();
    const numericId = numericCounter++;
    numericIdToSavedTabId.set(numericId, savedTabId);

    const savedTab: SavedTab = {
      id: savedTabId,
      title: tab.title || tab.url || '',
      url: tab.url || '',
      favIconUrl: tab.favIconUrl || undefined,
    };

    const treeTab: TabItem = {
      id: numericId,
      title: tab.title || tab.url || '',
      url: tab.url || '',
      favIconUrl: tab.favIconUrl || undefined,
    };

    const groupId = (tab as any).groupId;
    if (typeof groupId === 'number' && groupId >= 0 && groupMap.has(groupId)) {
      const entry = groupMap.get(groupId)!;
      entry.savedGroup.tabs.push(savedTab);
      entry.treeGroup.tabs.push(treeTab);
    } else {
      ungroupedSavedTabs.push(savedTab);
      ungroupedTreeTabs.push(treeTab);
    }
  }

  // Filter out groups with no tabs (all were system URLs)
  const savedGroups: SavedTabGroup[] = [];
  const treeGroups: TabGroupItem[] = [];
  for (const entry of groupMap.values()) {
    if (entry.savedGroup.tabs.length > 0) {
      savedGroups.push(entry.savedGroup);
      treeGroups.push(entry.treeGroup);
    }
  }

  return {
    treeData: { ungroupedTabs: ungroupedTreeTabs, groups: treeGroups },
    ungroupedTabs: ungroupedSavedTabs,
    groups: savedGroups,
    numericIdToSavedTabId,
  };
}
