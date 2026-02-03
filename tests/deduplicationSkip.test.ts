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
    it('devrait marquer une URL pour ignorer la déduplication', () => {
      markUrlToSkipDeduplication('https://example.com/page');

      expect(shouldSkipDeduplication('https://example.com/page')).toBe(true);
    });

    it('devrait normaliser les URLs (trailing slash)', () => {
      markUrlToSkipDeduplication('https://example.com/page/');

      // Sans trailing slash devrait matcher
      expect(shouldSkipDeduplication('https://example.com/page')).toBe(true);
    });

    it('devrait normaliser les URLs (lowercase hostname)', () => {
      markUrlToSkipDeduplication('https://EXAMPLE.COM/page');

      expect(shouldSkipDeduplication('https://example.com/page')).toBe(true);
    });
  });

  describe('shouldSkipDeduplication', () => {
    it('devrait retourner false pour une URL non marquée', () => {
      expect(shouldSkipDeduplication('https://example.com/unknown')).toBe(false);
    });

    it('devrait retourner true pour une URL marquée non expirée', () => {
      markUrlToSkipDeduplication('https://example.com/page');

      // Avancer de 5 secondes (moins que SKIP_DURATION_MS = 10000)
      vi.advanceTimersByTime(5000);

      expect(shouldSkipDeduplication('https://example.com/page')).toBe(true);
    });

    it('devrait retourner false après expiration (10 secondes)', () => {
      markUrlToSkipDeduplication('https://example.com/page');

      // Avancer de 11 secondes (plus que SKIP_DURATION_MS = 10000)
      vi.advanceTimersByTime(11000);

      expect(shouldSkipDeduplication('https://example.com/page')).toBe(false);
    });

    it('devrait conserver les query params et hash', () => {
      markUrlToSkipDeduplication('https://example.com/page?foo=bar#section');

      expect(shouldSkipDeduplication('https://example.com/page?foo=bar#section')).toBe(true);
      expect(shouldSkipDeduplication('https://example.com/page')).toBe(false);
    });

    it('devrait gérer les URLs invalides gracieusement', () => {
      // Une URL invalide ne devrait pas crasher
      markUrlToSkipDeduplication('not-a-valid-url');
      expect(shouldSkipDeduplication('not-a-valid-url')).toBe(true);
    });
  });

  describe('clearSkipDeduplicationUrls', () => {
    it('devrait effacer toutes les URLs marquées', () => {
      markUrlToSkipDeduplication('https://example.com/page1');
      markUrlToSkipDeduplication('https://example.com/page2');

      expect(shouldSkipDeduplication('https://example.com/page1')).toBe(true);
      expect(shouldSkipDeduplication('https://example.com/page2')).toBe(true);

      clearSkipDeduplicationUrls();

      expect(shouldSkipDeduplication('https://example.com/page1')).toBe(false);
      expect(shouldSkipDeduplication('https://example.com/page2')).toBe(false);
    });
  });

  describe('normalisation URL edge cases', () => {
    it('devrait normaliser correctement une URL avec port', () => {
      markUrlToSkipDeduplication('https://example.com:8080/page');

      expect(shouldSkipDeduplication('https://example.com:8080/page')).toBe(true);
    });

    it('devrait distinguer les protocoles', () => {
      markUrlToSkipDeduplication('https://example.com/page');

      expect(shouldSkipDeduplication('http://example.com/page')).toBe(false);
    });

    it('devrait gérer les chemins racine', () => {
      markUrlToSkipDeduplication('https://example.com/');

      expect(shouldSkipDeduplication('https://example.com')).toBe(true);
    });
  });
});
