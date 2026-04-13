import { INode } from 'react-accessible-treeview';

/** A tab in the tree */
export interface TabItem {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

/** Chrome tab group colors */
export type ChromeGroupColor =
  | 'grey'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'green'
  | 'pink'
  | 'purple'
  | 'cyan'
  | 'orange';

/** A Chrome tab group */
export interface TabGroupItem {
  id: number;
  title: string;
  color: ChromeGroupColor;
  tabs: TabItem[];
}

/** Input data for the TabTree component */
export interface TabTreeData {
  /** Tabs that don't belong to any group — displayed at root level */
  ungroupedTabs: TabItem[];
  /** Tab groups with their child tabs */
  groups: TabGroupItem[];
}

/**
 * Metadata stored on each tree node.
 * Uses index signature to satisfy react-accessible-treeview's IFlatMetadata constraint.
 */
export type TabNodeMetadata = {
  [key: string]: string | number | boolean | undefined | null;
  type: 'group' | 'tab';
  tabId?: number;
  groupId?: number;
  url?: string;
  favIconUrl?: string;
  color?: string;
};

/** Result of buildTreeViewData */
export interface TreeViewBuildResult {
  /** Flattened data for react-accessible-treeview */
  flatData: INode<TabNodeMetadata>[];
  /** Map from tree internal ID to our tab ID */
  treeIdToTabId: Map<number, number>;
  /** Map from our tab ID to tree internal ID */
  tabIdToTreeId: Map<number, number>;
  /** All tree IDs that represent tab nodes (not groups) */
  allTabTreeIds: Set<number>;
}

/** Props for the TabTree component */
export interface TabTreeProps {
  /** Tree data */
  data: TabTreeData;
  /** IDs of tabs (our business tabId) currently selected */
  selectedTabIds: Set<number>;
  /** Callback when selection changes — receives business tabIds, not internal tree IDs */
  onSelectionChange: (selectedTabIds: Set<number>) => void;
  /** Optional callback on tab click (e.g., to open it) */
  onTabClick?: (tab: TabItem) => void;
  /** Optional max height — if set, content scrolls via Radix ScrollArea */
  maxHeight?: number | string;
}
