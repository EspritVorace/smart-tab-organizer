import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

/**
 * Configuration for useSyncedState.
 *
 * @template T - Shape of the state object (must be a plain object).
 */
export interface SyncedStateOptions<T extends object> {
  /**
   * Async function that loads the full initial state from storage.
   * Called once on mount.
   */
  load: () => Promise<T>;

  /**
   * Register external-change watchers.
   * The provided `onChanged` callback must be called with a *partial* object
   * containing only the fields that changed. The hook merges it into state.
   * Return a cleanup function (called on unmount).
   */
  watch: (onChanged: (update: Partial<T>) => void) => () => void;

  /**
   * Persist a partial update to storage.
   * Receives both the changed fields (`updates`) and the full new state
   * (`current`) so implementations can choose to save granularly or as a whole.
   */
  save: (updates: Partial<T>, current: T) => Promise<void>;

  /**
   * Optional defaults. When provided, `reset()` restores the state to these
   * values. Omit to make `reset()` a no-op.
   */
  defaults?: T;
}

export interface SyncedStateReturn<T extends object> {
  /** Current state, or null while the initial load is pending. */
  value: T | null;
  /** True once the initial load completed successfully. */
  isLoaded: boolean;
  /** Optimistically update state and persist to storage. */
  update: (updates: Partial<T>) => Promise<void>;
  /** Reset to defaults (no-op if no defaults were provided). */
  reset: () => Promise<void>;
  /**
   * Register a callback for a specific field.
   * Called when an *external* storage change updates that field.
   * Returns an unregister function.
   */
  onFieldChange: <K extends keyof T>(field: K, cb: (value: T[K]) => void) => () => void;
  /** Re-fetch the full state from storage and overwrite local state. */
  reload: () => Promise<void>;
}

/**
 * Generic hook for state that is persisted to browser storage and watched for
 * changes made by other extension contexts (background, popup, options…).
 *
 * Handles:
 * - Initial load
 * - External-change watchers with per-field callbacks
 * - Optimistic local writes (state updated before storage write completes)
 * - isLocalUpdate guard to avoid reacting to own writes
 */
export function useSyncedState<T extends object>({
  load,
  watch: setupWatch,
  save,
  defaults,
}: SyncedStateOptions<T>): SyncedStateReturn<T> {
  // --- State ---
  const [value, _setValue] = useState<T | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [changeCallbacks, setChangeCallbacks] = useState<{
    [K in keyof T]?: Set<(v: T[K]) => void>;
  }>({});

  // --- Refs ---

  // Synchronous mirror of `value` for reads in async callbacks (avoids stale closures).
  const valueRef = useRef<T | null>(null);

  // Prevents reacting to storage events triggered by our own writes.
  const isLocalUpdate = useRef(false);

  // Keeps callbacks accessible inside the stable watcher closure.
  const changeCallbacksRef = useRef(changeCallbacks);
  changeCallbacksRef.current = changeCallbacks;

  // Option refs so effects only run once while still seeing the latest functions.
  const loadRef = useRef(load);
  loadRef.current = load;
  const saveRef = useRef(save);
  saveRef.current = save;
  const setupWatchRef = useRef(setupWatch);
  setupWatchRef.current = setupWatch;

  // --- Helpers ---

  /** Update both the React state and the sync ref atomically. */
  const setValue = useCallback((next: T | null) => {
    valueRef.current = next;
    _setValue(next);
  }, []);

  /**
   * Wrap any storage write with the local-update guard.
   * Sets the flag before writing, clears it after a short delay so the
   * storage watcher has time to fire and be ignored.
   */
  const withLocalUpdate = useCallback(async (fn: () => Promise<void>) => {
    isLocalUpdate.current = true;
    try {
      await fn();
    } finally {
      setTimeout(() => { isLocalUpdate.current = false; }, 100);
    }
  }, []);

  // --- Effects ---

  useEffect(() => {
    loadRef.current()
      .then(v => { setValue(v); setIsLoaded(true); })
      .catch(error => logger.error('[useSyncedState] load error:', error));
  }, []);

  useEffect(() => {
    return setupWatchRef.current((update) => {
      if (isLocalUpdate.current) return;
      _setValue(prev => {
        if (!prev) return prev;
        const next = { ...prev, ...update };
        valueRef.current = next;
        // Fire per-field callbacks for fields that actually changed.
        (Object.keys(update) as (keyof T)[]).forEach((field) => {
          if ((update as T)[field] !== prev[field]) {
            const cbs = changeCallbacksRef.current[field];
            if (cbs) cbs.forEach(cb => cb(next[field] as T[typeof field]));
          }
        });
        return next;
      });
    });
  }, []);

  // --- Public API ---

  const update = useCallback(async (updates: Partial<T>) => {
    const current = valueRef.current;
    if (!current) return;
    const newValue = { ...current, ...updates };
    setValue(newValue);
    await withLocalUpdate(async () => {
      await saveRef.current(updates, newValue);
    });
  }, [setValue, withLocalUpdate]);

  const reset = useCallback(async () => {
    if (!defaults) return;
    setValue(defaults);
    await withLocalUpdate(async () => {
      await saveRef.current(defaults as Partial<T>, defaults);
    });
  }, [defaults, setValue, withLocalUpdate]);

  const onFieldChange = useCallback(<K extends keyof T>(
    field: K,
    callback: (value: T[K]) => void,
  ) => {
    setChangeCallbacks(prev => ({
      ...prev,
      [field]: new Set([...(prev[field] ?? []), callback as any]),
    }));
    return () => {
      setChangeCallbacks(prev => {
        const next = { ...prev };
        if (next[field]) {
          (next[field] as Set<any>).delete(callback);
          if ((next[field] as Set<any>).size === 0) delete next[field];
        }
        return next;
      });
    };
  }, []);

  const reload = useCallback(async () => {
    try {
      setValue(await loadRef.current());
    } catch (error) {
      logger.error('[useSyncedState] reload error:', error);
    }
  }, [setValue]);

  return { value, isLoaded, update, reset, onFieldChange, reload };
}
