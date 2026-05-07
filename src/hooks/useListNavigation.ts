import { useCallback, type RefObject, type KeyboardEvent } from 'react';

export type NavigationAxis = 'vertical' | 'horizontal' | 'both';

export interface UseListNavigationOptions {
  /** Axis along which arrow keys move focus. Default `'vertical'`. */
  axis?: NavigationAxis;
  /**
   * When true, the hook also rewrites `tabindex` on every matched item so that
   * only the focused one is reachable via Tab (roving tabindex pattern).
   */
  rovingTabIndex?: boolean;
}

export interface ListNavigationApi {
  /**
   * Returns true when the key was consumed (caller should stop processing).
   * `index` is the position of the element receiving the event among its
   * siblings matching `itemSelector`.
   */
  handleNavigationKey: (e: KeyboardEvent<HTMLElement>, index: number) => boolean;
}

/**
 * Shared keyboard navigation helper for card lists / grids.
 *
 * The list container is referenced by `listRef`; the navigable items are
 * looked up via `itemSelector` at call time so additions/removals are picked
 * up without re-binding the hook.
 */
export function useListNavigation<T extends HTMLElement>(
  listRef: RefObject<T | null>,
  itemSelector: string,
  options: UseListNavigationOptions = {},
): ListNavigationApi {
  const { axis = 'vertical', rovingTabIndex = false } = options;

  const handleNavigationKey = useCallback(
    (e: KeyboardEvent<HTMLElement>, index: number): boolean => {
      const items = listRef.current?.querySelectorAll<HTMLElement>(itemSelector);
      if (!items || items.length === 0) return false;

      const focusAt = (next: number) => {
        const clamped = Math.max(0, Math.min(items.length - 1, next));
        const target = items[clamped];
        if (!target) return;
        if (rovingTabIndex) {
          items.forEach((el) => el.setAttribute('tabindex', el === target ? '0' : '-1'));
        }
        target.focus();
      };

      const v = axis === 'vertical' || axis === 'both';
      const h = axis === 'horizontal' || axis === 'both';

      switch (e.key) {
        case 'ArrowDown':
          if (v) { e.preventDefault(); focusAt(index + 1); return true; }
          return false;
        case 'ArrowUp':
          if (v) { e.preventDefault(); focusAt(index - 1); return true; }
          return false;
        case 'ArrowRight':
          if (h) { e.preventDefault(); focusAt(index + 1); return true; }
          return false;
        case 'ArrowLeft':
          if (h) { e.preventDefault(); focusAt(index - 1); return true; }
          return false;
        case 'Home':
          e.preventDefault();
          focusAt(0);
          return true;
        case 'End':
          e.preventDefault();
          focusAt(items.length - 1);
          return true;
        default:
          return false;
      }
    },
    [listRef, itemSelector, axis, rovingTabIndex],
  );

  return { handleNavigationKey };
}
