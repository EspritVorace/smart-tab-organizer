import { useCallback, useMemo, useState } from 'react';
import type { ImportDomainRule } from '@/schemas/importExport';

export interface PackSelectionState {
  selected: boolean;
  rules: ImportDomainRule[];
}

export interface PackSelectionsHook {
  selections: Record<string, PackSelectionState>;
  setPackSelection: (packId: string, next: PackSelectionState) => void;
  reset: () => void;
  totals: { packCount: number; ruleCount: number };
}

export function usePackSelections(): PackSelectionsHook {
  const [selections, setSelections] = useState<Record<string, PackSelectionState>>({});

  const setPackSelection = useCallback((packId: string, next: PackSelectionState) => {
    setSelections((prev) => ({ ...prev, [packId]: next }));
  }, []);

  const reset = useCallback(() => setSelections({}), []);

  const totals = useMemo(() => {
    const values = Object.values(selections);
    const selectedPacks = values.filter((s) => s.selected);
    return {
      packCount: selectedPacks.length,
      ruleCount: selectedPacks.reduce((sum, s) => sum + s.rules.length, 0),
    };
  }, [selections]);

  return { selections, setPackSelection, reset, totals };
}
