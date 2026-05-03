import { describe, it, expect } from 'vitest';
import {
  POPUP_SHORTCUT_GROUPS,
  SHORTCUT_GROUPS,
} from '../src/components/UI/ShortcutsPanel/shortcuts';

describe('POPUP_SHORTCUT_GROUPS', () => {
  it('contains exactly 3 groups in the expected order', () => {
    const titleKeys = POPUP_SHORTCUT_GROUPS.map((g) => g.titleKey);
    expect(titleKeys).toEqual([
      'shortcutsGroupGlobal',
      'shortcutsGroupPopup',
      'shortcutsGroupSessionCard',
    ]);
  });

  it('does not include Options or Lists groups', () => {
    const titleKeys = POPUP_SHORTCUT_GROUPS.map((g) => g.titleKey);
    expect(titleKeys).not.toContain('shortcutsGroupOptions');
    expect(titleKeys).not.toContain('shortcutsGroupLists');
  });

  it('preserves the full shortcuts list of each retained group', () => {
    for (const popupGroup of POPUP_SHORTCUT_GROUPS) {
      const source = SHORTCUT_GROUPS.find((g) => g.titleKey === popupGroup.titleKey);
      expect(source).toBeDefined();
      expect(popupGroup.shortcuts).toEqual(source!.shortcuts);
    }
  });
});
