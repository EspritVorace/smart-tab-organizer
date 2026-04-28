import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import {
  getStatisticsData,
  setStatisticsData,
  updateStatisticsData,
  incrementStat,
  resetStatisticsData,
  watchStatisticsData,
  purgeOldBuckets,
} from '../../src/utils/statisticsUtils';
import { defaultStatistics } from '../../src/types/statistics';

describe('statisticsUtils', () => {
  describe('getStatisticsData', () => {
    it('retourne les valeurs par défaut si le storage est vide', async () => {
      const stats = await getStatisticsData();
      expect(stats).toEqual(defaultStatistics);
    });

    it('retourne les données stockées', async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 10, dailyBuckets: {} },
      });
      const stats = await getStatisticsData();
      expect(stats.tabGroupsCreatedCount).toBe(5);
      expect(stats.tabsDeduplicatedCount).toBe(10);
    });

    it('fusionne avec les valeurs par défaut si données partielles', async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 42 },
      });
      const stats = await getStatisticsData();
      expect(stats.tabGroupsCreatedCount).toBe(42);
      expect(stats.tabsDeduplicatedCount).toBe(0);
      expect(stats.dailyBuckets).toEqual({});
    });

    it("retourne les valeurs par défaut en cas d'erreur", async () => {
      vi.spyOn(fakeBrowser.storage.local, 'get').mockRejectedValueOnce(
        new Error('Storage error'),
      );
      const stats = await getStatisticsData();
      expect(stats).toEqual(defaultStatistics);
    });
  });

  describe('setStatisticsData', () => {
    it('écrit les statistiques dans le storage', async () => {
      const data = { tabGroupsCreatedCount: 7, tabsDeduplicatedCount: 3, dailyBuckets: {} };
      await setStatisticsData(data);
      const stored = await fakeBrowser.storage.local.get('statistics');
      expect(stored.statistics).toEqual(data);
    });
  });

  describe('updateStatisticsData', () => {
    it('met à jour partiellement les statistiques', async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 10, dailyBuckets: {} },
      });
      await updateStatisticsData({ tabGroupsCreatedCount: 20 });
      const stats = await getStatisticsData();
      expect(stats.tabGroupsCreatedCount).toBe(20);
      expect(stats.tabsDeduplicatedCount).toBe(10);
    });
  });

  describe('incrementStat', () => {
    it("incrémente tabGroupsCreatedCount pour type 'grouping'", async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 3, tabsDeduplicatedCount: 0, dailyBuckets: {} },
      });
      await incrementStat('grouping', 'rule-1');
      const stats = await getStatisticsData();
      expect(stats.tabGroupsCreatedCount).toBe(4);
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });

    it("incrémente tabsDeduplicatedCount pour type 'dedup'", async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 7, dailyBuckets: {} },
      });
      await incrementStat('dedup', 'rule-2');
      const stats = await getStatisticsData();
      expect(stats.tabsDeduplicatedCount).toBe(8);
      expect(stats.tabGroupsCreatedCount).toBe(0);
    });

    it('écrit dans le bucket journalier pour la règle', async () => {
      await incrementStat('grouping', 'rule-abc');
      const stats = await getStatisticsData();
      const today = new Date().toISOString().slice(0, 10);
      expect(stats.dailyBuckets[today]?.['rule-abc']?.grouping).toBe(1);
      expect(stats.dailyBuckets[today]?.['rule-abc']?.dedup).toBe(0);
    });

    it('cumule les appels successifs dans le bucket', async () => {
      await incrementStat('grouping', 'rule-x');
      await incrementStat('grouping', 'rule-x');
      await incrementStat('dedup', 'rule-x');
      const stats = await getStatisticsData();
      const today = new Date().toISOString().slice(0, 10);
      expect(stats.dailyBuckets[today]?.['rule-x']?.grouping).toBe(2);
      expect(stats.dailyBuckets[today]?.['rule-x']?.dedup).toBe(1);
    });

    it('initialise firstUsedAt au premier incrément', async () => {
      const stats = await getStatisticsData();
      expect(stats.firstUsedAt).toBeUndefined();
      await incrementStat('grouping', 'rule-1');
      const updated = await getStatisticsData();
      expect(updated.firstUsedAt).toBeDefined();
    });

    it('ne modifie pas firstUsedAt si déjà défini', async () => {
      const existingDate = '2026-01-01T00:00:00.000Z';
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 1, tabsDeduplicatedCount: 0, dailyBuckets: {}, firstUsedAt: existingDate },
      });
      await incrementStat('grouping', 'rule-1');
      const stats = await getStatisticsData();
      expect(stats.firstUsedAt).toBe(existingDate);
    });
  });

  describe('resetStatisticsData', () => {
    it('remet les statistiques aux valeurs par défaut', async () => {
      await fakeBrowser.storage.local.set({
        statistics: {
          tabGroupsCreatedCount: 100,
          tabsDeduplicatedCount: 200,
          dailyBuckets: { '2026-01-01': { 'rule-1': { grouping: 5, dedup: 2 } } },
          firstUsedAt: '2026-01-01T00:00:00.000Z',
        },
      });
      await resetStatisticsData();
      const stats = await getStatisticsData();
      expect(stats).toEqual(defaultStatistics);
      expect(stats.firstUsedAt).toBeUndefined();
      expect(stats.dailyBuckets).toEqual({});
    });

    it("ne lance pas d'erreur si setStatisticsData échoue", async () => {
      vi.spyOn(fakeBrowser.storage.local, 'set').mockRejectedValueOnce(
        new Error('Storage write error'),
      );
      await expect(resetStatisticsData()).resolves.toBeUndefined();
    });
  });

  describe('watchStatisticsData', () => {
    it('retourne une fonction de cleanup', () => {
      const unwatch = watchStatisticsData(() => {});
      expect(typeof unwatch).toBe('function');
      unwatch();
    });

    it('invoque le callback avec les données fusionnées aux défauts quand le storage change', async () => {
      const callback = vi.fn();
      const unwatch = watchStatisticsData(callback);

      await setStatisticsData({ tabGroupsCreatedCount: 3, tabsDeduplicatedCount: 1, dailyBuckets: {} });

      await waitFor(() => {
        expect(callback).toHaveBeenCalled();
      });

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ tabGroupsCreatedCount: 3, tabsDeduplicatedCount: 1 }),
      );
      unwatch();
    });
  });
});

