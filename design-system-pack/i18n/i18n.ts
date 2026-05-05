import { browser } from 'wxt/browser';
import { logger } from './logger.js';

/**
 * Get translated message from browser.i18n
 * @param key - The message key from _locales
 * @param substitutions - Optional substitutions for placeholders
 * @returns The translated message or the key if translation not found
 */
export function getMessage(key: string, substitutions?: string | string[]): string {
  try {
    return browser.i18n.getMessage(key as 'extensionName', substitutions);
  } catch (e) {
    logger.warn(`Clé i18n ${key} introuvable.`, e);
    return key;
  }
}

/**
 * Return the singular message when count === 1, plural otherwise.
 * Plural key receives [String(count)] as substitution.
 */
export function getPluralMessage(count: number, oneKey: string, manyKey: string): string {
  return count === 1
    ? getMessage(oneKey)
    : getMessage(manyKey, [String(count)]);
}