export type ShortcutScope =
  | 'global'
  | 'page:home'
  | 'page:rules'
  | 'page:sessions'
  | 'page:importexport'
  | 'page:stats'
  | 'page:settings'
  | 'page:workspaces'
  | 'page:popup'
  | 'widget:session-card'
  | 'widget:rule-card';

export type ShortcutGroupId =
  | 'global'
  | 'options'
  | 'popup'
  | 'list-rules'
  | 'list-sessions'
  | 'list-workspaces'
  | 'list-home'
  | 'session-card';

export interface ShortcutEntry {
  /** Stable ID. Doubles as customization key and test selector. */
  id: string;

  /**
   * Default combos. Multiple entries are equivalent alternative bindings.
   * Kept as plain strings for now; Lot 3 will widen to support key sequences.
   */
  defaultBindings: string[];

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
   * Manifest `commands` entry name. When set, the panel reads the live combo
   * from `browser.commands.getAll()` instead of `defaultBindings` so it
   * reflects any per-user customization done via the browser UI.
   */
  commandName?: string;
}
