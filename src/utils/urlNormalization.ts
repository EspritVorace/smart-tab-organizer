/**
 * URL normalization helpers used by deduplication to drop irrelevant query
 * parameters before comparing two URLs (e.g. marketing params like `utm_*`,
 * session tokens, etc.).
 */

/**
 * Checks whether a query-param name matches a pattern.
 * Supported syntax:
 *  - exact name: `utm_source` matches only `utm_source` (case-sensitive).
 *  - wildcard `*`: any number of characters. Examples: `utm_*`, `*_id`, `*`.
 * Pattern matching is case-sensitive (query param names are case-sensitive
 * per RFC 3986).
 */
export function paramNameMatches(name: string, pattern: string): boolean {
  if (!pattern) return false;
  if (!pattern.includes('*')) {
    return name === pattern;
  }
  // Escape all regex metachars except `*`, then replace `*` with `.*`.
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  const regex = new RegExp(`^${escaped}$`);
  return regex.test(name);
}

/**
 * Returns the URL with any query parameter whose name matches one of the
 * provided patterns removed. The original URL is returned unchanged if it
 * cannot be parsed, if no patterns are supplied, or if no parameters match.
 */
export function normalizeUrlIgnoringParams(url: string, patterns: string[]): string {
  if (!patterns || patterns.length === 0) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (!parsed.search) return url;

  const keys = Array.from(parsed.searchParams.keys());
  let removed = false;
  const seen = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) continue;
    seen.add(key);
    if (patterns.some(pattern => paramNameMatches(key, pattern))) {
      parsed.searchParams.delete(key);
      removed = true;
    }
  }

  if (!removed) return url;

  // Drop a trailing `?` when the query string becomes empty.
  const serialized = parsed.toString();
  if (parsed.searchParams.toString() === '' && serialized.includes('?')) {
    return serialized.replace(/\?(?=#|$)/, '');
  }
  return serialized;
}
