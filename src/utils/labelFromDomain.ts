const COMMON_SUBDOMAINS = new Set(['www', 'mail', 'app', 'm', 'web', 'api', 'static', 'cdn']);

const SECOND_LEVEL_PUBLIC_SUFFIXES = new Set(['co', 'com', 'org', 'net', 'gov', 'edu', 'ac']);

const REGEX_SPECIAL_CHARS = /[*+?^${}()|[\]\\]/;

export function deriveLabelFromDomain(domain: string): string {
  const trimmed = domain.trim();
  if (!trimmed) return '';
  if (trimmed.toLowerCase() === 'localhost') return 'Localhost';
  if (REGEX_SPECIAL_CHARS.test(trimmed)) return '';

  const parts = trimmed.toLowerCase().split('.').filter(Boolean);
  if (parts.length === 0) return '';

  while (parts.length > 2 && COMMON_SUBDOMAINS.has(parts[0])) {
    parts.shift();
  }

  let sld: string;
  if (parts.length >= 3 && SECOND_LEVEL_PUBLIC_SUFFIXES.has(parts[parts.length - 2])) {
    sld = parts[parts.length - 3];
  } else if (parts.length >= 2) {
    sld = parts[parts.length - 2];
  } else {
    sld = parts[0];
  }

  if (!sld) return '';
  return sld.charAt(0).toUpperCase() + sld.slice(1);
}
