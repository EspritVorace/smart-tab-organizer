/**
 * Module to track URLs that should temporarily skip deduplication.
 * Used when undoing a deduplication action to prevent immediate re-deduplication.
 */

// Set of URLs that should skip deduplication (with expiration timestamps)
const skipDeduplicationUrls = new Map<string, number>();

// How long to skip deduplication for a URL (in ms)
const SKIP_DURATION_MS = 10000;

/**
 * Normalize URL for comparison (remove trailing slash, lowercase hostname)
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Normalize: lowercase host, remove trailing slash from pathname
    let normalized = `${parsed.protocol}//${parsed.host.toLowerCase()}${parsed.pathname}`;
    if (normalized.endsWith('/') && normalized.length > 1) {
      normalized = normalized.slice(0, -1);
    }
    // Add search params and hash if present
    if (parsed.search) normalized += parsed.search;
    if (parsed.hash) normalized += parsed.hash;
    return normalized;
  } catch {
    return url;
  }
}

/**
 * Mark a URL to skip deduplication temporarily
 */
export function markUrlToSkipDeduplication(url: string): void {
  const normalizedUrl = normalizeUrl(url);
  const expiresAt = Date.now() + SKIP_DURATION_MS;
  skipDeduplicationUrls.set(normalizedUrl, expiresAt);
  console.log(`[DEDUP_SKIP] Marked URL to skip deduplication: ${normalizedUrl}`);
}

/**
 * Check if a URL should skip deduplication.
 * If the URL is in the skip list and not expired, returns true.
 * The entry is NOT removed - it will expire naturally.
 */
export function shouldSkipDeduplication(url: string): boolean {
  const normalizedUrl = normalizeUrl(url);
  const expiresAt = skipDeduplicationUrls.get(normalizedUrl);

  if (expiresAt === undefined) {
    console.log(`[DEDUP_SKIP] URL not in skip list: ${normalizedUrl}`);
    return false;
  }

  // Check if expired
  if (Date.now() > expiresAt) {
    // Clean up expired entry
    skipDeduplicationUrls.delete(normalizedUrl);
    console.log(`[DEDUP_SKIP] Skip entry expired for URL: ${normalizedUrl}`);
    return false;
  }

  console.log(`[DEDUP_SKIP] Skipping deduplication for URL: ${normalizedUrl}`);
  return true;
}

/**
 * Clear all skip entries (used for cleanup)
 */
export function clearSkipDeduplicationUrls(): void {
  skipDeduplicationUrls.clear();
}
