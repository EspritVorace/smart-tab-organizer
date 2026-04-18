import { logger } from './logger';

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function domainToRegex(domainFilter: string | null): RegExp | null {
  if (!domainFilter) return null;
  try {
    const trimmed = domainFilter.trim();
    // Defensive strip: handle legacy *.domain rules not yet migrated
    const cleaned = trimmed.startsWith('*.') ? trimmed.slice(2) : trimmed;
    // Plain domain: only letters, digits, dots and hyphens — not localhost
    const isPlainDomain = cleaned !== 'localhost' && /^[a-zA-Z0-9][a-zA-Z0-9.\-]*$/.test(cleaned);
    const escaped = cleaned.replace(/\./g, '\\.');
    const p = isPlainDomain ? `([^.]+\\.)*${escaped}` : escaped;
    return new RegExp(`^https?:\\/\\/(${p})(\\/|$)`, 'i');
  } catch (e) {
    logger.error('Err domainToRegex:', domainFilter, e);
    return null;
  }
}

export function matchesDomain(url: string | null, domainFilter: string | null): boolean {
  const regex = domainToRegex(domainFilter);
  return regex ? regex.test(url || '') : false;
}

export function extractGroupNameFromTitle(title: string | null, regexString: string | null): string | null {
  if (!title || !regexString) return null;
  try {
    const regex = new RegExp(regexString);
    const match = title.match(regex);
    return (match && match[1]) ? match[1].trim() : null;
  } catch (e) {
    logger.error("Err extractGroupName:", title, regexString, e);
    return null;
  }
}

export function extractGroupNameFromUrl(url: string | null, regexString: string | null): string | null {
  if (!url || !regexString) return null;
  try {
    const regex = new RegExp(regexString);
    const match = url.match(regex);
    return (match && match[1]) ? match[1].trim() : null;
  } catch (e) {
    logger.error("Err extractGroupNameFromUrl:", url, regexString, e);
    return null;
  }
}

export function isValidRegex(regex: string): boolean {
  try {
    new RegExp(regex);
    return regex.includes('(') && regex.includes(')');
  } catch (_e) {
    return false;
  }
}

export function isValidDomain(domain: string | null): boolean {
  // Wildcards (*.domain) are no longer accepted — subdomains match implicitly
  return domain ? /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(domain.trim()) : false;
}

export function getRadixColor(groupColor: string): string {
  const colorMap: Record<string, string> = {
    'grey': 'gray',
    'blue': 'blue',
    'red': 'red',
    'yellow': 'amber',
    'green': 'green',
    'pink': 'pink',
    'purple': 'purple',
    'cyan': 'cyan',
    'orange': 'orange',
  };
  return colorMap[groupColor] || 'gray';
}
