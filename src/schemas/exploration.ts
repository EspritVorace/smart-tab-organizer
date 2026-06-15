import { z } from 'zod';

/**
 * Persisted exploration progress (US-A001). A flat structure of flags and
 * arrays of distinct values, never a volume counter. Stored under the GLOBAL
 * (user-level, not workspace-scoped) key `local:explorationProgress`.
 *
 * - `discovered`: ids discovered automatically. Idempotent, append-only.
 * - `manuallyMarked`: ids the user self-declared as known (US-A017). Reversible.
 * - `values`: distinct values seen for multi-valued capabilities (e.g. the set
 *   of group colors used, dedup match modes, pack categories opened).
 * - `initializedAt`: epoch ms set once, the first time the module initializes.
 *
 * Every field uses `.default()` so future catalogue additions (and a storage
 * payload written by an older version) deserialize without loss.
 */
export const explorationProgressSchema = z
  .object({
    discovered: z.array(z.string()).default([]),
    manuallyMarked: z.array(z.string()).default([]),
    values: z.record(z.string(), z.array(z.string())).default({}),
    initializedAt: z.number().int().nonnegative().default(0),
  })
  .default({ discovered: [], manuallyMarked: [], values: {}, initializedAt: 0 });

export type ExplorationProgressSchema = z.infer<typeof explorationProgressSchema>;
