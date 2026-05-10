import { describe, it, expect } from 'vitest';
import { getDisplayTree } from '../src/shortcuts/groups';
import {
  getShortcutsByGroup,
  SHORTCUTS_REGISTRY,
} from '../src/shortcuts/registry';

describe('popup display tree', () => {
  it('contains exactly the Popup and SessionCard groups in this order', () => {
    const tree = getDisplayTree('popup');
    expect(tree.map((n) => n.descriptor.id)).toEqual(['popup', 'session-card']);
    expect(tree.every((n) => n.subgroups.length === 0)).toBe(true);
  });

  it('does not include Global, Options or List-* groups', () => {
    const ids = getDisplayTree('popup').map((n) => n.descriptor.id);
    expect(ids).not.toContain('global');
    expect(ids).not.toContain('options');
    expect(ids).not.toContain('list-rules');
    expect(ids).not.toContain('list-sessions');
    expect(ids).not.toContain('list-home');
    expect(ids).not.toContain('list-workspaces');
  });

  it('exposes every registered shortcut of each retained group', () => {
    for (const node of getDisplayTree('popup')) {
      const entries = getShortcutsByGroup(node.descriptor.id);
      expect(entries.length).toBeGreaterThan(0);
      for (const entry of entries) {
        expect(SHORTCUTS_REGISTRY[entry.id]).toBe(entry);
      }
    }
  });
});
