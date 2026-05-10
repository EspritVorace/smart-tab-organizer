import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  SHORTCUTS_REGISTRY,
  getShortcutsByGroup,
  getShortcutsByScope,
} from '../../src/shortcuts/registry';
import { parseCombo } from '../../src/utils/keyboardShortcuts';

const enMessages: Record<string, { message: string }> = JSON.parse(
  readFileSync(
    join(__dirname, '..', '..', 'public', '_locales', 'en', 'messages.json'),
    'utf-8',
  ),
);

describe('SHORTCUTS_REGISTRY', () => {
  it('uses each entry id as its own key', () => {
    for (const [key, entry] of Object.entries(SHORTCUTS_REGISTRY)) {
      expect(entry.id).toBe(key);
    }
  });

  it('has no duplicate id', () => {
    const ids = Object.values(SHORTCUTS_REGISTRY).map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('parses every defaultBinding without error', () => {
    for (const entry of Object.values(SHORTCUTS_REGISTRY)) {
      for (const binding of entry.defaultBindings) {
        const combos = typeof binding === 'string' ? [binding] : binding;
        for (const combo of combos) {
          expect(() => parseCombo(combo)).not.toThrow();
          const parsed = parseCombo(combo);
          expect(parsed.key.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('every descriptionKey exists in the en locale', () => {
    for (const entry of Object.values(SHORTCUTS_REGISTRY)) {
      expect(
        enMessages[entry.descriptionKey],
        `missing locale key: ${entry.descriptionKey}`,
      ).toBeDefined();
    }
  });

  it('contains the expected number of entries per group (parity with legacy panel)', () => {
    expect(getShortcutsByGroup('global')).toHaveLength(3);
    expect(getShortcutsByGroup('popup')).toHaveLength(5);
    expect(getShortcutsByGroup('options')).toHaveLength(8);
    expect(getShortcutsByGroup('list-rules')).toHaveLength(7);
    expect(getShortcutsByGroup('list-sessions')).toHaveLength(6);
    expect(getShortcutsByGroup('list-workspaces')).toHaveLength(1);
    expect(getShortcutsByGroup('list-home')).toHaveLength(4);
    expect(getShortcutsByGroup('session-card')).toHaveLength(4);
    expect(getShortcutsByGroup('importexport')).toHaveLength(6);
  });

  it('reserves i and e as sequence prefixes in page:importexport scope', () => {
    const ieScope = getShortcutsByScope('page:importexport');
    expect(ieScope.length).toBeGreaterThan(0);

    const offending: { id: string; combo: string; key: string }[] = [];
    for (const entry of ieScope) {
      for (const binding of entry.defaultBindings) {
        const combos = typeof binding === 'string' ? [binding] : [];
        for (const combo of combos) {
          const parsed = parseCombo(combo);
          if (parsed.key === 'i' || parsed.key === 'e') {
            offending.push({ id: entry.id, combo, key: parsed.key });
          }
        }
      }
    }
    expect(offending).toEqual([]);
  });

  it('attaches commandName only on global manifest entries', () => {
    const withCommand = Object.values(SHORTCUTS_REGISTRY).filter((e) => e.commandName);
    expect(withCommand.map((e) => e.commandName).sort()).toEqual([
      '_execute_action',
      'organize-all-tabs',
      'save-current-window-session',
    ]);
    for (const entry of withCommand) {
      expect(entry.scope).toBe('global');
      expect(entry.group).toBe('global');
    }
  });
});

describe('registry helpers', () => {
  it('getShortcutsByScope filters strictly', () => {
    const popupEntries = getShortcutsByScope('page:popup');
    expect(popupEntries.every((e) => e.scope === 'page:popup')).toBe(true);
    expect(popupEntries.length).toBe(5);

    const cardEntries = getShortcutsByScope('widget:session-card');
    expect(cardEntries.length).toBe(7);

    const ruleCardEntries = getShortcutsByScope('widget:rule-card');
    expect(ruleCardEntries.length).toBe(4);
  });

  it('getShortcutsByGroup returns only entries of the requested group', () => {
    for (const entry of getShortcutsByGroup('session-card')) {
      expect(entry.group).toBe('session-card');
    }
  });
});
