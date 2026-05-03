import { describe, it, expect } from 'vitest';
import {
  isGroupOpenByDefault,
  SHORTCUT_GROUPS,
  type PageContext,
} from '../src/components/UI/ShortcutsPanel/shortcuts';

const ALL_CONTEXTS: PageContext[] = [
  'rules',
  'sessions',
  'importexport',
  'stats',
  'settings',
  'workspaces',
];

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

  it('returns false for an unknown title without a context', () => {
    expect(isGroupOpenByDefault('shortcutsGroupListRules', undefined)).toBe(false);
    expect(isGroupOpenByDefault('unknown-group', 'rules')).toBe(false);
  });

  it('covers every group declared in SHORTCUT_GROUPS', () => {
    for (const group of SHORTCUT_GROUPS) {
      const opensSomewhere = ALL_CONTEXTS.some((ctx) =>
        isGroupOpenByDefault(group.titleKey, ctx),
      );
      expect(opensSomewhere, `group ${group.titleKey} never opens`).toBe(true);
    }
  });
});
