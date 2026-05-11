/**
 * Facade hook that lets callers wire keyboard actions by registry ID. Resolves
 * each binding against `SHORTCUTS_REGISTRY` and dispatches keydown events
 * directly. Supports both simple combos (`'Mod+K'`) and ordered key sequences
 * (`['i', 'r']`) declared on a registry entry's `defaultBindings`.
 *
 * Scope filtering mirrors Lot 2 semantics:
 * - `widget:*` scopes only fire when the event target itself carries the
 *   matching `data-shortcut-scope` attribute (descendants do not steal the
 *   combo).
 * - `global` and `page:*` scopes attach as document-level shortcuts; entries
 *   flagged `excludeIfInsideWidget` are suppressed when focus is inside any
 *   `[data-shortcut-scope^="widget:"]` element.
 *
 * Sequences accumulate in a buffer cleared on Escape, on focus into a typing
 * target, on dialog open, or after `sequenceTimeout` ms of inactivity. The
 * `onSequenceState` callback fires whenever the active prefix changes so the
 * UI can render a `SequenceIndicator`.
 */

import { useEffect, useRef } from 'react';
import { getEffectiveBindings } from '@/shortcuts/getEffectiveBindings';
import { SHORTCUTS_REGISTRY } from '@/shortcuts/registry';
import type { Binding, ShortcutEntry, ShortcutScope } from '@/shortcuts/types';
import {
  WIDGET_SCOPE_SELECTOR,
  isDialogOpen,
  isSequencePrefix,
  isTypingTarget,
  matchesBinding,
  serializeKeyEvent,
  widgetScopeSelector,
} from '@/utils/keyboardShortcuts';

export type ShortcutAction = (event: KeyboardEvent) => void;

export interface UseShortcutsOptions {
  scope?: ShortcutScope;
  enabled?: boolean;
  /** Sequence timeout in ms. Default 1500. */
  sequenceTimeout?: number;
  /**
   * Notified when the sequence buffer changes. Receives the active prefix
   * (array of canonical combos) or `null` when the buffer is empty. Also
   * fired on hook unmount so the indicator clears when the page changes.
   */
  onSequenceState?: (state: { activePrefix: string[] | null }) => void;
}

const DEFAULT_SEQUENCE_TIMEOUT_MS = 1500;

function entryScopeFilter(entry: ShortcutEntry, event: KeyboardEvent): boolean {
  if (entry.scope.startsWith('widget:')) {
    if (!(event.target instanceof Element)) return false;
    if (!event.target.matches(widgetScopeSelector(entry.scope))) return false;
    return true;
  }
  if (entry.excludeIfInsideWidget && event.target instanceof Element) {
    if (event.target.closest(WIDGET_SCOPE_SELECTOR)) return false;
  }
  return true;
}

function passesContextualFilters(entry: ShortcutEntry, event: KeyboardEvent): boolean {
  if (!entry.allowInTypingTarget && isTypingTarget(event.target)) return false;
  if (!entry.allowWhenDialogOpen && isDialogOpen()) return false;
  return entryScopeFilter(entry, event);
}

export function useShortcuts(
  bindings: Record<string, ShortcutAction>,
  options: UseShortcutsOptions = {},
): void {
  const {
    scope = 'global',
    enabled = true,
    sequenceTimeout = DEFAULT_SEQUENCE_TIMEOUT_MS,
    onSequenceState,
  } = options;

  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;
  const onSequenceStateRef = useRef(onSequenceState);
  onSequenceStateRef.current = onSequenceState;

  useEffect(() => {
    if (!enabled) return undefined;

    let buffer: string[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const reset = () => {
      const wasActive = buffer.length > 0;
      buffer = [];
      clearTimer();
      if (wasActive) onSequenceStateRef.current?.({ activePrefix: null });
    };

    const collectScopedEntries = (): { id: string; entry: ShortcutEntry; action: ShortcutAction }[] => {
      const out: { id: string; entry: ShortcutEntry; action: ShortcutAction }[] = [];
      for (const [id, action] of Object.entries(bindingsRef.current)) {
        const entry = SHORTCUTS_REGISTRY[id];
        if (!entry) continue;
        if (entry.scope !== scope) continue;
        const resolved: ShortcutEntry = { ...entry, defaultBindings: getEffectiveBindings(id) };
        out.push({ id, entry: resolved, action });
      }
      return out;
    };

    const tryFullMatch = (
      scoped: { entry: ShortcutEntry; action: ShortcutAction }[],
      candidateBuffer: string[],
      event: KeyboardEvent,
    ): boolean => {
      for (const { entry, action } of scoped) {
        for (const binding of entry.defaultBindings) {
          if (!matchesBinding(candidateBuffer, binding as Binding, event)) continue;
          if (!passesContextualFilters(entry, event)) {
            reset();
            return true;
          }
          event.preventDefault();
          try {
            action(event);
          } finally {
            reset();
          }
          return true;
        }
      }
      return false;
    };

    const tryPartialMatch = (
      scoped: { entry: ShortcutEntry }[],
      candidateBuffer: string[],
      event: KeyboardEvent,
    ): boolean => {
      for (const { entry } of scoped) {
        for (const binding of entry.defaultBindings) {
          if (!isSequencePrefix(candidateBuffer, binding as Binding, event)) continue;
          if (isTypingTarget(event.target) || isDialogOpen()) {
            reset();
            return true;
          }
          buffer = candidateBuffer;
          clearTimer();
          timer = setTimeout(reset, sequenceTimeout);
          onSequenceStateRef.current?.({ activePrefix: [...buffer] });
          event.preventDefault();
          return true;
        }
      }
      return false;
    };

    const tryDispatch = (candidateBuffer: string[], event: KeyboardEvent): boolean => {
      const scoped = collectScopedEntries();
      if (tryFullMatch(scoped, candidateBuffer, event)) return true;
      return tryPartialMatch(scoped, candidateBuffer, event);
    };

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && buffer.length > 0) {
        reset();
      }

      const keyCombo = serializeKeyEvent(event);
      if (keyCombo === null) return;

      const candidateBuffer = [...buffer, keyCombo];
      if (tryDispatch(candidateBuffer, event)) return;

      if (buffer.length > 0) {
        reset();
        tryDispatch([keyCombo], event);
      }
    };

    const focusHandler = (event: FocusEvent) => {
      if (buffer.length === 0) return;
      if (isTypingTarget(event.target)) reset();
    };

    document.addEventListener('keydown', handler);
    document.addEventListener('focusin', focusHandler);
    return () => {
      document.removeEventListener('keydown', handler);
      document.removeEventListener('focusin', focusHandler);
      clearTimer();
      if (buffer.length > 0) {
        buffer = [];
        onSequenceStateRef.current?.({ activePrefix: null });
      }
    };
  }, [enabled, scope, sequenceTimeout]);
}
