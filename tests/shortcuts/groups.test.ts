import { describe, it, expect } from 'vitest';
import {
  getDisplayTree,
  isGroupOpenByDefault,
  GROUP_DESCRIPTORS,
  type PageContext,
} from '../../src/shortcuts/groups';

const ALL_CONTEXTS: PageContext[] = [
  'home',
  'rules',
  'sessions',
  'importexport',
  'stats',
  'settings',
  'workspaces',
];

const ALL_CONTEXTS_AND_DRAWER: (PageContext | undefined)[] = [...ALL_CONTEXTS, undefined];

describe('getDisplayTree("popup")', () => {
  it('returns Popup and SessionCard at the top level, no subgroups', () => {
    const tree = getDisplayTree('popup');
    expect(tree.map((n) => n.descriptor.id)).toEqual(['popup', 'session-card']);
    expect(tree.every((n) => n.subgroups.length === 0)).toBe(true);
  });
});

describe('getDisplayTree("options")', () => {
  it('returns the 8 top-level groups in sidebar order (page groups first, options/popup next, global last)', () => {
    const tree = getDisplayTree('options');
    expect(tree.map((n) => n.descriptor.id)).toEqual([
      'list-home',
      'list-rules',
      'list-sessions',
      'importexport',
      'list-workspaces',
      'options',
      'popup',
      'global',
    ]);
  });

  it('nests SessionCard inside list-home and list-sessions, never elsewhere', () => {
    const tree = getDisplayTree('options');
    const subIdsByGroup = Object.fromEntries(
      tree.map((node) => [node.descriptor.id, node.subgroups.map((d) => d.id)]),
    );
    expect(subIdsByGroup['list-home']).toEqual(['session-card']);
    expect(subIdsByGroup['list-sessions']).toEqual(['session-card']);
    for (const id of ['global', 'list-rules', 'list-workspaces', 'importexport', 'options', 'popup'] as const) {
      expect(subIdsByGroup[id]).toEqual([]);
    }
  });

  it('does not show SessionCard at the top level', () => {
    const tree = getDisplayTree('options');
    expect(tree.map((n) => n.descriptor.id)).not.toContain('session-card');
  });
});

describe('isGroupOpenByDefault', () => {
  it('keeps Global and Options open in every context', () => {
    for (const ctx of ALL_CONTEXTS) {
      expect(isGroupOpenByDefault('global', ctx)).toBe(true);
      expect(isGroupOpenByDefault('options', ctx)).toBe(true);
    }
  });

  it('opens list-rules only on the rules page', () => {
    for (const ctx of ALL_CONTEXTS) {
      expect(isGroupOpenByDefault('list-rules', ctx)).toBe(ctx === 'rules');
    }
  });

  it('opens list-sessions only on the sessions page', () => {
    for (const ctx of ALL_CONTEXTS) {
      expect(isGroupOpenByDefault('list-sessions', ctx)).toBe(ctx === 'sessions');
    }
  });

  it('opens list-home only on the home page', () => {
    for (const ctx of ALL_CONTEXTS) {
      expect(isGroupOpenByDefault('list-home', ctx)).toBe(ctx === 'home');
    }
  });

  it('opens list-workspaces only on the workspaces page', () => {
    for (const ctx of ALL_CONTEXTS) {
      expect(isGroupOpenByDefault('list-workspaces', ctx)).toBe(ctx === 'workspaces');
    }
  });

  it('opens importexport only on the importexport page', () => {
    for (const ctx of ALL_CONTEXTS) {
      expect(isGroupOpenByDefault('importexport', ctx)).toBe(ctx === 'importexport');
    }
  });

  it('opens session-card on both Sessions and Home pages', () => {
    for (const ctx of ALL_CONTEXTS) {
      expect(isGroupOpenByDefault('session-card', ctx)).toBe(
        ctx === 'sessions' || ctx === 'home',
      );
    }
  });

  it('keeps popup collapsed on every options page but open in the drawer', () => {
    for (const ctx of ALL_CONTEXTS) {
      expect(isGroupOpenByDefault('popup', ctx)).toBe(false);
    }
    expect(isGroupOpenByDefault('popup', undefined)).toBe(true);
  });

  it('every declared group opens somewhere in the matrix', () => {
    for (const id of Object.keys(GROUP_DESCRIPTORS) as Array<keyof typeof GROUP_DESCRIPTORS>) {
      const opensSomewhere = ALL_CONTEXTS_AND_DRAWER.some((ctx) =>
        isGroupOpenByDefault(id, ctx),
      );
      expect(opensSomewhere, `group ${id} never opens`).toBe(true);
    }
  });
});
