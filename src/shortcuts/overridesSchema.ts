import { z } from 'zod';

/**
 * Schema for user shortcut overrides. Reserved for future personalization;
 * not yet wired to any storage.
 *
 * Storage location (when activated): `browser.storage.local['shortcutOverrides']`.
 *
 * Each entry maps a registry id to an array of `Binding` values, mirroring
 * `ShortcutEntry.defaultBindings`. A binding is either a combo string
 * (`'Mod+S'`) or an ordered key sequence (at least 2 elements,
 * `['i', 'r']`). An empty array means the user explicitly disabled the
 * shortcut; a missing key falls back to the default.
 */
export const ShortcutOverridesSchema = z.record(
  z.string(),
  z.array(z.union([z.string(), z.array(z.string()).min(2)])),
);

export type ShortcutOverrides = z.infer<typeof ShortcutOverridesSchema>;
