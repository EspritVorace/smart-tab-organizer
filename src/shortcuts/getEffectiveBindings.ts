import { SHORTCUTS_REGISTRY } from '@/shortcuts/registry';
import type { Binding } from '@/shortcuts/types';

/**
 * Returns the effective bindings for a registry id. At this stage, always
 * resolves to the registry's `defaultBindings`. Centralized so that a future
 * personalization feature can layer storage-backed user overrides here without
 * touching `useShortcuts`, `ShortcutsContent`, or any caller.
 *
 * Returns an empty array for unknown ids (graceful: callers may probe
 * optimistically). An empty array intentionally also represents the future
 * "user disabled this shortcut" state.
 */
export function getEffectiveBindings(id: string): Binding[] {
  const entry = SHORTCUTS_REGISTRY[id];
  return entry ? entry.defaultBindings : [];
}

/**
 * Async variant for callers that will eventually need to await override
 * resolution from `browser.storage.local`. Identical to the sync version
 * today.
 */
export async function getEffectiveBindingsAsync(id: string): Promise<Binding[]> {
  return getEffectiveBindings(id);
}
