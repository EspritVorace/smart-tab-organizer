import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import { useStatistics } from '../../src/hooks/useStatistics';
import { defaultStatistics } from '../../src/types/statistics';

describe('useStatistics', () => {
  afterEach(() => {
    cleanup();
  });

  it('charge les statistiques par défaut', async () => {
    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.statistics).toEqual(defaultStatistics);
  });

  it('charge les statistiques existantes', async () => {
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

  it('réinitialise les statistiques', async () => {
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

  it('recharge les statistiques', async () => {
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

  it('gère les erreurs de chargement', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.spyOn(fakeBrowser.storage.local, 'get').mockRejectedValueOnce(new Error('Storage error'));

    const { result } = renderHook(() => useStatistics());

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.isLoaded).toBe(false);
    expect(result.current.statistics).toBe(null);

    consoleSpy.mockRestore();
  });

  it('merge avec les valeurs par défaut en cas de données partielles', async () => {
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
    it('retourne des zéros par défaut', async () => {
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

    it('calcule totalGrouping et totalDedup depuis les compteurs historiques', async () => {
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

    it('parse firstUsedAt en Date', async () => {
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

    it("calcule thisWeek depuis les buckets du jour courant", async () => {
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

    it('utilise les domainRules pour les labels des topRules', async () => {
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
