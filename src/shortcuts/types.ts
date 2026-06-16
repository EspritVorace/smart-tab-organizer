export type ShortcutScope =
  | 'global'
  | 'page:home'
  | 'page:rules'
  | 'page:sessions'
  | 'page:importexport'
  | 'page:stats'
  | 'page:settings'
  | 'page:workspaces'
  | 'page:exploration'
  | 'page:popup'
  | 'widget:session-card'
  | 'widget:rule-card'
  | 'widget:rule-group'
  | 'widget:workspace-card'
  | 'widget:exploration-card';

export type ShortcutGroupId =
  | 'global'
  | 'options'
  | 'popup'
  | 'workspace'
  | 'list-rules'
  | 'list-sessions'
  | 'list-stats'
  | 'list-exploration'
  | 'list-workspaces'
  | 'list-home'
  | 'session-card'
  | 'importexport';

/**
 * A single combo (e.g. `'Mod+K'`) OR an ordered sequence of combos (e.g.
 * `['i', 'r']`). Sequences match as a chord: each step must be pressed within
 * the timeout window of the previous one.
 */
export type Binding = string | string[];

export interface ShortcutEntry {
  /** Stable ID. Doubles as customization key and test selector. */
  id: string;

  /**
   * Default bindings. Multiple entries are equivalent alternatives. Each
   * entry is either a single combo string or an ordered sequence of combos.
   */
  defaultBindings: Binding[];

  /** i18n key for the description shown in the help panel. */
  descriptionKey: string;

  /** Display group in the help panel. */
  group: ShortcutGroupId;

  /** Where the shortcut is active. */
  scope: ShortcutScope;

  /** When true, fires even if focus is on an input/textarea/contenteditable. */
  allowInTypingTarget?: boolean;

  /** When true, fires even if a Radix dialog is open. */
  allowWhenDialogOpen?: boolean;

  /**
   * When true (only meaningful for `global` and `page:*` scopes), the
   * shortcut is suppressed only when the focused widget actually registers a
   * binding for the same combo. Lets a focused widget claim the conflicting
   * combos it owns (e.g. `r` belongs to the focused session card, not the
   * popup-level restore action) while leaving the others (`o`/`s`/`p`), which
   * no widget claims, free to fire the page-level action.
   */
  excludeIfInsideWidget?: boolean;

  /**
   * Manifest `commands` entry name. When set, the panel reads the live combo
   * from `browser.commands.getAll()` instead of `defaultBindings` so it
   * reflects any per-user customization done via the browser UI.
   */
  commandName?: string;
}
