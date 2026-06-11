/**
 * Registers the global `theme.toggle` keyboard shortcut (`D` as in "Dark").
 * Mounted on both the options surface and the popup so the same shortcut
 * cycles the theme (Light -> Dark -> System) wherever the user is. The
 * `global` scope attaches a document-level listener; the default contextual
 * filters keep it inert while typing in inputs or when a dialog is open.
 */

import { useThemeCycle } from './useThemeCycle';
import { useShortcuts } from './useShortcuts';

export function useThemeToggleShortcut(): void {
  const { cycleTheme } = useThemeCycle();
  useShortcuts({ 'theme.toggle': cycleTheme }, { scope: 'global' });
}
