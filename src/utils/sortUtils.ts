/**
 * Shared stable display-sort helper.
 *
 * Both the rules and sessions "view" menus need the same sort semantics:
 * a value flagged `missing` always sorts last (direction-independent), and
 * ties keep their original array order (stable). Extracted here so the rule
 * and session view utils share one implementation.
 */

export type SortDirection = 'asc' | 'desc';

export interface SortKey {
  /** Ascending comparison key (compared via `localeCompare`). */
  key: string;
  /** When true, the item is always sorted last regardless of direction. */
  missing: boolean;
}

/**
 * Stable sort by a derived key. Missing values always sort last; the
 * original-index tiebreaker is never inverted, so equal keys keep their real
 * order.
 */
export function stableSortByKey<T>(
  items: T[],
  keyOf: (item: T) => SortKey,
  direction: SortDirection,
): T[] {
  const dir = direction === 'desc' ? -1 : 1;
  const decorated = items.map((item, index) => ({ item, index, ...keyOf(item) }));
  decorated.sort((a, b) => {
    if (a.missing !== b.missing) return a.missing ? 1 : -1;
    if (!a.missing) {
      const cmp = a.key.localeCompare(b.key);
      if (cmp !== 0) return cmp * dir;
    }
    return a.index - b.index;
  });
  return decorated.map(d => d.item);
}
