import { flattenTree } from 'react-accessible-treeview';
import { TabTreeData, TabNodeMetadata, TreeViewBuildResult } from '@/types/tabTree';

/** Chrome tab group color → CSS hex color */
export const chromeGroupColors: Record<string, string> = {
  grey: '#5f6368',
  blue: '#1a73e8',
  red: '#d93025',
  yellow: '#f9ab00',
  green: '#188038',
  pink: '#d01884',
  purple: '#a142f4',
  cyan: '#007b83',
  orange: '#fa903e',
};

/**
 * Extract domain from a URL string.
 * Returns the hostname or a fallback if parsing fails.
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Count total tabs (excluding groups) in the tree data */
export function countTotalTabs(data: TabTreeData): number {
  const groupedCount = data.groups.reduce((sum, g) => sum + g.tabs.length, 0);
  return data.ungroupedTabs.length + groupedCount;
}

/**
 * Convert our business TabTreeData into the flat format expected by react-accessible-treeview.
 * Also builds bidirectional ID maps between tree IDs and our tab IDs.
 */
export function buildTreeViewData(data: TabTreeData): TreeViewBuildResult {
  const hierarchical = {
    name: '',
    children: [
      ...data.groups.map((group) => ({
        name: group.title,
        metadata: {
          type: 'group' as const,
          color: group.color,
          groupId: group.id,
        },
        children: group.tabs.map((tab) => ({
          name: tab.title,
          metadata: {
            type: 'tab' as const,
            tabId: tab.id,
            url: tab.url,
            favIconUrl: tab.favIconUrl ?? '',
          },
        })),
      })),
      ...data.ungroupedTabs.map((tab) => ({
        name: tab.title,
        metadata: {
          type: 'tab' as const,
          tabId: tab.id,
          url: tab.url,
          favIconUrl: tab.favIconUrl ?? '',
        },
      })),
    ],
  };

  const flatData = flattenTree<TabNodeMetadata>(hierarchical);

  const treeIdToTabId = new Map<number, number>();
  const tabIdToTreeId = new Map<number, number>();
  const allTabTreeIds = new Set<number>();

  for (const node of flatData) {
    if (node.metadata?.type === 'tab' && node.metadata.tabId != null) {
      const treeId = node.id as number;
      const tabId = node.metadata.tabId as number;
      treeIdToTabId.set(treeId, tabId);
      tabIdToTreeId.set(tabId, treeId);
      allTabTreeIds.add(treeId);
    }
  }

  return { flatData, treeIdToTabId, tabIdToTreeId, allTabTreeIds };
}
