import { browser } from 'wxt/browser';

export const DOCS_BASE_URL = 'https://docs.esprit-vorace.fr';

const DOCS_SECTION_BY_TAB: Record<string, string> = {
  home: 'discover/why',
  rules: 'guides/domain-rules',
  sessions: 'guides/sessions',
  stats: 'guides/statistics',
  exploration: 'guides/exploration',
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
  // Split an optional `#fragment` off so the trailing slash lands on the path
  // (`.../guides/domain-rules/#create`), not after the anchor. The fragment is
  // a stable, locale-independent heading id (see the docs `{#id}` convention).
  let path = section ?? '';
  let hash = '';
  const hashIndex = path.indexOf('#');
  if (hashIndex >= 0) {
    hash = path.slice(hashIndex);
    path = path.slice(0, hashIndex);
  }
  const sectionPath = path ? `${path.replace(/^\/|\/$/g, '')}/` : '';
  return `${DOCS_BASE_URL}/${localePath}${sectionPath}${hash}`;
}

export function getDocsUrlForTab(tab: string | undefined): string {
  const section = tab ? DOCS_SECTION_BY_TAB[tab] : undefined;
  return getDocsUrl(section);
}
