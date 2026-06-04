import { useCallback, useEffect, useRef, type RefObject, type KeyboardEvent } from 'react';

export type NavigationAxis = 'vertical' | 'horizontal' | 'both';

export interface UseListNavigationOptions {
  /** Axis along which arrow keys move focus. Default `'vertical'`. */
  axis?: NavigationAxis;
  /**
   * When true, the hook also rewrites `tabindex` on every matched item so that
   * only the focused one is reachable via Tab (roving tabindex pattern).
   */
  rovingTabIndex?: boolean;
  /**
   * Focus an element once when the component mounts, as soon as `ready` is true
   * (defaults to true). Targets the first `itemSelector` item inside the list;
   * if the list has no such item (empty or not rendered, so `listRef.current`
   * is null), focuses `fallbackSelector` (looked up at the document level) when
   * provided. The guard resets on remount, so navigating away and back
   * re-applies the focus.
   */
  autoFocus?: {
    ready?: boolean;
    fallbackSelector?: string;
  };
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
  const { axis = 'vertical', rovingTabIndex = false, autoFocus } = options;

  const autoFocusEnabled = autoFocus != null;
  const autoFocusReady = autoFocus?.ready ?? true;
  const fallbackSelector = autoFocus?.fallbackSelector;
  const autoFocusAppliedRef = useRef(false);

  useEffect(() => {
    if (!autoFocusEnabled || !autoFocusReady || autoFocusAppliedRef.current) return;
    autoFocusAppliedRef.current = true;
    const list = listRef.current;
    const active = document.activeElement;
    // Never steal focus the user already moved into this list's content between
    // mount and this effect firing (e.g. they tabbed straight to a card or its
    // drag handle). Focus arriving from outside the list (sidebar, fresh load
    // where `activeElement` is the body) is fair game.
    if (list && active instanceof HTMLElement && list.contains(active)) return;
    const first = list?.querySelector<HTMLElement>(itemSelector) ?? null;
    const target =
      first ??
      (fallbackSelector ? document.querySelector<HTMLElement>(fallbackSelector) : null);
    if (target && target !== active) target.focus({ preventScroll: true });
  }, [autoFocusEnabled, autoFocusReady, fallbackSelector, itemSelector, listRef]);

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
