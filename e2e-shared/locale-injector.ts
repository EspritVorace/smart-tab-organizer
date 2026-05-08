/**
 * Injects a locale-aware override of `chrome.i18n.getMessage()` into a Page
 * before its first navigation, so popup/options screens render in the requested
 * locale even when Playwright's `--lang=` flag is ignored by the Chromium build.
 *
 * Reads `messages.json` from the built extension's `_locales/{locale}/` folder,
 * supports `$PLACEHOLDER_NAME$` substitutions and positional `$1, $2…` markers.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Page } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_LOCALES_DIR = path.resolve(__dirname, '../.output/chrome-mv3/_locales');

type MessageEntry = {
  message: string;
  placeholders?: Record<string, { content: string }>;
};

/** Load `_locales/{locale}/messages.json`. Returns null for `en` (Chrome default) or on error. */
export function loadLocaleMessages(
  locale: string,
  localesDir: string = DEFAULT_LOCALES_DIR,
): Record<string, MessageEntry> | null {
  if (locale === 'en') return null;
  const filePath = path.join(localesDir, locale, 'messages.json');
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, MessageEntry>;
  } catch {
    return null;
  }
}

/**
 * Adds an init script overriding `chrome.i18n.getMessage` for the given locale.
 * No-op for `en` (the default). Re-runs on every navigation, so theme reloads
 * and hash changes preserve the override.
 */
export async function injectLocaleOverride(page: Page, locale: string): Promise<void> {
  const messages = loadLocaleMessages(locale);
  if (!messages) return;

  await page.addInitScript((msgs: Record<string, MessageEntry>) => {
    const orig = chrome.i18n.getMessage.bind(chrome.i18n);
    chrome.i18n.getMessage = function (
      messageId: string,
      substitutions?: string | string[],
    ): string {
      const entry = msgs[messageId];
      if (!entry) return orig(messageId, substitutions);

      let msg = entry.message;
      const subs = substitutions
        ? Array.isArray(substitutions)
          ? substitutions
          : [substitutions]
        : [];

      if (entry.placeholders) {
        for (const [name, placeholder] of Object.entries(entry.placeholders)) {
          const content = placeholder.content.replace(
            /\$(\d+)/g,
            (_, n: string) => subs[parseInt(n, 10) - 1] ?? '',
          );
          msg = msg.replace(new RegExp(`\\$${name}\\$`, 'gi'), content);
        }
      }

      msg = msg.replace(
        /\$(\d+)/g,
        (_, n: string) => subs[parseInt(n, 10) - 1] ?? '',
      );

      return msg;
    };
  }, messages as Parameters<typeof page.addInitScript>[1]);
}
