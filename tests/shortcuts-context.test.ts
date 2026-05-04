import { describe, it, expect } from 'vitest';
import {
  isGroupOpenByDefault,
  SHORTCUT_GROUPS,
  type PageContext,
  type ShortcutGroup,
} from '../src/components/UI/ShortcutsPanel/shortcuts';

const ALL_CONTEXTS: PageContext[] = [
  'rules',
  'sessions',
  'importexport',
  'stats',
  'settings',
  'workspaces',
];

const ALL_CONTEXTS_AND_DRAWER: (PageContext | undefined)[] = [...ALL_CONTEXTS, undefined];

function flattenGroups(groups: ShortcutGroup[]): ShortcutGroup[] {
  return groups.flatMap((g) => [g, ...flattenGroups(g.subgroups ?? [])]);
}

describe('isGroupOpenByDefault', () => {
  it('keeps Global and Options groups open in every context', () => {
    for (const ctx of ALL_CONTEXTS) {
      expect(isGroupOpenByDefault('shortcutsGroupGlobal', ctx)).toBe(true);
      expect(isGroupOpenByDefault('shortcutsGroupOptions', ctx)).toBe(true);
    }
  });

  it('opens the rules list group only on the rules page', () => {
    for (const ctx of ALL_CONTEXTS) {
      expect(isGroupOpenByDefault('shortcutsGroupListRules', ctx)).toBe(ctx === 'rules');
    }
  });

  it('opens the sessions list and session card groups only on the sessions page', () => {
    for (const ctx of ALL_CONTEXTS) {
      const expected = ctx === 'sessions';
      expect(isGroupOpenByDefault('shortcutsGroupListSessions', ctx)).toBe(expected);
      expect(isGroupOpenByDefault('shortcutsGroupSessionCard', ctx)).toBe(expected);
    }
  });

  it('keeps the popup group collapsed on every options page but open in the popup drawer', () => {
    for (const ctx of ALL_CONTEXTS) {
      expect(isGroupOpenByDefault('shortcutsGroupPopup', ctx)).toBe(false);
    }
    expect(isGroupOpenByDefault('shortcutsGroupPopup', undefined)).toBe(true);
  });

  it('returns false for an unknown title without a context', () => {
    expect(isGroupOpenByDefault('shortcutsGroupListRules', undefined)).toBe(false);
    expect(isGroupOpenByDefault('unknown-group', 'rules')).toBe(false);
  });

  it('covers every group declared in SHORTCUT_GROUPS (including subgroups)', () => {
    for (const group of flattenGroups(SHORTCUT_GROUPS)) {
      const opensSomewhere = ALL_CONTEXTS_AND_DRAWER.some((ctx) =>
        isGroupOpenByDefault(group.titleKey, ctx),
      );
      expect(opensSomewhere, `group ${group.titleKey} never opens`).toBe(true);
    }
  });
});
