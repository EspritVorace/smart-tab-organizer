import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useRelativeTime } from '../../src/hooks/useRelativeTime';

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const NOW = new Date('2026-04-29T12:00:00.000Z').getTime();

describe('useRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('returns the initial relative-time text', () => {
    const date = NOW - 30 * SECOND;
    const { result } = renderHook(() => useRelativeTime(date, 'fr'));
    expect(result.current).toBe('il y a 30 secondes');
  });

  it('refreshes every 60 seconds for a recent date', () => {
    const date = NOW - 30 * SECOND;
    const { result } = renderHook(() => useRelativeTime(date, 'fr'));
    expect(result.current).toBe('il y a 30 secondes');

    act(() => {
      vi.advanceTimersByTime(60 * SECOND);
    });
    // 90 seconds elapsed -> "il y a 2 minutes" (rounded)
    expect(result.current).toBe('il y a 2 minutes');
  });

  it('refreshes hourly for a date within 24h', () => {
    const date = NOW - 2 * HOUR;
    const { result } = renderHook(() => useRelativeTime(date, 'fr'));
    expect(result.current).toBe('il y a 2 heures');

    act(() => {
      vi.advanceTimersByTime(1 * HOUR);
    });
    expect(result.current).toBe('il y a 3 heures');
  });

  it('does not refresh beyond 24 hours', () => {
    const date = NOW - 5 * DAY;
    const { result } = renderHook(() => useRelativeTime(date, 'fr'));
    expect(result.current).toBe('il y a 5 jours');

    act(() => {
      vi.advanceTimersByTime(2 * HOUR);
    });
    expect(result.current).toBe('il y a 5 jours');
  });

  it('updates when the date prop changes', () => {
    const { result, rerender } = renderHook(
      ({ date }: { date: number }) => useRelativeTime(date, 'fr'),
      { initialProps: { date: NOW - 1 * MINUTE } },
    );
    expect(result.current).toBe('il y a 1 minute');

    rerender({ date: NOW - 1 * HOUR });
    expect(result.current).toBe('il y a 1 heure');
  });

  it('clears the interval on unmount', () => {
    const clearSpy = vi.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() =>
      useRelativeTime(NOW - 30 * SECOND, 'fr'),
    );
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('handles invalid date input without throwing', () => {
    const { result } = renderHook(() => useRelativeTime('not-a-date', 'fr'));
    expect(result.current).toBe('not-a-date');
  });
});
