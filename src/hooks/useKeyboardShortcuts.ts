import { useEffect } from 'react';
import { shouldFire, type ShortcutDefinition } from '@/utils/keyboardShortcuts';

/**
 * Registers a global keydown listener that fires any matching shortcut.
 * Definitions are re-read each render (no need to memoize), but the listener
 * itself is attached once per mount.
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutDefinition[],
  options: { enabled?: boolean } = {},
): void {
  const enabled = options.enabled ?? true;
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: KeyboardEvent) => {
      for (const def of shortcuts) {
        if (shouldFire(event, def)) {
          event.preventDefault();
          def.action(event);
          break;
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts, enabled]);
}
