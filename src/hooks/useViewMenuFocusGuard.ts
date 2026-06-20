import { useRef } from 'react';

/**
 * Encapsulates the focus-guard pattern shared by view menus (RuleViewMenu,
 * SessionViewMenu). Tracks whether a change occurred while the menu was open
 * and, on close, either hands focus back to the trigger (no change) or calls
 * `onApplied` so the caller can move focus to the first visible result
 * (accessibility: keep keyboard users on relevant content after filtering).
 *
 * @returns `apply` - call instead of `onChange` for every state mutation
 * @returns `handleCloseAutoFocus` - pass to `DropdownMenu.Content.onCloseAutoFocus`
 */
export function useViewMenuFocusGuard<T>(
  onChange: (next: T) => void,
  onApplied?: () => void,
): {
  apply: (next: T) => void;
  handleCloseAutoFocus: (event: Event) => void;
} {
  const changedRef = useRef(false);

  const handleCloseAutoFocus = (event: Event) => {
    if (changedRef.current && onApplied) {
      changedRef.current = false;
      event.preventDefault();
      onApplied();
    }
  };

  const apply = (next: T) => {
    changedRef.current = true;
    onChange(next);
  };

  return { apply, handleCloseAutoFocus };
}
