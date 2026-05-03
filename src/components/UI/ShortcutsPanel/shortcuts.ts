/**
 * Display-only data for the shortcuts cheatsheet. Keys are formatted strings
 * (e.g. "Alt+Shift+O", "Shift+R", "?", "Esc") split on `+` for rendering as a
 * row of <kbd> tokens. Descriptions are i18n keys resolved at render time.
 */

export interface ShortcutDisplay {
  /** Multiple combos for the same action display as comma-separated rows. */
  keys: string[];
  descriptionKey: string;
  /**
   * When set, the panel reads the live binding from `browser.commands.getAll()`
   * and displays it instead of `keys`. `keys` is kept as a fallback for
   * Storybook and for the moment before the async read resolves.
   */
  commandName?: string;
}

export interface ShortcutGroup {
  titleKey: string;
  shortcuts: ShortcutDisplay[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    titleKey: 'shortcutsGroupGlobal',
    shortcuts: [
      { keys: ['Alt+Shift+O'], descriptionKey: 'shortcutDescOrganize', commandName: 'organize-all-tabs' },
      { keys: ['Alt+Shift+S'], descriptionKey: 'shortcutDescSaveSession', commandName: 'save-current-window-session' },
      { keys: ['Alt+Shift+P'], descriptionKey: 'shortcutDescOpenPopup', commandName: '_execute_action' },
    ],
  },
  {
    titleKey: 'shortcutsGroupPopup',
    shortcuts: [
      { keys: ['S'], descriptionKey: 'shortcutDescPopupSave' },
      { keys: ['R'], descriptionKey: 'shortcutDescPopupRestore' },
      { keys: ['O'], descriptionKey: 'shortcutDescPopupOrganize' },
      { keys: ['?'], descriptionKey: 'shortcutDescOpenShortcutsHelp' },
    ],
  },
  {
    titleKey: 'shortcutsGroupOptions',
    shortcuts: [
      { keys: ['Alt+1', 'Alt+2', 'Alt+3', 'Alt+4', 'Alt+5'], descriptionKey: 'shortcutDescNavigateTabs' },
      { keys: ['/'], descriptionKey: 'shortcutDescFocusSearch' },
      { keys: ['Esc'], descriptionKey: 'shortcutDescClearSearch' },
      { keys: ['?'], descriptionKey: 'shortcutDescOpenShortcutsHelp' },
    ],
  },
  {
    titleKey: 'shortcutsGroupLists',
    shortcuts: [
      { keys: ['↑', '↓'], descriptionKey: 'shortcutDescListNavigate' },
      { keys: ['n'], descriptionKey: 'shortcutDescListNew' },
      { keys: ['e'], descriptionKey: 'shortcutDescListEdit' },
      { keys: ['Space'], descriptionKey: 'shortcutDescListToggleSelection' },
      { keys: ['t'], descriptionKey: 'shortcutDescListToggleEnabled' },
      { keys: ['Del'], descriptionKey: 'shortcutDescListDelete' },
      { keys: ['p'], descriptionKey: 'shortcutDescListPin' },
    ],
  },
  {
    titleKey: 'shortcutsGroupSessionCard',
    shortcuts: [
      { keys: ['R'], descriptionKey: 'shortcutDescSessionRestoreCustom' },
      { keys: ['Shift+R'], descriptionKey: 'shortcutDescSessionRestoreCurrent' },
      { keys: ['Alt+R'], descriptionKey: 'shortcutDescSessionReplaceCurrent' },
      { keys: ['Alt+Shift+R'], descriptionKey: 'shortcutDescSessionRestoreNew' },
    ],
  },
];

const POPUP_GROUP_KEYS = [
  'shortcutsGroupGlobal',
  'shortcutsGroupPopup',
  'shortcutsGroupSessionCard',
] as const;

export const POPUP_SHORTCUT_GROUPS: ShortcutGroup[] = POPUP_GROUP_KEYS
  .map((key) => SHORTCUT_GROUPS.find((g) => g.titleKey === key))
  .filter((g): g is ShortcutGroup => g !== undefined);
