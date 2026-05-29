// Shared locale helpers for the Starlight docs (FR root / EN / ES).
// Mirrors the detection used in components/ConditionsDeclenchement.astro
// so locale handling stays consistent across the site.

export type Locale = 'fr' | 'en' | 'es';

/** Detect the active locale from an Astro URL pathname. */
export function getLocale(pathname: string): Locale {
  if (pathname.startsWith('/en/') || pathname === '/en') return 'en';
  if (pathname.startsWith('/es/') || pathname === '/es') return 'es';
  return 'fr';
}

/**
 * Prefix an internal path with the current locale segment.
 * French is the root locale and carries no prefix.
 * `path` is expected to start with a slash, e.g. "/decouverte/installation".
 */
export function localizePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === 'fr') return clean;
  return `/${locale}${clean}`;
}
