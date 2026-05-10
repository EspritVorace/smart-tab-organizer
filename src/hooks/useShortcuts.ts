/**
 * Façade hook that lets callers wire keyboard actions by registry ID instead
 * of duplicating combo strings inline. At this stage it is a thin wrapper
 * around `useKeyboardShortcuts`; Lots 2 and 3 will extend it with widget
 * scopes and key sequences.
 */

import { useMemo } from 'react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { SHORTCUTS_REGISTRY } from '@/shortcuts/registry';
import type { ShortcutScope } from '@/shortcuts/types';
import type { ShortcutDefinition } from '@/utils/keyboardShortcuts';

export type ShortcutAction = (event: KeyboardEvent) => void;

export interface UseShortcutsOptions {
  scope?: ShortcutScope;
  enabled?: boolean;
}

export function useShortcuts(
  bindings: Record<string, ShortcutAction>,
  options: UseShortcutsOptions = {},
): void {
  const { scope = 'global', enabled = true } = options;

  const definitions = useMemo<ShortcutDefinition[]>(() => {
    const defs: ShortcutDefinition[] = [];
    for (const [id, action] of Object.entries(bindings)) {
      const entry = SHORTCUTS_REGISTRY[id];
      if (!entry) continue;
      if (entry.scope !== scope) continue;
      for (const combo of entry.defaultBindings) {
        defs.push({
          combo,
          action,
          allowInTypingTarget: entry.allowInTypingTarget,
          allowWhenDialogOpen: entry.allowWhenDialogOpen,
        });
      }
    }
    return defs;
  }, [bindings, scope]);

  useKeyboardShortcuts(definitions, { enabled });
}
