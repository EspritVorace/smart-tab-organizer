import { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/utils/relativeTime.js';

type DateInput = Date | number | string;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function pickInterval(ageMs: number): number | null {
  if (ageMs < HOUR_MS) return MINUTE_MS;
  if (ageMs < DAY_MS) return HOUR_MS;
  return null;
}

function toMs(date: DateInput): number {
  if (date instanceof Date) return date.getTime();
  if (typeof date === 'number') return date;
  return new Date(date).getTime();
}

/**
 * Returns a relative-time string for `date`, refreshed adaptively:
 * every 60s when under an hour old, every hour under a day, never beyond.
 */
export function useRelativeTime(date: DateInput, locale?: string): string {
  const [text, setText] = useState(() => formatRelativeTime(date, locale));

  useEffect(() => {
    setText(formatRelativeTime(date, locale));

    const dateMs = toMs(date);
    if (Number.isNaN(dateMs)) return;

    const ageMs = Math.abs(Date.now() - dateMs);
    const intervalMs = pickInterval(ageMs);
    if (intervalMs === null) return;

    const id = setInterval(() => {
      const next = formatRelativeTime(date, locale);
      setText(prev => (prev === next ? prev : next));
    }, intervalMs);

    return () => clearInterval(id);
  }, [date, locale]);

  return text;
}
