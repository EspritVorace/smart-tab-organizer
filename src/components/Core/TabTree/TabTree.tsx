import React, { useMemo, useCallback } from 'react';
import TreeView, { INodeRendererProps, NodeId } from 'react-accessible-treeview';
import { Flex, Text, Button, Box, Checkbox, Tooltip, ScrollArea } from '@radix-ui/themes';
import { ChevronRight, ChevronDown, Globe } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { TabTreeProps, TabItem } from './tabTreeTypes';
import { buildTreeViewData, chromeGroupColors, extractDomain, countTotalTabs } from './tabTreeUtils';

/**
 * TabTree — reusable tree component for displaying Chrome tabs and tab groups
 * with multi-select checkboxes. Used for both snapshot (save) and restore flows.
 *
 * @example Snapshot mode (data from chrome.tabs.query + chrome.tabGroups.query):
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
 *   onTabClick={(tab) => chrome.tabs.create({ url: tab.url })}
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
      const { element, getNodeProps, isSelected, isHalfSelected, isExpanded, level, handleSelect: nodeHandleSelect, handleExpand } = props;
      const meta = element.metadata;
      const isGroup = meta?.type === 'group';

      const nodeProps = getNodeProps({ onClick: nodeHandleSelect });

      const checkboxState: boolean | 'indeterminate' = isHalfSelected ? 'indeterminate' : isSelected;

      return (
        <div
          {...nodeProps}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            paddingLeft: (level - 1) * 20,
            paddingTop: 'var(--space-1)',
            paddingBottom: 'var(--space-1)',
            paddingRight: 'var(--space-2)',
            borderRadius: 'var(--radius-2)',
            cursor: 'pointer',
            minHeight: 32,
          }}
          className=""
        >
          {isGroup ? (
            <GroupNode
              element={element}
              isExpanded={isExpanded}
              checkboxState={checkboxState}
              onExpand={handleExpand}
            />
          ) : (
            <TabNode
              element={element}
              checkboxState={checkboxState}
              onTabClick={onTabClick}
            />
          )}
        </div>
      );
    },
    [onTabClick]
  );

  const treeContent = (
    <Box>
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

/* ─── Sub-components ─── */

interface GroupNodeProps {
  element: INodeRendererProps['element'];
  isExpanded: boolean;
  checkboxState: boolean | 'indeterminate';
  onExpand: INodeRendererProps['handleExpand'];
}

function GroupNode({ element, isExpanded, checkboxState, onExpand }: GroupNodeProps) {
  const meta = element.metadata;
  const colorHex = chromeGroupColors[String(meta?.color ?? 'grey')] ?? chromeGroupColors.grey;
  const childCount = element.children.length;

  return (
    <>
      <Checkbox
        checked={checkboxState}
        aria-label={getMessage('tabTreeSelectGroup', [element.name])}
        size="2"
        tabIndex={-1}
        style={{ pointerEvents: 'none' }}
      />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onExpand(e as any); }}
        style={{
          all: 'unset',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        aria-label={isExpanded ? getMessage('tabTreeCollapseGroup', [element.name]) : getMessage('tabTreeExpandGroup', [element.name])}
      >
        {isExpanded
          ? <ChevronDown size={14} aria-hidden="true" style={{ color: 'var(--gray-9)' }} />
          : <ChevronRight size={14} aria-hidden="true" style={{ color: 'var(--gray-9)' }} />
        }
      </button>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: colorHex,
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <Text size="2" weight="bold" style={{ whiteSpace: 'nowrap' }}>
        {element.name}
      </Text>
      <Text size="1" color="gray">
        ({childCount})
      </Text>
    </>
  );
}

interface TabNodeProps {
  element: INodeRendererProps['element'];
  checkboxState: boolean | 'indeterminate';
  onTabClick?: (tab: TabItem) => void;
}

function TabNode({ element, checkboxState, onTabClick }: TabNodeProps) {
  const meta = element.metadata;
  const url = String(meta?.url ?? '');
  const favIconUrl = String(meta?.favIconUrl ?? '');
  const domain = url ? extractDomain(url) : '';

  const handleTabClick = onTabClick
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        onTabClick({
          id: Number(meta?.tabId),
          title: element.name,
          url,
          favIconUrl: favIconUrl || undefined,
        });
      }
    : undefined;

  return (
    <Tooltip content={url}>
      <Flex align="center" gap="2" style={{ overflow: 'hidden', flex: 1 }}>
        <Checkbox
          checked={checkboxState}
          aria-label={getMessage('tabTreeSelectTab', [element.name])}
          size="2"
          tabIndex={-1}
          style={{ pointerEvents: 'none', flexShrink: 0 }}
        />
        {favIconUrl ? (
          <img
            src={favIconUrl}
            alt=""
            width={16}
            height={16}
            style={{ flexShrink: 0, borderRadius: 2 }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        {!favIconUrl && (
          <Globe size={16} aria-hidden="true" style={{ flexShrink: 0, color: 'var(--gray-8)' }} />
        )}
        <Flex direction="column" style={{ overflow: 'hidden', flex: 1, gap: 0 }}>
          <Text
            size="2"
            weight="bold"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: handleTabClick ? 'pointer' : undefined,
            }}
            onClick={handleTabClick}
          >
            {element.name}
          </Text>
          {domain && (
            <Text
              size="1"
              color="gray"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {domain}
            </Text>
          )}
        </Flex>
      </Flex>
    </Tooltip>
  );
}
