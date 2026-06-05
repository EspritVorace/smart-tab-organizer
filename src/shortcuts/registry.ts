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
  // serve as documentation and Storybook fallback). Only the popup ships a
  // default (`Ctrl+Shift+1`); organize/save have no default binding because
  // every letter combo clashes with a browser built-in (Firefox treats
  // `Alt+Shift+<letter>` as the page accesskey modifier, and most
  // `Ctrl+Shift+<letter>` are Firefox built-ins). They stay assignable by the
  // user via chrome://extensions/shortcuts, and are reachable from the popup
  // (`popup.organize` = o, `popup.save` = s).
  'global.organize': {
    id: 'global.organize',
    defaultBindings: [],
    descriptionKey: 'shortcutDescOrganize',
    group: 'global',
    scope: 'global',
    commandName: 'organize-all-tabs',
  },
  'global.saveSession': {
    id: 'global.saveSession',
    defaultBindings: [],
    descriptionKey: 'shortcutDescSaveSession',
    group: 'global',
    scope: 'global',
    commandName: 'save-current-window-session',
  },
  'global.openPopup': {
    id: 'global.openPopup',
    defaultBindings: ['Ctrl+Shift+1'],
    descriptionKey: 'shortcutDescOpenPopup',
    group: 'global',
    scope: 'global',
    commandName: '_execute_action',
  },

  // Popup. The four action-binding shortcuts (s/r/o/p) only yield a combo a
  // focused pinned card actually claims: `r` belongs to the card's own widget
  // bindings (sessionCard.restore.*), while o/s/p, which no card registers,
  // keep firing the popup-level action even when a card has focus. `?` is
  // intentionally never widget-suppressed so the help drawer can be summoned
  // from anywhere in the popup.
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

  // Options page-level. Mnemonic two-key sequences (m prefix + destination
  // initial). The `m` letter is reserved as a global sequence prefix: no
  // simple combo at the `global` scope should use it (otherwise the sequence
  // timeout would delay the simple combo).
  'options.nav.home': {
    id: 'options.nav.home',
    defaultBindings: [['m', 'h']],
    descriptionKey: 'shortcutDescNavigateHome',
    group: 'options',
    scope: 'global',
  },
  'options.nav.rules': {
    id: 'options.nav.rules',
    defaultBindings: [['m', 'r']],
    descriptionKey: 'shortcutDescNavigateRules',
    group: 'options',
    scope: 'global',
  },
  'options.nav.sessions': {
    id: 'options.nav.sessions',
    defaultBindings: [['m', 's']],
    descriptionKey: 'shortcutDescNavigateSessions',
    group: 'options',
    scope: 'global',
  },
  'options.nav.stats': {
    id: 'options.nav.stats',
    defaultBindings: [['m', 't']],
    descriptionKey: 'shortcutDescNavigateStats',
    group: 'options',
    scope: 'global',
  },
  'options.nav.importexport': {
    id: 'options.nav.importexport',
    defaultBindings: [['m', 'i']],
    descriptionKey: 'shortcutDescNavigateImportExport',
    group: 'options',
    scope: 'global',
  },
  'options.nav.settings': {
    id: 'options.nav.settings',
    defaultBindings: [['m', 'c']],
    descriptionKey: 'shortcutDescNavigateSettings',
    group: 'options',
    scope: 'global',
  },
  'options.nav.workspaces': {
    id: 'options.nav.workspaces',
    defaultBindings: [['m', 'w']],
    descriptionKey: 'shortcutDescNavigateWorkspaces',
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
  'options.docs.open': {
    id: 'options.docs.open',
    defaultBindings: ['F1'],
    descriptionKey: 'shortcutDescOpenDocs',
    group: 'options',
    scope: 'global',
    allowInTypingTarget: true,
    allowWhenDialogOpen: true,
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
  'ruleCard.moveToFirst': {
    id: 'ruleCard.moveToFirst',
    defaultBindings: ['Mod+ArrowUp'],
    descriptionKey: 'shortcutDescRuleMoveToFirst',
    group: 'list-rules',
    scope: 'widget:rule-card',
  },
  'ruleCard.moveToLast': {
    id: 'ruleCard.moveToLast',
    defaultBindings: ['Mod+ArrowDown'],
    descriptionKey: 'shortcutDescRuleMoveToLast',
    group: 'list-rules',
    scope: 'widget:rule-card',
  },
  'ruleCard.moveToFirstOfDomain': {
    id: 'ruleCard.moveToFirstOfDomain',
    defaultBindings: ['Mod+Shift+ArrowUp'],
    descriptionKey: 'shortcutDescRuleMoveToFirstOfDomain',
    group: 'list-rules',
    scope: 'widget:rule-card',
  },
  'ruleCard.moveToLastOfDomain': {
    id: 'ruleCard.moveToLastOfDomain',
    defaultBindings: ['Mod+Shift+ArrowDown'],
    descriptionKey: 'shortcutDescRuleMoveToLastOfDomain',
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
  'sessionCard.moveToFirst': {
    id: 'sessionCard.moveToFirst',
    defaultBindings: ['Mod+ArrowUp'],
    descriptionKey: 'shortcutDescSessionMoveToFirst',
    group: 'list-sessions',
    scope: 'widget:session-card',
  },
  'sessionCard.moveToLast': {
    id: 'sessionCard.moveToLast',
    defaultBindings: ['Mod+ArrowDown'],
    descriptionKey: 'shortcutDescSessionMoveToLast',
    group: 'list-sessions',
    scope: 'widget:session-card',
  },
  'sessionCard.archive': {
    id: 'sessionCard.archive',
    defaultBindings: ['a'],
    descriptionKey: 'shortcutDescSessionArchive',
    group: 'list-sessions',
    scope: 'widget:session-card',
  },
  // Jump between session sections (pinned -> active -> archived). Crosses the
  // active/archived sub-tab boundary when needed (handled in SessionsPage).
  'sessionCard.sectionNext': {
    id: 'sessionCard.sectionNext',
    defaultBindings: ['PageDown'],
    descriptionKey: 'shortcutDescSessionSectionNext',
    group: 'list-sessions',
    scope: 'widget:session-card',
  },
  'sessionCard.sectionPrev': {
    id: 'sessionCard.sectionPrev',
    defaultBindings: ['PageUp'],
    descriptionKey: 'shortcutDescSessionSectionPrev',
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

  // List-level: Statistics. PageDown / PageUp move between the stats sub-tabs
  // (summary -> rules -> sessions -> storage), clamped at the ends. Handled in
  // StatisticsPage.
  'list.stats.tabNext': {
    id: 'list.stats.tabNext',
    defaultBindings: ['PageDown'],
    descriptionKey: 'shortcutDescStatsTabNext',
    group: 'list-stats',
    scope: 'page:stats',
  },
  'list.stats.tabPrev': {
    id: 'list.stats.tabPrev',
    defaultBindings: ['PageUp'],
    descriptionKey: 'shortcutDescStatsTabPrev',
    group: 'list-stats',
    scope: 'page:stats',
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
  // Page-level quick actions on the Home tab. Yield to focused widgets so a
  // session card on the page keeps its own bindings authoritative.
  'home.action.organize': {
    id: 'home.action.organize',
    defaultBindings: ['o'],
    descriptionKey: 'shortcutDescHomeOrganize',
    group: 'list-home',
    scope: 'page:home',
    excludeIfInsideWidget: true,
  },
  'home.action.snapshot': {
    id: 'home.action.snapshot',
    defaultBindings: ['s'],
    descriptionKey: 'shortcutDescHomeSnapshot',
    group: 'list-home',
    scope: 'page:home',
    excludeIfInsideWidget: true,
  },
  'home.action.newRule': {
    id: 'home.action.newRule',
    defaultBindings: ['n'],
    descriptionKey: 'shortcutDescHomeNewRule',
    group: 'list-home',
    scope: 'page:home',
    excludeIfInsideWidget: true,
  },
  'home.action.io': {
    id: 'home.action.io',
    defaultBindings: ['i'],
    descriptionKey: 'shortcutDescHomeImportExport',
    group: 'list-home',
    scope: 'page:home',
    excludeIfInsideWidget: true,
  },
  'home.action.stats': {
    id: 'home.action.stats',
    defaultBindings: ['t'],
    descriptionKey: 'shortcutDescHomeStats',
    group: 'list-home',
    scope: 'page:home',
    excludeIfInsideWidget: true,
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
  'sessionCard.refresh': {
    id: 'sessionCard.refresh',
    defaultBindings: ['u'],
    descriptionKey: 'shortcutDescSessionRefresh',
    group: 'session-card',
    scope: 'widget:session-card',
  },
  // Expand / collapse the focused card's tab-and-group preview. Handled
  // locally on the card (it owns the `previewOpen` state); the registry entry
  // is documentation-only, like `list.sessions.navigate`.
  'sessionCard.expandPreview': {
    id: 'sessionCard.expandPreview',
    defaultBindings: ['ArrowRight'],
    descriptionKey: 'shortcutDescSessionExpandPreview',
    group: 'session-card',
    scope: 'widget:session-card',
  },
  'sessionCard.collapsePreview': {
    id: 'sessionCard.collapsePreview',
    defaultBindings: ['ArrowLeft'],
    descriptionKey: 'shortcutDescSessionCollapsePreview',
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
