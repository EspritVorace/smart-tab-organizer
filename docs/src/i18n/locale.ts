// Shared locale helpers for the Starlight docs (EN root / FR / ES).
// Mirrors the detection used in components/ConditionsDeclenchement.astro
// so locale handling stays consistent across the site.

export type Locale = 'fr' | 'en' | 'es';

/** Detect the active locale from an Astro URL pathname. */
export function getLocale(pathname: string): Locale {
  if (pathname.startsWith('/fr/') || pathname === '/fr') return 'fr';
  if (pathname.startsWith('/es/') || pathname === '/es') return 'es';
  return 'en';
}

/**
 * Prefix an internal path with the current locale segment.
 * English is the root locale and carries no prefix.
 * `path` is expected to start with a slash, e.g. "/discover/installation".
 */
export function localizePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === 'en') return clean;
  return `/${locale}${clean}`;
}
