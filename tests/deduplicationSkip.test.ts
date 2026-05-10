import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  markUrlToSkipDeduplication,
  shouldSkipDeduplication,
  clearSkipDeduplicationUrls
} from '../src/utils/deduplicationSkip';

describe('deduplicationSkip', () => {
  beforeEach(() => {
    clearSkipDeduplicationUrls();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('markUrlToSkipDeduplication', () => {
    it('marks a URL to skip deduplication', () => {
      markUrlToSkipDeduplication('https://example.com/page');

      expect(shouldSkipDeduplication('https://example.com/page')).toBe(true);
    });

    it('normalizes URLs (trailing slash)', () => {
      markUrlToSkipDeduplication('https://example.com/page/');

      // The version without a trailing slash must still match.
      expect(shouldSkipDeduplication('https://example.com/page')).toBe(true);
    });

    it('normalizes URLs (lowercase hostname)', () => {
      markUrlToSkipDeduplication('https://EXAMPLE.COM/page');

      expect(shouldSkipDeduplication('https://example.com/page')).toBe(true);
    });
  });

  describe('shouldSkipDeduplication', () => {
    it('returns false for an unmarked URL', () => {
      expect(shouldSkipDeduplication('https://example.com/unknown')).toBe(false);
    });

    it('returns true for a marked URL that has not expired', () => {
      markUrlToSkipDeduplication('https://example.com/page');

      // Advance 5 seconds (less than SKIP_DURATION_MS = 10000).
      vi.advanceTimersByTime(5000);

      expect(shouldSkipDeduplication('https://example.com/page')).toBe(true);
    });

    it('returns false after expiration (10 seconds)', () => {
      markUrlToSkipDeduplication('https://example.com/page');

      // Advance 11 seconds (more than SKIP_DURATION_MS = 10000).
      vi.advanceTimersByTime(11000);

      expect(shouldSkipDeduplication('https://example.com/page')).toBe(false);
    });

    it('preserves query params and hash', () => {
      markUrlToSkipDeduplication('https://example.com/page?foo=bar#section');

      expect(shouldSkipDeduplication('https://example.com/page?foo=bar#section')).toBe(true);
      expect(shouldSkipDeduplication('https://example.com/page')).toBe(false);
    });

    it('handles invalid URLs gracefully', () => {
      // An invalid URL must not crash.
      markUrlToSkipDeduplication('not-a-valid-url');
      expect(shouldSkipDeduplication('not-a-valid-url')).toBe(true);
    });
  });

  describe('clearSkipDeduplicationUrls', () => {
    it('clears every marked URL', () => {
      markUrlToSkipDeduplication('https://example.com/page1');
      markUrlToSkipDeduplication('https://example.com/page2');

      expect(shouldSkipDeduplication('https://example.com/page1')).toBe(true);
      expect(shouldSkipDeduplication('https://example.com/page2')).toBe(true);

      clearSkipDeduplicationUrls();

      expect(shouldSkipDeduplication('https://example.com/page1')).toBe(false);
      expect(shouldSkipDeduplication('https://example.com/page2')).toBe(false);
    });
  });

  describe('URL normalization edge cases', () => {
    it('normalizes a URL with a port correctly', () => {
      markUrlToSkipDeduplication('https://example.com:8080/page');

      expect(shouldSkipDeduplication('https://example.com:8080/page')).toBe(true);
    });

    it('distinguishes protocols', () => {
      markUrlToSkipDeduplication('https://example.com/page');

      expect(shouldSkipDeduplication('http://example.com/page')).toBe(false);
    });

    it('handles root paths', () => {
      markUrlToSkipDeduplication('https://example.com/');

      expect(shouldSkipDeduplication('https://example.com')).toBe(true);
    });
  });
});
