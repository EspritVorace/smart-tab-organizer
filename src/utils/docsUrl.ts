import { browser } from 'wxt/browser';

export const DOCS_BASE_URL = 'https://docs.esprit-vorace.fr';

export function getDocsUrl(): string {
  let code = 'fr';
  try {
    code = browser.i18n.getUILanguage();
  } catch {
    code = typeof navigator !== 'undefined' ? navigator.language || 'fr' : 'fr';
  }
  const short = code.toLowerCase().split(/[-_]/)[0];
  if (short === 'en') return `${DOCS_BASE_URL}/en/`;
  if (short === 'es') return `${DOCS_BASE_URL}/es/`;
  return `${DOCS_BASE_URL}/`;
}
