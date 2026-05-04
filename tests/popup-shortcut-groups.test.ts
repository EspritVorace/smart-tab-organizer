import { describe, it, expect } from 'vitest';
import {
  POPUP_SHORTCUT_GROUPS,
  SHORTCUT_GROUPS,
  type ShortcutGroup,
} from '../src/components/UI/ShortcutsPanel/shortcuts';

function flattenGroups(groups: ShortcutGroup[]): ShortcutGroup[] {
  return groups.flatMap((g) => [g, ...flattenGroups(g.subgroups ?? [])]);
}

describe('POPUP_SHORTCUT_GROUPS', () => {
  it('contains exactly 2 groups in the expected order', () => {
    const titleKeys = POPUP_SHORTCUT_GROUPS.map((g) => g.titleKey);
    expect(titleKeys).toEqual([
      'shortcutsGroupPopup',
      'shortcutsGroupSessionCard',
    ]);
  });

  it('does not include Global, Options or List groups', () => {
    const titleKeys = POPUP_SHORTCUT_GROUPS.map((g) => g.titleKey);
    expect(titleKeys).not.toContain('shortcutsGroupGlobal');
    expect(titleKeys).not.toContain('shortcutsGroupOptions');
    expect(titleKeys).not.toContain('shortcutsGroupListRules');
    expect(titleKeys).not.toContain('shortcutsGroupListSessions');
  });

  it('preserves the full shortcuts list of each retained group', () => {
    const allOptionsGroups = flattenGroups(SHORTCUT_GROUPS);
    for (const popupGroup of POPUP_SHORTCUT_GROUPS) {
      const source = allOptionsGroups.find((g) => g.titleKey === popupGroup.titleKey);
      expect(source).toBeDefined();
      expect(popupGroup.shortcuts).toEqual(source!.shortcuts);
    }
  });
});
