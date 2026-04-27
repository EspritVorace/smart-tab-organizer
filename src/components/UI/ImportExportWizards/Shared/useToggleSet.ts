import { useCallback, useMemo, useState } from 'react';

export interface ToggleSetState<T extends string = string> {
  ids: Set<T>;
  has: (id: T) => boolean;
  toggle: (id: T) => void;
  setAll: (ids: Iterable<T>) => void;
  clearAll: () => void;
  size: number;
}

/**
 * Generic helper for checkbox selection state backed by a `Set`.
 * Returned object is stable enough to pass as a single prop to leaf components.
 */
export function useToggleSet<T extends string = string>(
  initial?: Iterable<T>,
): ToggleSetState<T> {
  const [ids, setIds] = useState<Set<T>>(() => new Set(initial ?? []));

  const toggle = useCallback((id: T) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const setAll = useCallback((nextIds: Iterable<T>) => {
    setIds(new Set(nextIds));
  }, []);

  const clearAll = useCallback(() => {
    setIds(new Set());
  }, []);

  const has = useCallback((id: T) => ids.has(id), [ids]);

  return useMemo<ToggleSetState<T>>(
    () => ({ ids, has, toggle, setAll, clearAll, size: ids.size }),
    [ids, has, toggle, setAll, clearAll],
  );
}
