import { getMessage } from './i18n.js';

type DateInput = Date | number | string;

interface Threshold {
  unit: Intl.RelativeTimeFormatUnit;
  seconds: number;
}

const THRESHOLDS: readonly Threshold[] = [
  { unit: 'year', seconds: 31_536_000 },
  { unit: 'month', seconds: 2_592_000 },
  { unit: 'week', seconds: 604_800 },
  { unit: 'day', seconds: 86_400 },
  { unit: 'hour', seconds: 3_600 },
  { unit: 'minute', seconds: 60 },
  { unit: 'second', seconds: 1 },
];

const JUST_NOW_THRESHOLD_SECONDS = 5;

function toTimestamp(date: DateInput): number {
  if (date instanceof Date) return date.getTime();
  if (typeof date === 'number') return date;
  return new Date(date).getTime();
}

/**
 * Format a date relative to `now` (e.g. "il y a 1 heure", "hier", "in 5 minutes").
 *
 * Uses native Intl.RelativeTimeFormat with `numeric: 'auto'` so unitary gaps
 * become "yesterday" / "last week" / "last year" instead of "1 day ago".
 *
 * On an invalid date, returns the original input stringified (mirrors the
 * fallback pattern used by formatSessionDate).
 */
export function formatRelativeTime(
  date: DateInput,
  locale?: string,
  now: Date | number = Date.now(),
): string {
  const timestamp = toTimestamp(date);
  if (Number.isNaN(timestamp)) {
    return typeof date === 'string' ? date : String(date);
  }

  const nowMs = now instanceof Date ? now.getTime() : now;
  const diffSeconds = (nowMs - timestamp) / 1000;

  if (Math.abs(diffSeconds) < JUST_NOW_THRESHOLD_SECONDS) {
    return getMessage('relativeTimeJustNow');
  }

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  for (const { unit, seconds } of THRESHOLDS) {
    if (Math.abs(diffSeconds) >= seconds) {
      const value = -Math.round(diffSeconds / seconds);
      return formatter.format(value, unit);
    }
  }

  return formatter.format(0, 'second');
}
