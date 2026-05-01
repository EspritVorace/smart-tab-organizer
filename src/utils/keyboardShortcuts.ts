/**
 * Lightweight, framework-agnostic helpers for matching keyboard events
 * against shortcut definitions.
 *
 * Combos are written as `Modifier+Modifier+Key`, e.g. `Alt+Shift+r`, `Alt+1`,
 * `Escape`, `?`, `/`. Modifier order does not matter, casing on the key does
 * not matter.
 *
 * For the literal key `?` shift is ignored (most layouts require shift to type
 * it). All other keys require strict modifier match so that `r` and `Shift+r`
 * are distinguishable.
 */

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
  return {
    key: rawKey.toLowerCase(),
    shift: mods.has('shift'),
    alt: mods.has('alt'),
    ctrl: mods.has('ctrl') || mods.has('control'),
    meta: mods.has('meta') || mods.has('cmd') || mods.has('command'),
  };
}

export function matchesShortcut(event: KeyboardEvent, combo: string): boolean {
  const parsed = parseCombo(combo);
  if (event.key.toLowerCase() !== parsed.key) return false;
  if (event.altKey !== parsed.alt) return false;
  if (event.ctrlKey !== parsed.ctrl) return false;
  if (event.metaKey !== parsed.meta) return false;
  if (parsed.key !== '?' && event.shiftKey !== parsed.shift) return false;
  return true;
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
}

export function shouldFire(event: KeyboardEvent, def: ShortcutDefinition): boolean {
  if (!matchesShortcut(event, def.combo)) return false;
  if (!def.allowInTypingTarget && isTypingTarget(event.target)) return false;
  if (!def.allowWhenDialogOpen && isDialogOpen()) return false;
  if (def.excludeIfTargetWithin && event.target instanceof Element) {
    if (event.target.closest(def.excludeIfTargetWithin)) return false;
  }
  return true;
}
