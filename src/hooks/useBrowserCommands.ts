import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { logger } from '@/utils/logger.js';

/**
 * Map of manifest command names to their currently bound shortcut.
 * The shortcut is an empty string when Chrome did not auto-apply
 * `suggested_key` (typical when commands were added via an extension update)
 * or when the user cleared the binding in chrome://extensions/shortcuts.
 *
 * `null` means the API call has not resolved yet (or `browser.commands` is
 * unavailable, e.g. in Storybook). Callers should fall back to the static
 * `keys` declared in `shortcuts.ts` until a value is loaded.
 */
export type BrowserCommandsMap = Record<string, string>;

/**
 * Reads the live shortcut bindings via `browser.commands.getAll()` so the
 * cheatsheet can show the actual key (or "not set") instead of a hardcoded
 * suggestion that may not match what the browser bound.
 *
 * Aliases `_execute_browser_action` (Firefox MV2) to `_execute_action` so the
 * popup entry has a single canonical name across browsers.
 */
export function useBrowserCommands(): BrowserCommandsMap | null {
  const [commands, setCommands] = useState<BrowserCommandsMap | null>(null);

  useEffect(() => {
    if (!browser.commands?.getAll) {
      setCommands({});
      return;
    }
    let cancelled = false;
    browser.commands
      .getAll()
      .then((list) => {
        if (cancelled) return;
        const map: BrowserCommandsMap = {};
        for (const c of list) {
          if (!c.name) continue;
          map[c.name] = c.shortcut ?? '';
        }
        if (map._execute_browser_action !== undefined && map._execute_action === undefined) {
          map._execute_action = map._execute_browser_action;
        }
        setCommands(map);
      })
      .catch((e) => {
        logger.error('[COMMANDS] getAll failed:', e);
        if (!cancelled) setCommands({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return commands;
}
