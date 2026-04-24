import { useCallback, useState } from 'react';
import { useToggleSet, type ToggleSetState } from '@/components/UI/ImportExportWizards/Shared';

export type ConflictMode = 'overwrite' | 'duplicate' | 'ignore';

/**
 * Calcule le nombre d'items qui seront effectivement importes :
 * items nouveaux selectionnes + items conflictuels (selon le mode).
 *
 * Extrait pour eviter la duplication entre ImportWizard et ImportSessionsWizard.
 */
export function computeImportCount(
  newItems: { id?: string }[],
  conflictingItemsCount: number,
  selection: ToggleSetState<string>,
  conflictMode: ConflictMode,
): number {
  const newCount = newItems.filter((item) => item.id !== undefined && selection.has(item.id)).length;
  const conflictCount = conflictMode === 'ignore' ? 0 : conflictingItemsCount;
  return newCount + conflictCount;
}

export interface ImportClassificationState<TClassification> {
  classification: TClassification | null;
  setClassification: (c: TClassification | null) => void;
  conflictMode: ConflictMode;
  setConflictMode: (m: ConflictMode) => void;
  newSelection: ToggleSetState<string>;
  reset: () => void;
}

/**
 * Groups the three pieces of state shared by every import wizard step 1:
 * the computed classification payload, the conflict resolution mode, and
 * the checkbox selection over new items.
 *
 * The classification payload stays generic so each wizard keeps its own
 * typed `classifyImported*` result without losing type safety.
 */
export function useImportClassification<TClassification>(): ImportClassificationState<TClassification> {
  const [classification, setClassification] = useState<TClassification | null>(null);
  const [conflictMode, setConflictMode] = useState<ConflictMode>('overwrite');
  const newSelection = useToggleSet<string>();

  const reset = useCallback(() => {
    setClassification(null);
    setConflictMode('overwrite');
    newSelection.clearAll();
  }, [newSelection]);

  return {
    classification,
    setClassification,
    conflictMode,
    setConflictMode,
    newSelection,
    reset,
  };
}
