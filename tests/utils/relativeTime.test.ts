import { describe, it, expect } from 'vitest';
import { formatRelativeTime } from '../../src/utils/relativeTime';
import { getMessage } from '../../src/utils/i18n';

const NOW = new Date('2026-04-29T12:00:00.000Z').getTime();

const at = (offsetMs: number): number => NOW - offsetMs;

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

describe('formatRelativeTime', () => {
  describe('just now (< 5 seconds)', () => {
    it('returns "just now" message for 0s', () => {
      expect(formatRelativeTime(at(0), 'fr', NOW)).toBe(getMessage('relativeTimeJustNow'));
    });

    it('returns "just now" message for 1s', () => {
      expect(formatRelativeTime(at(1 * SECOND), 'fr', NOW)).toBe(
        getMessage('relativeTimeJustNow'),
      );
    });

    it('returns "just now" message for 4s', () => {
      expect(formatRelativeTime(at(4 * SECOND), 'fr', NOW)).toBe(
        getMessage('relativeTimeJustNow'),
      );
    });

    it('returns "just now" for slightly future dates within threshold', () => {
      expect(formatRelativeTime(NOW + 2 * SECOND, 'fr', NOW)).toBe(
        getMessage('relativeTimeJustNow'),
      );
    });
  });

  describe('French (fr)', () => {
    it('formats "il y a 1 minute"', () => {
      expect(formatRelativeTime(at(1 * MINUTE), 'fr', NOW)).toBe('il y a 1 minute');
    });

    it('formats "il y a 54 minutes"', () => {
      expect(formatRelativeTime(at(54 * MINUTE), 'fr', NOW)).toBe('il y a 54 minutes');
    });

    it('formats "il y a 1 heure"', () => {
      expect(formatRelativeTime(at(1 * HOUR), 'fr', NOW)).toBe('il y a 1 heure');
    });

    it('formats "il y a 22 heures"', () => {
      expect(formatRelativeTime(at(22 * HOUR), 'fr', NOW)).toBe('il y a 22 heures');
    });

    it('formats "hier" (numeric auto) for 1 day', () => {
      expect(formatRelativeTime(at(1 * DAY), 'fr', NOW)).toBe('hier');
    });

    it('formats "il y a 4 jours"', () => {
      expect(formatRelativeTime(at(4 * DAY), 'fr', NOW)).toBe('il y a 4 jours');
    });

    it('formats "la semaine dernière" (numeric auto) for 1 week', () => {
      expect(formatRelativeTime(at(1 * WEEK), 'fr', NOW)).toBe('la semaine dernière');
    });

    it('formats "il y a 3 semaines"', () => {
      expect(formatRelativeTime(at(3 * WEEK), 'fr', NOW)).toBe('il y a 3 semaines');
    });

    it('formats "le mois dernier" (numeric auto) for 1 month', () => {
      expect(formatRelativeTime(at(1 * MONTH), 'fr', NOW)).toBe('le mois dernier');
    });

    it('formats "il y a 10 mois"', () => {
      expect(formatRelativeTime(at(10 * MONTH), 'fr', NOW)).toBe('il y a 10 mois');
    });

    it('formats "l’année dernière" (numeric auto) for 1 year', () => {
      expect(formatRelativeTime(at(1 * YEAR), 'fr', NOW)).toBe('l’année dernière');
    });
  });

  describe('English (en)', () => {
    it('formats "1 minute ago"', () => {
      expect(formatRelativeTime(at(1 * MINUTE), 'en', NOW)).toBe('1 minute ago');
    });

    it('formats "yesterday" (numeric auto) for 1 day', () => {
      expect(formatRelativeTime(at(1 * DAY), 'en', NOW)).toBe('yesterday');
    });
  });

  describe('Spanish (es)', () => {
    it('formats "hace 1 minuto"', () => {
      expect(formatRelativeTime(at(1 * MINUTE), 'es', NOW)).toBe('hace 1 minuto');
    });

    it('formats "ayer" (numeric auto) for 1 day', () => {
      expect(formatRelativeTime(at(1 * DAY), 'es', NOW)).toBe('ayer');
    });
  });

  describe('future dates', () => {
    it('formats "dans 5 minutes" in French', () => {
      expect(formatRelativeTime(NOW + 5 * MINUTE, 'fr', NOW)).toBe('dans 5 minutes');
    });

    it('formats "in 5 minutes" in English', () => {
      expect(formatRelativeTime(NOW + 5 * MINUTE, 'en', NOW)).toBe('in 5 minutes');
    });

    it('formats "demain" (numeric auto) for +1 day in French', () => {
      expect(formatRelativeTime(NOW + 1 * DAY, 'fr', NOW)).toBe('demain');
    });
  });

  describe('input forms', () => {
    it('accepts a Date object', () => {
      expect(formatRelativeTime(new Date(at(1 * HOUR)), 'fr', NOW)).toBe('il y a 1 heure');
    });

    it('accepts an ISO string', () => {
      expect(formatRelativeTime(new Date(at(1 * HOUR)).toISOString(), 'fr', NOW)).toBe(
        'il y a 1 heure',
      );
    });

    it('accepts a numeric timestamp', () => {
      expect(formatRelativeTime(at(1 * HOUR), 'fr', NOW)).toBe('il y a 1 heure');
    });

    it('accepts a Date for `now`', () => {
      expect(formatRelativeTime(at(1 * MINUTE), 'fr', new Date(NOW))).toBe('il y a 1 minute');
    });
  });

  describe('invalid input', () => {
    it('returns the original string for an invalid ISO string', () => {
      expect(formatRelativeTime('not-a-date', 'fr', NOW)).toBe('not-a-date');
    });

    it('returns the original string for an empty string', () => {
      expect(formatRelativeTime('', 'fr', NOW)).toBe('');
    });
  });
});
