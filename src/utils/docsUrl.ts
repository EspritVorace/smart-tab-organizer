import { browser } from 'wxt/browser';

export const DOCS_BASE_URL = 'https://docs.esprit-vorace.fr';

const DOCS_SECTION_BY_TAB: Record<string, string> = {
  home: 'decouverte/pourquoi',
  rules: 'guides/regles-de-domaine',
  sessions: 'guides/sessions',
  stats: 'guides/statistiques',
  importexport: 'guides/import-export',
  settings: 'guides/parametres',
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
  const short = uiLanguage.toLowerCase().split(/[-_]/)[0];
  if (short === 'en') return 'en/';
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
