import { createI18n } from '@wxt-dev/i18n';
import type { GeneratedI18nStructure } from '../../wxt-i18n-structure';
import { logger } from './logger.js';

/**
 * Union of every i18n message key, derived at compile time from the English
 * catalog (`public/_locales/en/messages.json`) via the generated
 * `wxt-i18n-structure.d.ts`. Regenerate with `pnpm i18n:types` after adding
 * keys. Use this type for dynamic key patterns (enums, data-driven labels).
 */
export type MessageKey = keyof GeneratedI18nStructure;

// `@wxt-dev/i18n`'s `t()` resolves messages through `browser.i18n.getMessage`
// under the hood, so the runtime behavior (and the Storybook / Vitest mocks
// that stub `browser.i18n.getMessage`) is unchanged. The public type safety
// lives on `getMessage`'s `MessageKey` parameter; internally we expose `t`
// through a flat signature (the strict per-key substitution tuples of `t`
// would force the facade to drop its uniform `string | string[]` argument).
const translate = createI18n().t as (key: MessageKey, substitutions?: string[]) => string;

/**
 * Get translated message from browser.i18n (via `@wxt-dev/i18n`).
 * @param key - The message key from _locales (type-checked against MessageKey)
 * @param substitutions - Optional substitutions for placeholders ($1, $2, ...)
 * @returns The translated message or the key if translation not found
 */
export function getMessage(key: MessageKey, substitutions?: string | string[]): string {
  try {
    if (substitutions === undefined) {
      return translate(key);
    }
    const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
    return translate(key, subs);
  } catch (e) {
    logger.warn(`i18n key ${key} not found.`, e);
    return key;
  }
}

/**
 * Return the singular message when count === 1, plural otherwise.
 * Plural key receives [String(count)] as substitution.
 * Optionally supports a dedicated zero-key when count === 0.
 */
export function getPluralMessage(
  count: number,
  oneKey: MessageKey,
  manyKey: MessageKey,
  zeroKey?: MessageKey
): string {
  if (count === 0 && zeroKey) return getMessage(zeroKey);
  return count === 1
    ? getMessage(oneKey)
    : getMessage(manyKey, [String(count)]);
}
