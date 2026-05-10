/**
 * Single source of truth for keyboard shortcut definitions. The display panel
 * (`ShortcutsContent`) and the dispatch hook (`useShortcuts`, Lot 2+) both
 * read this map. Combos use the `Mod` modifier where the OS-native primary
 * modifier is intended; arrow keys, Enter, Tab, etc. use their canonical
 * `event.key` name (`ArrowUp`, `Enter`, `Tab`...).
 */

import type { ShortcutEntry, ShortcutGroupId, ShortcutScope } from './types';

export const SHORTCUTS_REGISTRY: Record<string, ShortcutEntry> = {
  // Browser-wide commands declared in the manifest. Bindings shown in the panel
  // come from `browser.commands.getAll()`, not from `defaultBindings` (those
  // serve as documentation and Storybook fallback).
  'global.organize': {
    id: 'global.organize',
    defaultBindings: ['Alt+Shift+O'],
    descriptionKey: 'shortcutDescOrganize',
    group: 'global',
    scope: 'global',
    commandName: 'organize-all-tabs',
  },
  'global.saveSession': {
    id: 'global.saveSession',
    defaultBindings: ['Alt+Shift+S'],
    descriptionKey: 'shortcutDescSaveSession',
    group: 'global',
    scope: 'global',
    commandName: 'save-current-window-session',
  },
  'global.openPopup': {
    id: 'global.openPopup',
    defaultBindings: ['Alt+Shift+P'],
    descriptionKey: 'shortcutDescOpenPopup',
    group: 'global',
    scope: 'global',
    commandName: '_execute_action',
  },

  // Popup. The four action-binding shortcuts (s/r/o/p) yield to a focused
  // pinned card so the card's own widget bindings (sessionCard.restore.*)
  // stay authoritative; `?` is intentionally never widget-suppressed so the
  // help drawer can be summoned from anywhere in the popup.
  'popup.save': {
    id: 'popup.save',
    defaultBindings: ['s'],
    descriptionKey: 'shortcutDescPopupSave',
    group: 'popup',
    scope: 'page:popup',
    excludeIfInsideWidget: true,
  },
  'popup.restore': {
    id: 'popup.restore',
    defaultBindings: ['r'],
    descriptionKey: 'shortcutDescPopupRestore',
    group: 'popup',
    scope: 'page:popup',
    excludeIfInsideWidget: true,
  },
  'popup.organize': {
    id: 'popup.organize',
    defaultBindings: ['o'],
    descriptionKey: 'shortcutDescPopupOrganize',
    group: 'popup',
    scope: 'page:popup',
    excludeIfInsideWidget: true,
  },
  'popup.options': {
    id: 'popup.options',
    defaultBindings: ['p'],
    descriptionKey: 'shortcutDescPopupOptions',
    group: 'popup',
    scope: 'page:popup',
    excludeIfInsideWidget: true,
  },
  'popup.help': {
    id: 'popup.help',
    defaultBindings: ['?'],
    descriptionKey: 'shortcutDescOpenShortcutsHelp',
    group: 'popup',
    scope: 'page:popup',
  },

  // Options page-level
  'options.tab.1': {
    id: 'options.tab.1',
    defaultBindings: ['Alt+1'],
    descriptionKey: 'shortcutDescNavigateTabs',
    group: 'options',
    scope: 'global',
  },
  'options.tab.2': {
    id: 'options.tab.2',
    defaultBindings: ['Alt+2'],
    descriptionKey: 'shortcutDescNavigateTabs',
    group: 'options',
    scope: 'global',
  },
  'options.tab.3': {
    id: 'options.tab.3',
    defaultBindings: ['Alt+3'],
    descriptionKey: 'shortcutDescNavigateTabs',
    group: 'options',
    scope: 'global',
  },
  'options.tab.4': {
    id: 'options.tab.4',
    defaultBindings: ['Alt+4'],
    descriptionKey: 'shortcutDescNavigateTabs',
    group: 'options',
    scope: 'global',
  },
  'options.tab.5': {
    id: 'options.tab.5',
    defaultBindings: ['Alt+5'],
    descriptionKey: 'shortcutDescNavigateTabs',
    group: 'options',
    scope: 'global',
  },
  'options.search.focus': {
    id: 'options.search.focus',
    defaultBindings: ['/'],
    descriptionKey: 'shortcutDescFocusSearch',
    group: 'options',
    scope: 'global',
  },
  'options.search.clear': {
    id: 'options.search.clear',
    defaultBindings: ['Escape'],
    descriptionKey: 'shortcutDescClearSearch',
    group: 'options',
    scope: 'global',
  },
  'options.help': {
    id: 'options.help',
    defaultBindings: ['?'],
    descriptionKey: 'shortcutDescOpenShortcutsHelp',
    group: 'options',
    scope: 'global',
  },

  // List-level: Rules
  'list.rules.navigate': {
    id: 'list.rules.navigate',
    defaultBindings: ['ArrowUp', 'ArrowDown'],
    descriptionKey: 'shortcutDescListNavigate',
    group: 'list-rules',
    scope: 'page:rules',
  },
  'list.rules.new': {
    id: 'list.rules.new',
    defaultBindings: ['n'],
    descriptionKey: 'shortcutDescListNew',
    group: 'list-rules',
    scope: 'page:rules',
  },
  // Per-card actions: only fire when a rule card itself has focus. They keep
  // the same display group (`list-rules`) so the help panel still shows them
  // under "Rules list", but their scope is widget so the page-level handler
  // doesn't fight with focused-card shortcuts.
  'ruleCard.edit': {
    id: 'ruleCard.edit',
    defaultBindings: ['e'],
    descriptionKey: 'shortcutDescListEdit',
    group: 'list-rules',
    scope: 'widget:rule-card',
  },
  'ruleCard.toggleSelection': {
    id: 'ruleCard.toggleSelection',
    defaultBindings: ['Space'],
    descriptionKey: 'shortcutDescListToggleSelection',
    group: 'list-rules',
    scope: 'widget:rule-card',
  },
  'ruleCard.toggleEnabled': {
    id: 'ruleCard.toggleEnabled',
    defaultBindings: ['t'],
    descriptionKey: 'shortcutDescListToggleEnabled',
    group: 'list-rules',
    scope: 'widget:rule-card',
  },
  'ruleCard.delete': {
    id: 'ruleCard.delete',
    defaultBindings: ['Delete'],
    descriptionKey: 'shortcutDescListDelete',
    group: 'list-rules',
    scope: 'widget:rule-card',
  },
  'list.rules.reorderKeyboard': {
    id: 'list.rules.reorderKeyboard',
    defaultBindings: ['Space'],
    descriptionKey: 'shortcutDescListReorderKeyboard',
    group: 'list-rules',
    scope: 'page:rules',
  },

  // List-level: Sessions
  'list.sessions.navigate': {
    id: 'list.sessions.navigate',
    defaultBindings: ['ArrowUp', 'ArrowDown'],
    descriptionKey: 'shortcutDescListNavigate',
    group: 'list-sessions',
    scope: 'page:sessions',
  },
  'list.sessions.new': {
    id: 'list.sessions.new',
    defaultBindings: ['n'],
    descriptionKey: 'shortcutDescListNew',
    group: 'list-sessions',
    scope: 'page:sessions',
  },
  // Per-card actions on the Sessions page (Edit/Delete/Pin). Group stays
  // `list-sessions` so the help panel keeps them under "Sessions list" while
  // the scope ties them to the focused session card.
  'sessionCard.edit': {
    id: 'sessionCard.edit',
    defaultBindings: ['e'],
    descriptionKey: 'shortcutDescListEdit',
    group: 'list-sessions',
    scope: 'widget:session-card',
  },
  'sessionCard.delete': {
    id: 'sessionCard.delete',
    defaultBindings: ['Delete'],
    descriptionKey: 'shortcutDescListDelete',
    group: 'list-sessions',
    scope: 'widget:session-card',
  },
  'sessionCard.pin': {
    id: 'sessionCard.pin',
    defaultBindings: ['p'],
    descriptionKey: 'shortcutDescListPin',
    group: 'list-sessions',
    scope: 'widget:session-card',
  },
  'list.sessions.reorderKeyboard': {
    id: 'list.sessions.reorderKeyboard',
    defaultBindings: ['Space'],
    descriptionKey: 'shortcutDescListReorderKeyboard',
    group: 'list-sessions',
    scope: 'page:sessions',
  },

  // List-level: Workspaces
  'list.workspaces.new': {
    id: 'list.workspaces.new',
    defaultBindings: ['n'],
    descriptionKey: 'shortcutDescListNew',
    group: 'list-workspaces',
    scope: 'page:workspaces',
  },

  // List-level: Home
  'list.home.navigate': {
    id: 'list.home.navigate',
    defaultBindings: ['ArrowLeft', 'ArrowRight'],
    descriptionKey: 'shortcutDescListNavigate',
    group: 'list-home',
    scope: 'page:home',
  },
  'list.home.firstLast': {
    id: 'list.home.firstLast',
    defaultBindings: ['Home', 'End'],
    descriptionKey: 'shortcutDescHomeFirstLast',
    group: 'list-home',
    scope: 'page:home',
  },
  'list.home.nextSection': {
    id: 'list.home.nextSection',
    defaultBindings: ['Tab'],
    descriptionKey: 'shortcutDescHomeNextSection',
    group: 'list-home',
    scope: 'page:home',
  },
  'list.home.activate': {
    id: 'list.home.activate',
    defaultBindings: ['Enter'],
    descriptionKey: 'shortcutDescHomeActivate',
    group: 'list-home',
    scope: 'page:home',
  },

  // Widget: SessionCard (active when a session card has focus)
  'sessionCard.restore.custom': {
    id: 'sessionCard.restore.custom',
    defaultBindings: ['r'],
    descriptionKey: 'shortcutDescSessionRestoreCustom',
    group: 'session-card',
    scope: 'widget:session-card',
  },
  'sessionCard.restore.current': {
    id: 'sessionCard.restore.current',
    defaultBindings: ['Shift+r'],
    descriptionKey: 'shortcutDescSessionRestoreCurrent',
    group: 'session-card',
    scope: 'widget:session-card',
  },
  'sessionCard.restore.replace': {
    id: 'sessionCard.restore.replace',
    defaultBindings: ['Alt+r'],
    descriptionKey: 'shortcutDescSessionReplaceCurrent',
    group: 'session-card',
    scope: 'widget:session-card',
  },
  'sessionCard.restore.new': {
    id: 'sessionCard.restore.new',
    defaultBindings: ['Alt+Shift+r'],
    descriptionKey: 'shortcutDescSessionRestoreNew',
    group: 'session-card',
    scope: 'widget:session-card',
  },

  // Page: Import/Export. Mnemonic two-key sequences (i/e prefix + target
  // initial). The `i` and `e` letters are reserved as sequence prefixes in
  // this scope: no simple combo may use them so the sequence timeout never
  // delays a single keypress (enforced by registry invariant test).
  'importexport.import.rules': {
    id: 'importexport.import.rules',
    defaultBindings: [['i', 'r']],
    descriptionKey: 'shortcutDescImportRules',
    group: 'importexport',
    scope: 'page:importexport',
  },
  'importexport.import.sessions': {
    id: 'importexport.import.sessions',
    defaultBindings: [['i', 's']],
    descriptionKey: 'shortcutDescImportSessions',
    group: 'importexport',
    scope: 'page:importexport',
  },
  'importexport.import.workspaces': {
    id: 'importexport.import.workspaces',
    defaultBindings: [['i', 'w']],
    descriptionKey: 'shortcutDescImportWorkspaces',
    group: 'importexport',
    scope: 'page:importexport',
  },
  'importexport.export.rules': {
    id: 'importexport.export.rules',
    defaultBindings: [['e', 'r']],
    descriptionKey: 'shortcutDescExportRules',
    group: 'importexport',
    scope: 'page:importexport',
  },
  'importexport.export.sessions': {
    id: 'importexport.export.sessions',
    defaultBindings: [['e', 's']],
    descriptionKey: 'shortcutDescExportSessions',
    group: 'importexport',
    scope: 'page:importexport',
  },
  'importexport.export.workspaces': {
    id: 'importexport.export.workspaces',
    defaultBindings: [['e', 'w']],
    descriptionKey: 'shortcutDescExportWorkspaces',
    group: 'importexport',
    scope: 'page:importexport',
  },
};

export function getShortcutsByScope(scope: ShortcutScope): ShortcutEntry[] {
  return Object.values(SHORTCUTS_REGISTRY).filter((s) => s.scope === scope);
}

export function getShortcutsByGroup(group: ShortcutGroupId): ShortcutEntry[] {
  return Object.values(SHORTCUTS_REGISTRY).filter((s) => s.group === group);
}
