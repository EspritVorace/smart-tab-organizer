/**
 * Tokenizes shortcut combo strings for rendering. Output is platform-aware:
 * Mac uses Apple HIG glyphs (⌘, ⇧, ⌥, ⌃, ↵, ⌫), other platforms use textual
 * labels (Ctrl, Shift, Alt). The tokenizer is agnostic of the rendering
 * surface (Kbd, plain text, aria attribute) so callers can decide separators
 * and markup.
 */

import { IS_MAC } from './platform';

export interface DisplayToken {
  display: string;
  accessibleLabel: string;
  isModifier: boolean;
}

interface TokenSpec {
  display: string;
  accessibleLabel: string;
}

const MAC_MODIFIERS: Record<string, TokenSpec> = {
  mod: { display: '⌘', accessibleLabel: 'Command' },
  meta: { display: '⌘', accessibleLabel: 'Command' },
  cmd: { display: '⌘', accessibleLabel: 'Command' },
  command: { display: '⌘', accessibleLabel: 'Command' },
  ctrl: { display: '⌃', accessibleLabel: 'Control' },
  control: { display: '⌃', accessibleLabel: 'Control' },
  alt: { display: '⌥', accessibleLabel: 'Option' },
  option: { display: '⌥', accessibleLabel: 'Option' },
  shift: { display: '⇧', accessibleLabel: 'Shift' },
};

const TEXT_MODIFIERS: Record<string, TokenSpec> = {
  mod: { display: 'Ctrl', accessibleLabel: 'Control' },
  meta: { display: 'Win', accessibleLabel: 'Windows' },
  cmd: { display: 'Win', accessibleLabel: 'Windows' },
  command: { display: 'Win', accessibleLabel: 'Windows' },
  ctrl: { display: 'Ctrl', accessibleLabel: 'Control' },
  control: { display: 'Ctrl', accessibleLabel: 'Control' },
  alt: { display: 'Alt', accessibleLabel: 'Alt' },
  option: { display: 'Alt', accessibleLabel: 'Alt' },
  shift: { display: 'Shift', accessibleLabel: 'Shift' },
};

const SPECIAL_KEYS: Record<string, TokenSpec> = {
  arrowup: { display: '↑', accessibleLabel: 'Arrow Up' },
  arrowdown: { display: '↓', accessibleLabel: 'Arrow Down' },
  arrowleft: { display: '←', accessibleLabel: 'Arrow Left' },
  arrowright: { display: '→', accessibleLabel: 'Arrow Right' },
  enter: { display: '↵', accessibleLabel: 'Enter' },
  escape: { display: 'Esc', accessibleLabel: 'Escape' },
  esc: { display: 'Esc', accessibleLabel: 'Escape' },
  delete: { display: 'Del', accessibleLabel: 'Delete' },
  del: { display: 'Del', accessibleLabel: 'Delete' },
  backspace: { display: '⌫', accessibleLabel: 'Backspace' },
  space: { display: 'Space', accessibleLabel: 'Space' },
  tab: { display: 'Tab', accessibleLabel: 'Tab' },
  home: { display: 'Home', accessibleLabel: 'Home' },
  end: { display: 'End', accessibleLabel: 'End' },
};

export function tokenizeComboForDisplay(combo: string): DisplayToken[] {
  const modifiers = IS_MAC ? MAC_MODIFIERS : TEXT_MODIFIERS;
  const parts = combo.split('+').map((p) => p.trim()).filter(Boolean);
  return parts.map((part) => {
    const lower = part.toLowerCase();
    const modifier = modifiers[lower];
    if (modifier) return { ...modifier, isModifier: true };
    const special = SPECIAL_KEYS[lower];
    if (special) return { ...special, isModifier: false };
    const display =
      lower.length === 1 && /[a-z]/.test(lower) ? part.toUpperCase() : part;
    return { display, accessibleLabel: display, isModifier: false };
  });
}

/**
 * Plain-text formatting for tooltips, `aria-keyshortcuts`, exports, and tests.
 * Mac uses tight glyph spacing (`⌘ ⇧ R`), other platforms use ` + ` between
 * tokens (`Ctrl + Shift + R`).
 */
export function formatComboForA11y(combo: string): string {
  const tokens = tokenizeComboForDisplay(combo);
  const separator = IS_MAC ? ' ' : ' + ';
  return tokens.map((t) => t.accessibleLabel).join(separator);
}
