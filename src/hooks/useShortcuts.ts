/**
 * Façade hook that lets callers wire keyboard actions by registry ID instead
 * of duplicating combo strings inline. Resolves each binding against
 * `SHORTCUTS_REGISTRY` and translates the entry's `scope` into a low-level
 * `ShortcutDefinition`:
 *
 * - `global` and `page:*` scopes attach as plain document-level shortcuts.
 *   Entries flagged `excludeIfInsideWidget` are suppressed when focus is
 *   anywhere inside a `[data-shortcut-scope="widget:..."]` element.
 * - `widget:*` scopes only fire when the event target itself carries the
 *   matching `data-shortcut-scope` attribute (descendants do not steal the
 *   combo, so a drag handle's Space still starts the drag).
 */

import { useMemo } from 'react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { SHORTCUTS_REGISTRY } from '@/shortcuts/registry';
import type { ShortcutScope } from '@/shortcuts/types';
import {
  WIDGET_SCOPE_SELECTOR,
  widgetScopeSelector,
  type ShortcutDefinition,
} from '@/utils/keyboardShortcuts';

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
      const isWidget = entry.scope.startsWith('widget:');
      for (const combo of entry.defaultBindings) {
        const def: ShortcutDefinition = {
          combo,
          action,
          allowInTypingTarget: entry.allowInTypingTarget,
          allowWhenDialogOpen: entry.allowWhenDialogOpen,
        };
        if (isWidget) {
          def.requireTargetMatches = widgetScopeSelector(entry.scope);
        } else if (entry.excludeIfInsideWidget) {
          def.excludeIfTargetWithin = WIDGET_SCOPE_SELECTOR;
        }
        defs.push(def);
      }
    }
    return defs;
  }, [bindings, scope]);

  useKeyboardShortcuts(definitions, { enabled });
}
