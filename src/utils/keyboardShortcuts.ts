/**
 * Lightweight, framework-agnostic helpers for matching keyboard events
 * against shortcut definitions.
 *
 * Combos are written as `Modifier+Modifier+Key`, e.g. `Alt+Shift+r`, `Alt+1`,
 * `Escape`, `?`, `/`. Modifier order does not matter, casing on the key does
 * not matter.
 *
 * The `Mod` modifier resolves to `Cmd` on macOS and `Ctrl` elsewhere so a
 * single registry entry can target the OS-native primary modifier without
 * branching at every call site.
 *
 * For the literal keys `?` and `/`, shift is ignored: many layouts require
 * shift to produce them (`?` on QWERTY, `/` on French AZERTY where Shift+: is
 * the only way to type a slash). All other keys require strict modifier match
 * so that `r` and `Shift+r` are distinguishable.
 */

import { IS_MAC } from './platform';
import type { Binding } from '@/shortcuts/types';

export interface ParsedCombo {
  key: string;
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
}

export function parseCombo(combo: string): ParsedCombo {
  const parts = combo.split('+').map((p) => p.trim()).filter(Boolean);
  const rawKey = parts.pop() ?? '';
  const mods = new Set(parts.map((p) => p.toLowerCase()));
  const isMod = mods.has('mod');
  return {
    key: rawKey.toLowerCase(),
    shift: mods.has('shift'),
    alt: mods.has('alt'),
    ctrl: mods.has('ctrl') || mods.has('control') || (isMod && !IS_MAC),
    meta: mods.has('meta') || mods.has('cmd') || mods.has('command') || (isMod && IS_MAC),
  };
}

const SHIFT_INSENSITIVE_KEYS = new Set(['?', '/']);

export function matchesShortcut(event: KeyboardEvent, combo: string): boolean {
  const parsed = parseCombo(combo);
  if (!keyMatches(event, parsed.key)) return false;
  if (event.altKey !== parsed.alt) return false;
  if (event.ctrlKey !== parsed.ctrl) return false;
  if (event.metaKey !== parsed.meta) return false;
  if (!SHIFT_INSENSITIVE_KEYS.has(parsed.key) && event.shiftKey !== parsed.shift) return false;
  return true;
}

/**
 * `event.key` is layout-dependent: on AZERTY the physical "1" key emits "&"
 * without shift, and on macOS QWERTY `Alt+R` produces "®" instead of "r" so
 * the combo would never match if we only compared `event.key`. Fall back to
 * `event.code` for digits (`Digit0`..`Digit9`) and ASCII letters
 * (`KeyA`..`KeyZ`), both stable across layouts.
 */
function keyMatches(event: KeyboardEvent, parsedKey: string): boolean {
  if (event.key.toLowerCase() === parsedKey) return true;
  if (/^\d$/.test(parsedKey) && event.code === `Digit${parsedKey}`) return true;
  if (/^[a-z]$/.test(parsedKey) && event.code === `Key${parsedKey.toUpperCase()}`) return true;
  return false;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  const ce = target.getAttribute('contenteditable');
  if (ce === '' || ce === 'true' || ce === 'plaintext-only') return true;
  return false;
}

/**
 * True when a Radix Dialog is currently open. Radix sets
 * `[data-state="open"]` on the dialog content node; we look for any open
 * `role="dialog"` to know whether global shortcuts should be skipped.
 */
export function isDialogOpen(): boolean {
  if (typeof document === 'undefined') return false;
  return document.querySelector<HTMLElement>('[role="dialog"][data-state="open"]') !== null;
}

export interface ShortcutDefinition {
  combo: string;
  action: (event: KeyboardEvent) => void;
  /** When true, fires even if focus is on an input/textarea/contenteditable. */
  allowInTypingTarget?: boolean;
  /** When true, fires even if a Radix dialog is currently open. */
  allowWhenDialogOpen?: boolean;
  /**
   * CSS selector. When the event target is within an element matching this
   * selector, the shortcut is skipped so the inner element's own handler can
   * take over (e.g. global popup `R` skips when focus is on a pinned card so
   * the card's per-session R/Shift+R/Alt+R bindings stay authoritative).
   */
  excludeIfTargetWithin?: string;
  /**
   * CSS selector. When set, the shortcut only fires if the event target
   * itself matches this selector (not its descendants). Used by widget-scope
   * bindings so that pressing the combo on an inner control (drag handle,
   * button) does not steal it from the inner control's own handler.
   */
  requireTargetMatches?: string;
}