describe('purgeOldBuckets', () => {
  it('conserve les entrées récentes', () => {
    const today = new Date().toISOString().slice(0, 10);
    const buckets = { [today]: { 'rule-1': { grouping: 1, dedup: 0 } } };
    expect(purgeOldBuckets(buckets)).toEqual(buckets);
  });

  it('supprime les entrées antérieures à maxDays jours', () => {
    const old = new Date();
    old.setDate(old.getDate() - 91);
    const oldDate = old.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const buckets = {
      [oldDate]: { 'rule-1': { grouping: 5, dedup: 2 } },
      [today]: { 'rule-2': { grouping: 1, dedup: 0 } },
    };
    const result = purgeOldBuckets(buckets);
    expect(result[oldDate]).toBeUndefined();
    expect(result[today]).toBeDefined();
  });

  it('conserve les entrées à exactement maxDays jours', () => {
    const boundary = new Date();
    boundary.setDate(boundary.getDate() - 90);
    const boundaryDate = boundary.toISOString().slice(0, 10);
    const buckets = { [boundaryDate]: { 'rule-1': { grouping: 1, dedup: 0 } } };
    const result = purgeOldBuckets(buckets);
    expect(result[boundaryDate]).toBeDefined();
  });

  it('retourne un objet vide si buckets est vide', () => {
    expect(purgeOldBuckets({})).toEqual({});
  });

  it('respecte un maxDays personnalisé', () => {
    const old = new Date();
    old.setDate(old.getDate() - 8);
    const oldDate = old.toISOString().slice(0, 10);
    const buckets = { [oldDate]: { 'rule-1': { grouping: 1, dedup: 0 } } };
    expect(purgeOldBuckets(buckets, 7)[oldDate]).toBeUndefined();
    expect(purgeOldBuckets(buckets, 30)[oldDate]).toBeDefined();
  });
});
