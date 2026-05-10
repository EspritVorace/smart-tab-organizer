import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import { useStatistics } from '../../src/hooks/useStatistics';
import { defaultStatistics } from '../../src/types/statistics';

describe('useStatistics', () => {
  afterEach(() => {
    cleanup();
  });

  it('loads the default statistics', async () => {
    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.statistics).toEqual(defaultStatistics);
  });

  it('loads the existing statistics', async () => {
    await fakeBrowser.storage.local.set({
      statistics: { tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 10, dailyBuckets: {} },
    });

    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.statistics?.tabGroupsCreatedCount).toBe(5);
    expect(result.current.statistics?.tabsDeduplicatedCount).toBe(10);
  });

  it('resets the statistics', async () => {
    await fakeBrowser.storage.local.set({
      statistics: { tabGroupsCreatedCount: 50, tabsDeduplicatedCount: 100, dailyBuckets: {} },
    });

    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.resetStatistics();
    });

    expect(result.current.statistics).toEqual(defaultStatistics);
  });

  it('reloads the statistics', async () => {
    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 999, tabsDeduplicatedCount: 888, dailyBuckets: {} },
      });
    });

    await act(async () => {
      await result.current.reloadStatistics();
    });

    expect(result.current.statistics?.tabGroupsCreatedCount).toBe(999);
    expect(result.current.statistics?.tabsDeduplicatedCount).toBe(888);
  });

  it('handles load errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.spyOn(fakeBrowser.storage.local, 'get').mockRejectedValueOnce(new Error('Storage error'));

    const { result } = renderHook(() => useStatistics());

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.isLoaded).toBe(false);
    expect(result.current.statistics).toBe(null);

    consoleSpy.mockRestore();
  });

  it('merges with default values when stored data is partial', async () => {
    await fakeBrowser.storage.local.set({
      statistics: { tabGroupsCreatedCount: 42 },
    });

    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.statistics?.tabGroupsCreatedCount).toBe(42);
    expect(result.current.statistics?.tabsDeduplicatedCount).toBe(0);
    expect(result.current.statistics?.dailyBuckets).toEqual({});
  });

  describe('statisticsAggregates', () => {
    it('returns zeros by default', async () => {
      const { result } = renderHook(() => useStatistics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const agg = result.current.statisticsAggregates;
      expect(agg.totalGrouping).toBe(0);
      expect(agg.totalDedup).toBe(0);
      expect(agg.firstUsedAt).toBeNull();
      expect(agg.thisWeek).toEqual({ grouping: 0, dedup: 0 });
      expect(agg.topRules).toEqual([]);
    });

    it('computes totalGrouping and totalDedup from the historical counters', async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 42, tabsDeduplicatedCount: 17, dailyBuckets: {} },
      });

      const { result } = renderHook(() => useStatistics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.statisticsAggregates.totalGrouping).toBe(42);
      expect(result.current.statisticsAggregates.totalDedup).toBe(17);
    });

    it('parses firstUsedAt into a Date', async () => {
      await fakeBrowser.storage.local.set({
        statistics: {
          tabGroupsCreatedCount: 1,
          tabsDeduplicatedCount: 0,
          dailyBuckets: {},
          firstUsedAt: '2026-01-12T10:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useStatistics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.statisticsAggregates.firstUsedAt).toBeInstanceOf(Date);
    });

    it('computes thisWeek from the current day buckets', async () => {
      const today = new Date().toISOString().slice(0, 10);
      await fakeBrowser.storage.local.set({
        statistics: {
          tabGroupsCreatedCount: 3,
          tabsDeduplicatedCount: 1,
          dailyBuckets: {
            [today]: { 'rule-1': { grouping: 3, dedup: 1 } },
          },
        },
      });

      const { result } = renderHook(() => useStatistics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.statisticsAggregates.thisWeek.grouping).toBe(3);
      expect(result.current.statisticsAggregates.thisWeek.dedup).toBe(1);
    });

    it('uses domainRules for the topRules labels', async () => {
      const today = new Date().toISOString().slice(0, 10);
      await fakeBrowser.storage.local.set({
        statistics: {
          tabGroupsCreatedCount: 5,
          tabsDeduplicatedCount: 0,
          dailyBuckets: {
            [today]: { 'rule-abc': { grouping: 5, dedup: 0 } },
          },
        },
      });

      const domainRules = [{
        id: 'rule-abc', enabled: true, label: 'GitHub', domainFilter: 'github.com',
        groupingEnabled: true, titleParsingRegEx: '', urlParsingRegEx: '',
        groupNameSource: 'title' as const, deduplicationMatchMode: 'exact' as const, deduplicationEnabled: true,
      }];

      const { result } = renderHook(() => useStatistics(domainRules));

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.statisticsAggregates.topRules[0]?.label).toBe('GitHub');
    });
  });
});
