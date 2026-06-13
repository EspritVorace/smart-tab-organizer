import { explorationProgressSchema, type ExplorationProgressSchema } from '@/schemas/exploration.js';

/** Persisted exploration progress (see `explorationProgressSchema`). */
export type ExplorationProgress = ExplorationProgressSchema;

/** Default empty progress. `initializedAt` is stamped lazily on first init. */
export const defaultExplorationProgress: ExplorationProgress = {
  discovered: [],
  manuallyMarked: [],
  values: {},
  initializedAt: 0,
};

/**
 * Parses an unknown storage payload into a valid `ExplorationProgress`, falling
 * back to the default on validation failure. Mirrors the safeParse + fallback
 * pattern used by `sessionStorage.ts:loadBucket`. The `onError` callback lets
 * callers log a warning without coupling this module to the logger.
 */
export function parseExplorationProgress(
  raw: unknown,
  onError?: (error: unknown) => void,
): ExplorationProgress {
  const parsed = explorationProgressSchema.safeParse(raw ?? undefined);
  if (parsed.success) return parsed.data;
  onError?.(parsed.error);
  return { ...defaultExplorationProgress, initializedAt: Date.now() };
}

/** Display state of a catalogue entry, derived at render (never persisted). */
export type EntryDisplayState = 'discovered' | 'to-discover' | 'not-possible';

/** Where a discovered entry's state came from. */
export type DiscoveryProvenance = 'auto' | 'manual' | 'both';
