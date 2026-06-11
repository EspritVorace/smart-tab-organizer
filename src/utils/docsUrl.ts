import { browser } from 'wxt/browser';

export const DOCS_BASE_URL = 'https://docs.esprit-vorace.fr';

const DOCS_SECTION_BY_TAB: Record<string, string> = {
  home: 'discover/why',
  rules: 'guides/domain-rules',
  sessions: 'guides/sessions',
  stats: 'guides/statistics',
  importexport: 'guides/import-export',
  settings: 'guides/settings',
  workspaces: 'guides/workspaces',
};

function detectUiLanguage(): string {
  try {
    return browser.i18n.getUILanguage();
  } catch {
    return typeof navigator !== 'undefined' ? navigator.language || 'fr' : 'fr';
  }
}

function getLocalePath(uiLanguage: string): string {
  // English is the root locale (no prefix); it is also the default fallback.
  const short = uiLanguage.toLowerCase().split(/[-_]/)[0];
  if (short === 'fr') return 'fr/';
  if (short === 'es') return 'es/';
  return '';
}

export function getDocsUrl(section?: string): string {
  const localePath = getLocalePath(detectUiLanguage());
  const sectionPath = section ? `${section.replace(/^\/|\/$/g, '')}/` : '';
  return `${DOCS_BASE_URL}/${localePath}${sectionPath}`;
}

export function getDocsUrlForTab(tab: string | undefined): string {
  const section = tab ? DOCS_SECTION_BY_TAB[tab] : undefined;
  return getDocsUrl(section);
}
