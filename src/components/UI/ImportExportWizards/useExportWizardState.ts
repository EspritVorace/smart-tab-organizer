import { useCallback, useState } from 'react';
import { useDialogReset, useToggleSet, type ToggleSetState } from './Shared';
import { useExportActions, type ExportActions } from './Export';

interface UseExportWizardStateOptions<TItem extends { id: string }> {
  open: boolean;
  /** Sync items source (e.g. domain rules from props). Mutually exclusive with `loadItems`. */
  items?: TItem[];
  /** Async loader called when the dialog opens (e.g. `loadSessions`). */
  loadItems?: () => Promise<TItem[]>;
  /**
   * Optional pre-selection applied on dialog open. Invalid ids (not in
   * the resolved items) are filtered out. When omitted or empty, all
   * items are selected (historical default).
   */
  initialSelectedIds?: string[];
  /** JSON top-level key wrapping the selected items (e.g. "domainRules", "sessions"). */
  payloadKey: string;
  filename: string;
  notifyTitleKey: string;
  notifyMessage: string | ((count: number) => string);
  onFinish: () => void;
}

export interface ExportWizardState<TItem extends { id: string }> {
  items: TItem[];
  selection: ToggleSetState<string>;
  selectedItems: TItem[];
  exportNote: string;
  setExportNote: (note: string) => void;
  selectAll: () => void;
  actions: ExportActions;
}

/**
 * Orchestrates the state shared by every export wizard: selection, optional
 * note, JSON serialization in the standard `{[payloadKey]: items, note?}`
 * envelope, and the file/clipboard export actions. Each wizard plugs in its
 * own list rendering since layouts diverge (flat list vs grouped sections).
 *
 * Pass `items` for sync sources or `loadItems` for async ones; the latter
 * triggers an async load on dialog open and seeds the selection from the
 * loaded ids.
 */
export function useExportWizardState<TItem extends { id: string }>({
  open,
  items: providedItems,
  loadItems,
  initialSelectedIds,
  payloadKey,
  filename,
  notifyTitleKey,
  notifyMessage,
  onFinish,
}: UseExportWizardStateOptions<TItem>): ExportWizardState<TItem> {
  const [loadedItems, setLoadedItems] = useState<TItem[]>([]);
  const items = providedItems ?? loadedItems;
  const selection = useToggleSet<string>();
  const [exportNote, setExportNote] = useState('');

  const applySelection = useCallback((resolved: TItem[]) => {
    if (initialSelectedIds && initialSelectedIds.length > 0) {
      const validIds = initialSelectedIds.filter((id) =>
        resolved.some((item) => item.id === id),
      );
      selection.setAll(
        validIds.length > 0 ? validIds : resolved.map((item) => item.id),
      );
    } else {
      selection.setAll(resolved.map((item) => item.id));
    }
  }, [initialSelectedIds, selection]);

  useDialogReset(open, () => {
    setExportNote('');
    if (loadItems) {
      loadItems().then((loaded) => {
        setLoadedItems(loaded);
        applySelection(loaded);
      });
    } else if (providedItems) {
      applySelection(providedItems);
    }
  });

  const selectAll = useCallback(() => {
    selection.setAll(items.map((item) => item.id));
  }, [items, selection]);

  const selectedItems = items.filter((item) => selection.has(item.id));

  const buildJson = useCallback(() => {
    const data: Record<string, unknown> = { [payloadKey]: selectedItems };
    if (exportNote.trim()) data.note = exportNote.trim();
    return JSON.stringify(data, null, 2);
  }, [selectedItems, exportNote, payloadKey]);

  const actions = useExportActions({
    filename,
    notifyTitleKey,
    notifyMessage,
    selected: selectedItems,
    note: exportNote,
    buildJson,
    onFinish,
  });

  return {
    items,
    selection,
    selectedItems,
    exportNote,
    setExportNote,
    selectAll,
    actions,
  };
}
