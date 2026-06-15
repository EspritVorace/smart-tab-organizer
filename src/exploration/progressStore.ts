import { explorationProgressItem } from '@/utils/workspaceStorage.js';
import { logger } from '@/utils/logger.js';
import { parseExplorationProgress, type ExplorationProgress } from '@/types/exploration.js';
import { CATALOG } from './catalog.js';
import { getEntryState } from './coverage.js';

/**
 * Write side of the exploration tracker (US-A002, US-A003, US-A017).
 *
 * All mutations are pure transforms queued and applied in a single coalesced,
 * atomic read-modify-write of the global `explorationProgress` storage item.
 * Coalescing (a microtask-deferred flush serialized on a promise chain) keeps
 * near-simultaneous marks from racing or spamming the storage layer. Background
 * callers fire-and-forget; the returned promise is for tests and UI that want
 * to await persistence.
 */

type ProgressTransform = (progress: ExplorationProgress) => ExplorationProgress;

let pendingOps: ProgressTransform[] = [];
let scheduledFlush: Promise<void> | null = null;

function ensureInitialized(progress: ExplorationProgress): ExplorationProgress {
  return progress.initializedAt > 0 ? progress : { ...progress, initializedAt: Date.now() };
}

async function flush(): Promise<void> {
  const ops = pendingOps;
  pendingOps = [];
  if (ops.length === 0) return;

  const raw = await explorationProgressItem.getValue();
  const parsed = parseExplorationProgress(raw, (e) =>
    logger.warn('[EXPLORATION] Corrupt progress, resetting:', e),
  );
  let after = ensureInitialized(parsed);
  for (const op of ops) after = op(after);

  // Skip the write when nothing actually changed (idempotent marks). Compare
  // against the raw parsed value so an `initializedAt` stamp still persists.
  if (JSON.stringify(after) !== JSON.stringify(parsed)) {
    await explorationProgressItem.setValue(after);
  }
}

/**
 * Schedules a single coalesced flush on the next microtask. Returns a promise
 * that resolves once that flush has persisted. Concurrent enqueues in the same
 * tick share one flush; an enqueue during an in-flight flush schedules the next.
 */
function scheduleFlush(): Promise<void> {
  if (!scheduledFlush) {
    scheduledFlush = new Promise<void>((resolve) => {
      queueMicrotask(() => {
        flush()
          .catch((e) => logger.error('[EXPLORATION] Flush failed:', e))
          .finally(() => {
            scheduledFlush = null;
            resolve();
          });
      });
    });
  }
  return scheduledFlush;
}

function enqueue(op: ProgressTransform): Promise<void> {
  pendingOps.push(op);
  return scheduleFlush();
}

/**
 * Marks a capability as discovered automatically. Idempotent and
 * non-reversible: a second call for the same id is a no-op transform.
 */
export function markDiscovered(capabilityId: string): Promise<void> {
  logger.debug('[EXPLORATION] Discovered:', capabilityId);
  return enqueue((p) => {
    if (p.discovered.includes(capabilityId)) return p;
    return { ...p, discovered: [...p.discovered, capabilityId] };
  });
}

/**
 * Records a distinct value seen for a multi-valued capability (e.g. a group
 * color or a dedup match mode). Dedup-adds into `values[capabilityId]`.
 */
export function markValue(capabilityId: string, value: string): Promise<void> {
  logger.debug('[EXPLORATION] Value:', capabilityId, value);
  return enqueue((p) => {
    const existing = p.values[capabilityId] ?? [];
    if (existing.includes(value)) return p;
    return { ...p, values: { ...p.values, [capabilityId]: [...existing, value] } };
  });
}

/**
 * Sets the reversible manual mark on a capability (US-A017).
 * - `marked = true` is honored only on a "to-discover" entry (not discovered,
 *   prerequisites satisfied); otherwise a no-op.
 * - `marked = false` removes the id from `manuallyMarked`; it never touches the
 *   automatic `discovered` set, so an automatic discovery can never be undone.
 */
export function setManualMark(capabilityId: string, marked: boolean): Promise<void> {
  logger.debug('[EXPLORATION] Manual mark:', capabilityId, marked);
  return enqueue((p) => {
    if (marked) {
      const entry = CATALOG.find((c) => c.id === capabilityId);
      if (!entry) return p;
      if (p.manuallyMarked.includes(capabilityId)) return p;
      const { state } = getEntryState(entry, p);
      if (state !== 'to-discover') return p;
      return { ...p, manuallyMarked: [...p.manuallyMarked, capabilityId] };
    }
    if (!p.manuallyMarked.includes(capabilityId)) return p;
    return { ...p, manuallyMarked: p.manuallyMarked.filter((id) => id !== capabilityId) };
  });
}

/** Reads the current persisted progress, parsed and validated. */
export async function getExplorationProgress(): Promise<ExplorationProgress> {
  const raw = await explorationProgressItem.getValue();
  return parseExplorationProgress(raw, (e) => logger.warn('[EXPLORATION] Corrupt progress on read:', e));
}

/**
 * Ensures the storage item exists with a stamped `initializedAt`, without any
 * backfill of pre-existing usage (decision 7). Safe to call from every
 * entrypoint; idempotent.
 */
export async function initExplorationProgress(): Promise<void> {
  const raw = await explorationProgressItem.getValue();
  if (raw && typeof raw === 'object' && (raw as ExplorationProgress).initializedAt > 0) return;
  await enqueue((p) => ensureInitialized(p));
}

/** Awaits any pending coalesced writes (tests / UI flows that need certainty). */
export function flushExplorationWrites(): Promise<void> {
  return scheduledFlush ?? Promise.resolve();
}

/** Test-only: clears the in-memory queue and resets the flush state. */
export function _resetExplorationStoreForTests(): void {
  pendingOps = [];
  scheduledFlush = null;
}
