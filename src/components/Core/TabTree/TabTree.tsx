import React, { useMemo, useCallback } from 'react';
import TreeView, { INodeRendererProps, NodeId } from 'react-accessible-treeview';
import { Flex, Text, Button, Box, Checkbox, ScrollArea } from '@radix-ui/themes';
import { getMessage } from '../../../utils/i18n';
import { TabTreeProps, TabItem, ChromeGroupColor } from './tabTreeTypes';
import { buildTreeViewData, extractDomain, countTotalTabs } from './tabTreeUtils';
import { TabRowBase } from './TabRowBase';
import { GroupRowBase } from './GroupRowBase';

/**
 * TabTree — reusable tree component for displaying Chrome tabs and tab groups
 * with multi-select checkboxes. Used for both snapshot (save) and restore flows.
 *
 * @example Snapshot mode (data from browser.tabs.query + browser.tabGroups.query):
 * ```tsx
 * const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
 * <TabTree
 *   data={{ ungroupedTabs: [...], groups: [...] }}
 *   selectedTabIds={selectedIds}
 *   onSelectionChange={setSelectedIds}
 * />
 * ```
 *
 * @example Restore mode (data from a saved session in storage):
 * ```tsx
 * <TabTree
 *   data={savedSession.tabTreeData}
 *   selectedTabIds={selectedIds}
 *   onSelectionChange={setSelectedIds}
 *   onTabClick={(tab) => browser.tabs.create({ url: tab.url })}
 * />
 * ```
 */
export function TabTree({ data, selectedTabIds, onSelectionChange, onTabClick, maxHeight }: TabTreeProps) {
  const { flatData, treeIdToTabId, tabIdToTreeId } = useMemo(
    () => buildTreeViewData(data),
    [data]
  );

  const totalTabs = useMemo(() => countTotalTabs(data), [data]);

  // Convert our business selectedTabIds → tree internal IDs for the controlled prop.
  // Must also include group tree IDs when all their children are selected,
  // otherwise propagateSelectUpwards fights with the controlled state and causes a render loop.
  const selectedTreeIds = useMemo(() => {
    const ids = new Set<NodeId>();
    for (const tabId of selectedTabIds) {
      const treeId = tabIdToTreeId.get(tabId);
      if (treeId != null) ids.add(treeId);
    }
    // Add group IDs when all their tab children are selected
    for (const node of flatData) {
      if (node.metadata?.type === 'group' && node.children.length > 0) {
        const allChildrenSelected = node.children.every((childId) => ids.has(childId));
        if (allChildrenSelected) {
          ids.add(node.id);
        }
      }
    }
    return Array.from(ids);
  }, [selectedTabIds, tabIdToTreeId, flatData]);

  // Default expand all groups
  const defaultExpandedIds = useMemo(() => {
    return flatData
      .filter((node) => node.metadata?.type === 'group')
      .map((node) => node.id);
  }, [flatData]);

  const handleSelect = useCallback(
    (props: { treeState: { selectedIds: Set<NodeId> } }) => {
      const newSelectedTabIds = new Set<number>();
      for (const treeId of props.treeState.selectedIds) {
        const tabId = treeIdToTabId.get(treeId as number);
        if (tabId != null) newSelectedTabIds.add(tabId);
      }
      onSelectionChange(newSelectedTabIds);
    },
    [treeIdToTabId, onSelectionChange]
  );

  const allSelected = selectedTabIds.size === totalTabs && totalTabs > 0;

  const handleToggleAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      const all = new Set<number>();
      for (const tabId of treeIdToTabId.values()) {
        all.add(tabId);
      }
      onSelectionChange(all);
    }
  }, [allSelected, onSelectionChange, treeIdToTabId]);

  const nodeRenderer = useCallback(
    (props: INodeRendererProps) => {
      const {
        element,
        getNodeProps,
        isSelected,
        isHalfSelected,
        isExpanded,
        level,
        handleSelect: nodeHandleSelect,
        handleExpand,
      } = props;
      const meta = element.metadata;
      const isGroup = meta?.type === 'group';

      const nodeProps = getNodeProps({ onClick: nodeHandleSelect });
      const checkboxState: boolean | 'indeterminate' = isHalfSelected ? 'indeterminate' : isSelected;

      return (
        <div
          {...nodeProps}
          style={{
            borderRadius: 'var(--radius-2)',
            cursor: 'pointer',
          }}
        >
          {isGroup ? (
            <GroupRowBase
              color={(meta?.color as ChromeGroupColor) ?? 'grey'}
              title={element.name}
              tabCount={element.children.length}
              isExpanded={isExpanded}
              onToggleExpand={() => {
                const synthEvent = { stopPropagation: () => {} } as React.MouseEvent;
                handleExpand(synthEvent);
              }}
              level={level}
              leftSlot={
                <Checkbox
                  checked={checkboxState}
                  aria-label={getMessage('tabTreeSelectGroup', [element.name])}
                  size="2"
                  tabIndex={-1}
                  style={{ pointerEvents: 'none' }}
                />
              }
            />
          ) : (
            <TabRowBase
              favIconUrl={String(meta?.favIconUrl ?? '') || undefined}
              title={element.name}
              domain={meta?.url ? extractDomain(String(meta.url)) : ''}
              fullUrl={String(meta?.url ?? '')}
              level={level}
              leftSlot={
                <Checkbox
                  checked={checkboxState}
                  aria-label={getMessage('tabTreeSelectTab', [element.name])}
                  size="2"
                  tabIndex={-1}
                  style={{ pointerEvents: 'none', flexShrink: 0 }}
                />
              }
              onTitleClick={
                onTabClick
                  ? () => {
                      onTabClick({
                        id: Number(meta?.tabId),
                        title: element.name,
                        url: String(meta?.url ?? ''),
                        favIconUrl: String(meta?.favIconUrl ?? '') || undefined,
                      });
                    }
                  : undefined
              }
            />
          )}
        </div>
      );
    },
    [onTabClick]
  );

  const treeContent = (
    <Box data-testid="tab-tree">
      {/* Action bar */}
      <Flex justify="between" align="center" gap="2" style={{ marginBottom: 'var(--space-2)' }}>
        <Button
          variant="ghost"
          size="1"
          onClick={handleToggleAll}
        >
          {allSelected ? getMessage('deselectAll') : getMessage('selectAll')}
        </Button>
        <Text size="1" color="gray">
          {getMessage('tabTreeSelectedCount', [String(selectedTabIds.size), String(totalTabs)])}
        </Text>
      </Flex>

      {/* Tree */}
      <TreeView
        data={flatData}
        nodeRenderer={nodeRenderer}
        multiSelect
        propagateSelect
        propagateSelectUpwards
        togglableSelect
        selectedIds={selectedTreeIds}
        defaultExpandedIds={defaultExpandedIds}
        onSelect={handleSelect}
        nodeAction="check"
      />
    </Box>
  );

  if (maxHeight) {
    return (
      <ScrollArea style={{ maxHeight }} scrollbars="vertical">
        {treeContent}
      </ScrollArea>
    );
  }

  return treeContent;
}
