/**
 * Focuses the first [data-autofocus] descendant that is not disabled.
 * Pass this as onOpenAutoFocus to AlertDialog.Content components.
 *
 * Unlike DialogShell's defaultOnOpenAutoFocus, there is no title fallback:
 * AlertDialogs always have an action or cancel button as the intended target.
 */
export function focusAutoFocusTarget(event: Event): void {
  const root = event.currentTarget;
  if (!(root instanceof HTMLElement)) return;
  const target = root.querySelector<HTMLElement>('[data-autofocus]');
  if (!target) return;
  if (target instanceof HTMLButtonElement && target.disabled) return;
  if (target.getAttribute('aria-disabled') === 'true') return;
  event.preventDefault();
  target.focus();
}