export function shouldFire(event: KeyboardEvent, def: ShortcutDefinition): boolean {
  if (!matchesShortcut(event, def.combo)) return false;
  if (!def.allowInTypingTarget && isTypingTarget(event.target)) return false;
  if (!def.allowWhenDialogOpen && isDialogOpen()) return false;
  if (def.excludeIfTargetWithin && event.target instanceof Element) {
    if (event.target.closest(def.excludeIfTargetWithin)) return false;
  }
  if (def.requireTargetMatches) {
    if (!(event.target instanceof Element)) return false;
    if (!event.target.matches(def.requireTargetMatches)) return false;
  }
  return true;
}

/**
 * CSS selector matching any element that opts into a `widget:*` shortcut
 * scope. Page-level entries flagged `excludeIfInsideWidget` use this to
 * yield to the focused widget without enumerating every widget kind.
 */
export const WIDGET_SCOPE_SELECTOR = '[data-shortcut-scope^="widget:"]';

/**
 * Returns the CSS selector that matches the element opting into a given
 * widget scope (e.g. `[data-shortcut-scope="widget:session-card"]`). Used
 * by `useShortcuts` to derive `requireTargetMatches` from a registry
 * entry's `scope`.
 */
export function widgetScopeSelector(scope: string): string {
  return `[data-shortcut-scope="${scope}"]`;
}

const LONE_MODIFIER_KEYS = new Set([
  'Shift', 'Control', 'Alt', 'Meta', 'OS', 'ContextMenu',
]);

/**
 * Serializes a `KeyboardEvent` into a canonical combo string compatible with
 * `parseCombo`. Used to feed the sequence buffer in `useShortcuts`. Returns
 * `null` for lone modifier keypresses so the buffer ignores them.
 */
export function serializeKeyEvent(event: KeyboardEvent): string | null {
  if (LONE_MODIFIER_KEYS.has(event.key)) return null;
  const key = event.key.toLowerCase();
  const parts: string[] = [];
  if (event.metaKey) parts.push('Meta');
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey && !SHIFT_INSENSITIVE_KEYS.has(key)) parts.push('Shift');
  parts.push(key);
  return parts.join('+');
}

function comboEquivalent(a: string, b: string): boolean {
  const pa = parseCombo(a);
  const pb = parseCombo(b);
  return pa.key === pb.key
    && pa.shift === pb.shift
    && pa.alt === pb.alt
    && pa.ctrl === pb.ctrl
    && pa.meta === pb.meta;
}

/**
 * Returns true when the buffer (already including the latest keypress) fully
 * matches `binding`. Simple combos require a length-1 buffer matching the
 * combo. Sequences require equal length: the last step is matched against
 * the live event for layout-aware fallbacks (`event.code`), prior steps
 * compared canonically.
 */
export function matchesBinding(
  buffer: string[],
  binding: Binding,
  lastEvent: KeyboardEvent,
): boolean {
  if (typeof binding === 'string') {
    return buffer.length === 1 && matchesShortcut(lastEvent, binding);
  }
  if (buffer.length !== binding.length) return false;
  for (let i = 0; i < binding.length - 1; i++) {
    if (!comboEquivalent(buffer[i], binding[i])) return false;
  }
  return matchesShortcut(lastEvent, binding[binding.length - 1]);
}

/**
 * Returns true when the buffer is a strict prefix of `binding`. Returns
 * false for simple combos (no prefix possible) and for full matches (use
 * `matchesBinding` for those).
 */
export function isSequencePrefix(
  buffer: string[],
  binding: Binding,
  lastEvent: KeyboardEvent,
): boolean {
  if (typeof binding === 'string') return false;
  if (buffer.length >= binding.length) return false;
  if (buffer.length === 0) return false;
  for (let i = 0; i < buffer.length - 1; i++) {
    if (!comboEquivalent(buffer[i], binding[i])) return false;
  }
  return matchesShortcut(lastEvent, binding[buffer.length - 1]);
}
