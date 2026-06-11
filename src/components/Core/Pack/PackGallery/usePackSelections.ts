import { useCallback, useMemo, useState } from 'react';
import type { ImportDomainRule } from '@/schemas/importExport';
import type { PackFile } from '@/schemas/pack';
import { resolvePackRules, type PackParamSelection } from '@/utils/packResolution.js';

export interface PackSelectionState {
  selected: boolean;
  rules: ImportDomainRule[];
}

/** Default param selection of a configurable pack (each param's `default`). */
function defaultParamSelection(pack: PackFile): PackParamSelection {
  const params = pack.pack.configurable?.params ?? [];
  return Object.fromEntries(params.map((param) => [param.id, param.default]));
}

/**
 * Build a pre-selection map (every pack selected) from a list of packs,
 * resolving configurable packs with their default params. Used by the
 * contextual onboarding hero to pre-fill the import wizard.
 */
export function buildPackSelections(
  packs: PackFile[],
): Record<string, PackSelectionState> {
  const result: Record<string, PackSelectionState> = {};
  for (const pack of packs) {
    result[pack.pack.id] = {
      selected: true,
      rules: resolvePackRules(pack, defaultParamSelection(pack)),
    };
  }
  return result;
}

export interface PackSelectionsHook {
  selections: Record<string, PackSelectionState>;
  setPackSelection: (packId: string, next: PackSelectionState) => void;
  reset: () => void;
  totals: { packCount: number; ruleCount: number };
}

export function usePackSelections(
  initialSelections?: Record<string, PackSelectionState>,
): PackSelectionsHook {
  const [selections, setSelections] = useState<Record<string, PackSelectionState>>(
    () => ({ ...(initialSelections ?? {}) }),
  );

  const setPackSelection = useCallback((packId: string, next: PackSelectionState) => {
    setSelections((prev) => ({ ...prev, [packId]: next }));
  }, []);

  // `reset` restores the initial pre-selection (used when the wizard reopens),
  // not an empty map, so a hero-initiated pre-selection survives the dialog
  // reset triggered on open.
  const reset = useCallback(
    () => setSelections({ ...(initialSelections ?? {}) }),
    [initialSelections],
  );

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
