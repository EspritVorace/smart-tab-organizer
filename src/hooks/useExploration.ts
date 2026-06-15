import { useCallback, useMemo } from 'react';
import { explorationProgressItem } from '@/utils/workspaceStorage.js';
import { logger } from '@/utils/logger.js';
import {
  defaultExplorationProgress,
  parseExplorationProgress,
  type ExplorationProgress,
} from '@/types/exploration.js';
import { useStorageState } from './useStorageState.js';
import { computeCoverage, type CoverageSummary } from '@/exploration/coverage.js';

export interface UseExplorationReturn {
  progress: ExplorationProgress;
  coverage: CoverageSummary;
  isLoaded: boolean;
  reload: () => Promise<void>;
}

/**
 * Read-only hook over the global exploration progress. Mutations go through the
 * `progressStore` helpers (`markDiscovered`/`setManualMark`/...), which write the
 * same storage item; this hook's `watch` picks those writes up. Coverage is
 * derived with `useMemo` in O(n), with no storage access at render.
 */
export function useExploration(): UseExplorationReturn {
  const load = useCallback(
    async () =>
      parseExplorationProgress(await explorationProgressItem.getValue(), (e) =>
        logger.warn('[EXPLORATION] Corrupt progress, using default:', e),
      ),
    [],
  );

  const watch = useCallback(
    (onChanged: (u: Partial<ExplorationProgress>) => void) =>
      explorationProgressItem.watch((v) =>
        onChanged(parseExplorationProgress(v, () => undefined)),
      ),
    [],
  );

  const save = useCallback(async (_updates: Partial<ExplorationProgress>, current: ExplorationProgress) => {
    await explorationProgressItem.setValue(current);
  }, []);

  const { value, isLoaded, reload } = useStorageState<ExplorationProgress>({
    load,
    watch,
    save,
    defaults: defaultExplorationProgress,
  });

  const progress = value ?? defaultExplorationProgress;
  const coverage = useMemo(() => computeCoverage(progress), [progress]);

  return { progress, coverage, isLoaded, reload };
}
