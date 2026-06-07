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

/**
 * Module-level registry of "claim checkers" contributed by every mounted
 * `widget:*` hook. A checker reports whether its widget would handle a given
 * event (focus on the matching scope element AND one of its registered
 * bindings matches the combo). Page-level entries flagged
 * `excludeIfInsideWidget` consult these so they only yield the combos a
 * focused widget actually owns: pressing `r` on a pinned card belongs to the
 * card (`sessionCard.restore.*`), but `o`/`s`/`p`, which no card claims, keep
 * firing the popup-level action instead of being swallowed.
 */
type WidgetClaimChecker = (event: KeyboardEvent) => boolean;
const widgetClaimCheckers = new Set<WidgetClaimChecker>();

function anyWidgetClaims(event: KeyboardEvent): boolean {
  for (const check of widgetClaimCheckers) {
    if (check(event)) return true;
  }
  return false;
}

function entryScopeFilter(entry: ShortcutEntry, event: KeyboardEvent): boolean {
  if (entry.scope.startsWith('widget:')) {
    if (!(event.target instanceof Element)) return false;
    if (!event.target.matches(widgetScopeSelector(entry.scope))) return false;
    return true;
  }
  if (entry.excludeIfInsideWidget && event.target instanceof Element) {
    if (anyWidgetClaims(event)) return false;
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

    // Widget scopes contribute a claim checker so page-level entries flagged
    // `excludeIfInsideWidget` only yield the combos this widget actually owns.
    // The checker reads `bindingsRef.current` lazily, so it always reflects the
    // currently registered bindings even if they change between renders.
    let widgetChecker: WidgetClaimChecker | null = null;
    if (scope.startsWith('widget:')) {
      const selector = widgetScopeSelector(scope);
      widgetChecker = (event: KeyboardEvent): boolean => {
        if (!(event.target instanceof Element)) return false;
        if (!event.target.matches(selector)) return false;
        const combo = serializeKeyEvent(event);
        if (combo === null) return false;
        for (const id of Object.keys(bindingsRef.current)) {
          const entry = SHORTCUTS_REGISTRY[id];
          if (!entry || entry.scope !== scope) continue;
          for (const binding of getEffectiveBindings(id)) {
            if (matchesBinding([combo], binding as Binding, event)) return true;
          }
        }
        return false;
      };
      widgetClaimCheckers.add(widgetChecker);
    }

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
          // A single-key action must not fire when the key was already consumed
          // by an earlier-registered handler, typically the tail of a sequence
          // in another hook (e.g. `w p` switching workspaces in the popup must
          // not also trigger the `p` "open options" action). Sequence bindings
          // are unaffected: they keep completing even after preventDefault.
          if (typeof binding === 'string' && event.defaultPrevented) continue;
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
      if (widgetChecker) widgetClaimCheckers.delete(widgetChecker);
      clearTimer();
      if (buffer.length > 0) {
        buffer = [];
        onSequenceStateRef.current?.({ activePrefix: null });
      }
    };
  }, [enabled, scope, sequenceTimeout]);
}
