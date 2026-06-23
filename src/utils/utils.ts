import type { BadgeProps } from '@radix-ui/themes';
import { logger } from './logger';

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function domainToRegex(domainFilter: string | null): RegExp | null {
  if (!domainFilter) return null;
  try {
    const trimmed = domainFilter.trim();
    // Bare generic wildcard is handled by callers, not by a regex.
    if (!trimmed || trimmed === '*') return null;

    // Recognize an optional leading `*.` (any subdomain) and an optional
    // trailing `.*` (any registrable domain after the first label, e.g. a
    // self-hosted instance such as `gitlab.*`). Both are stripped before
    // escaping the body. The trailing wildcard is only honored when there is
    // no leading `*.`: a combined `*.x.*` form keeps its prior literal
    // behavior so this change stays scoped to first-label self-hosted filters
    // and never alters the matching of existing combined catalog filters.
    let body = trimmed;
    let leadingWildcard = false;
    let trailingWildcard = false;
    if (body.startsWith('*.')) {
      leadingWildcard = true;
      body = body.slice(2);
    }
    if (!leadingWildcard && body.endsWith('.*')) {
      trailingWildcard = true;
      body = body.slice(0, -2);
    }

    // Plain domain: only letters, digits, dots and hyphens — not localhost
    const isPlainDomain = body !== 'localhost' && /^[a-zA-Z0-9][a-zA-Z0-9.\-]*$/.test(body);
    const escaped = body.replace(/[\\.]/g, '\\$&');

    // Subdomains match implicitly for a plain domain or an explicit leading
    // `*.`. A trailing-only filter (e.g. `gitlab.*`) must anchor on the first
    // label, so it does NOT opt into the subdomain prefix.
    const allowSubdomains = leadingWildcard || (isPlainDomain && !trailingWildcard);
    const prefix = allowSubdomains ? '([^.]+\\.)*' : '';
    // Trailing `.*` means "followed by any registrable domain".
    const suffix = trailingWildcard ? '\\.[^/]+' : '';

    const p = `${prefix}${escaped}${suffix}`;
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

export function extractFromQueryParam(url: string | null, paramName: string | null | undefined): string | null {
  if (!url || !paramName) return null;
  try {
    const parsed = new URL(url);
    const value = parsed.searchParams.get(paramName);
    return value && value.length > 0 ? value : null;
  } catch (e) {
    logger.debug('[GROUPING] Invalid URL for query param extraction:', url, e);
    return null;
  }
}

export function extractGroupNameFromUrlByMode(
  url: string | null,
  rule: { urlExtractionMode?: 'regex' | 'query_param'; urlParsingRegEx?: string | null; urlQueryParamName?: string | null }
): string | null {
  if (rule.urlExtractionMode === 'query_param') {
    return extractFromQueryParam(url, rule.urlQueryParamName ?? null);
  }
  return extractGroupNameFromUrl(url, rule.urlParsingRegEx ?? null);
}

export function isValidRegex(regex: string): boolean {
  try {
    new RegExp(regex);
    return regex.includes('(') && regex.includes(')');
  } catch (err) {
    logger.debug('[isValidRegex] Invalid regex pattern:', regex, err);
    return false;
  }
}

export function isValidDomain(domain: string | null): boolean {
  // Wildcards (*.domain) are no longer accepted — subdomains match implicitly
  return domain ? /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(domain.trim()) : false;
}

export function getRadixColor(groupColor: string): NonNullable<BadgeProps['color']> {
  const colorMap: Record<string, NonNullable<BadgeProps['color']>> = {
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
  return colorMap[groupColor] ?? 'gray';
}
