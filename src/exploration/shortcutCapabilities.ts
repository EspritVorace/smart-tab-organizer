import { SHORTCUTS_REGISTRY } from '@/shortcuts/registry.js';
import { markDiscovered } from './progressStore.js';

/**
 * Maps a triggered shortcut to the exploration capability it reveals. The
 * mapping is intentionally coarse (US decision 5): shortcuts are grouped into a
 * few capabilities (mnemonics, sequences, global commands, search, help, F1,
 * list/reorder keyboard, workspace switch), not one capability per shortcut id.
 */
const CAPABILITY_BY_SHORTCUT_ID: Record<string, string> = {
  'options.search.focus': 'nav.globalSearch',
  'options.help': 'help.drawer',
  'popup.help': 'help.drawer',
  'options.docs.open': 'help.contextF1',
  'theme.toggle': 'settings.theme',
};

const CAPABILITIES_BY_GROUP: Record<string, string[]> = {
  options: ['nav.mnemonics'],
  workspace: ['nav.workspaceSwitchKeyboard', 'workspaces.switch'],
  importexport: ['nav.sequences'],
  global: ['nav.globalCommands'],
};

/**
 * Marks the exploration capability for a triggered shortcut. Called once from
 * the central `useShortcuts` dispatch, never from individual callers. Sequence
 * IDs (m+letter, w+letter, i/e+letter) map through their group; specific combos
 * map through the id table. Fire-and-forget.
 */
export function markShortcutCapability(shortcutId: string): void {
  const direct = CAPABILITY_BY_SHORTCUT_ID[shortcutId];
  if (direct) {
    void markDiscovered(direct);
    return;
  }
  const entry = SHORTCUTS_REGISTRY[shortcutId];
  if (!entry) return;

  if (shortcutId.includes('reorder') || shortcutId.includes('moveTo')) {
    void markDiscovered('nav.reorderKeyboard');
    return;
  }
  if (shortcutId.includes('navigate')) {
    void markDiscovered('nav.listKeyboard');
    return;
  }
  for (const capability of CAPABILITIES_BY_GROUP[entry.group] ?? []) {
    void markDiscovered(capability);
  }
}
