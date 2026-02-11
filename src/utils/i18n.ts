import { browser } from 'wxt/browser';

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
    console.warn(`Clé i18n ${key} introuvable.`);
    return key;
  }
}