import { useCallback, useEffect, useRef, useState } from 'react';
import {
  computeImportCount,
  useImportClassification,
  type ConflictMode,
} from './Classification';
import { useDialogReset, type ToggleSetState } from './Shared';
import {
  useJsonSourceInput,
  type JsonSourceInputState,
  type JsonSourceValidationResult,
  type SourceMode,
} from './Source';

/**
 * Shape produced by every wizard's classify function. Each concrete classifier
 * (rules, sessions, ...) should map its native result onto these three buckets
 * so the shared shell and hook stay item-agnostic.
 */
export interface NormalizedClassification<TItem, TConflict> {
  newItems: TItem[];
  conflictingItems: TConflict[];
  identicalItems: TItem[];
}

interface UseImportWizardStateOptions<TItem extends { id: string }, TConflict> {
  open: boolean;
  existingItems: TItem[];
  validatePayload: (raw: unknown) => JsonSourceValidationResult<TItem[]>;
  classify: (
    imported: TItem[],
    existing: TItem[],
  ) => NormalizedClassification<TItem, TConflict>;
  /** Extra reset action triggered when the dialog is opened (e.g. async data load). */
  onReset?: () => void;
  /** Initial source mode forwarded to `useJsonSourceInput`. Defaults to `'file'`. */
  initialSourceMode?: SourceMode;
}

export interface ImportWizardState<TItem extends { id: string }, TConflict> {
  step: 0 | 1;
  source: JsonSourceInputState<TItem[]>;
  classification: NormalizedClassification<TItem, TConflict> | null;
  conflictMode: ConflictMode;
  setConflictMode: (mode: ConflictMode) => void;
  newSelection: ToggleSetState<string>;
  importCount: number;
  goToStep0: () => void;
  goToStep1: () => void;
}

/**
 * Orchestrates the state shared by every import wizard: step navigation,
 * JSON source parsing, classification of imported items against existing
 * ones, conflict-resolution mode, and selection of new items to import.
 *
 * Wizards keep their own `executeImport` since persistence (sync callback vs
 * async storage write) and conflict handling (uniqueness rules, etc.) differ.
 */
export function useImportWizardState<TItem extends { id: string }, TConflict>({
  open,
  existingItems,
  validatePayload,
  classify,
  onReset,
  initialSourceMode,
}: UseImportWizardStateOptions<TItem, TConflict>): ImportWizardState<TItem, TConflict> {
  const [step, setStep] = useState<0 | 1>(0);
  const source = useJsonSourceInput<TItem[]>(validatePayload, initialSourceMode);
  const classificationState = useImportClassification<NormalizedClassification<TItem, TConflict>>();
  const { classification, conflictMode, newSelection } = classificationState;

  const previousParsedDataRef = useRef<TItem[] | null>(null);

  useDialogReset(open, () => {
    setStep(0);
    source.reset();
    classificationState.reset();
    previousParsedDataRef.current = null;
    onReset?.();
  });

  const goToStep1 = useCallback(() => {
    if (!source.parsedData) return;
    const result = classify(source.parsedData, existingItems);
    classificationState.setClassification(result);
    newSelection.setAll(result.newItems.map((item) => item.id));
    setStep(1);
  }, [source.parsedData, existingItems, classify, classificationState, newSelection]);

  const goToStep0 = useCallback(() => setStep(0), []);

  useEffect(() => {
    const previousParsedData = previousParsedDataRef.current;
    previousParsedDataRef.current = source.parsedData;
    if (source.sourceMode !== 'pack') return;
    if (!source.parsedData) return;
    if (step !== 0) return;
    if (previousParsedData === source.parsedData) return;
    goToStep1();
  }, [source.sourceMode, source.parsedData, step, goToStep1]);

  const importCount = classification
    ? computeImportCount(
        classification.newItems,
        classification.conflictingItems.length,
        newSelection,
        conflictMode,
      )
    : 0;

  return {
    step,
    source,
    classification,
    conflictMode,
    setConflictMode: classificationState.setConflictMode,
    newSelection,
    importCount,
    goToStep0,
    goToStep1,
  };
}
