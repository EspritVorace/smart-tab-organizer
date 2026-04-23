import { describe, it, expect, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  getStatisticsData,
  setStatisticsData,
  updateStatisticsData,
  incrementStat,
  incrementTabGroupsCreated,
  incrementTabsDeduplicated,
  resetStatisticsData,
  watchStatisticsData,
} from '../../src/utils/statisticsUtils';
import { defaultStatistics } from '../../src/types/statistics';

// fakeBrowser.reset() est appelé avant chaque test via tests/setup.ts

describe('statisticsUtils', () => {
  describe('getStatisticsData', () => {
    it('retourne les valeurs par défaut si le storage est vide', async () => {
      const stats = await getStatisticsData();
      expect(stats).toEqual(defaultStatistics);
    });

    it('retourne les données stockées', async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 10 },
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
      expect(stats.tabsDeduplicatedCount).toBe(0); // valeur par défaut
    });

    it('retourne les valeurs par défaut en cas d\'erreur', async () => {
      vi.spyOn(fakeBrowser.storage.local, 'get').mockRejectedValueOnce(
        new Error('Storage error'),
      );
      const stats = await getStatisticsData();
      expect(stats).toEqual(defaultStatistics);
    });
  });

  describe('setStatisticsData', () => {
    it('écrit les statistiques dans le storage', async () => {
      const data = { tabGroupsCreatedCount: 7, tabsDeduplicatedCount: 3 };
      await setStatisticsData(data);
      const stored = await fakeBrowser.storage.local.get('statistics');
      expect(stored.statistics).toEqual(data);
    });
  });

  describe('updateStatisticsData', () => {
    it('met à jour partiellement les statistiques', async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 10 },
      });
      await updateStatisticsData({ tabGroupsCreatedCount: 20 });
      const stats = await getStatisticsData();
      expect(stats.tabGroupsCreatedCount).toBe(20);
      expect(stats.tabsDeduplicatedCount).toBe(10); // inchangé
    });
  });

  describe('incrementStat', () => {
    it('incrémente tabGroupsCreatedCount de 1', async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 3, tabsDeduplicatedCount: 0 },
      });
      const updated = await incrementStat('tabGroupsCreatedCount');
      expect(updated.tabGroupsCreatedCount).toBe(4);
    });

    it('incrémente tabsDeduplicatedCount de 1', async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 7 },
      });
      const updated = await incrementStat('tabsDeduplicatedCount');
      expect(updated.tabsDeduplicatedCount).toBe(8);
    });

    it('persiste la valeur incrémentée dans le storage', async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 2, tabsDeduplicatedCount: 0 },
      });
      await incrementStat('tabGroupsCreatedCount');
      const stats = await getStatisticsData();
      expect(stats.tabGroupsCreatedCount).toBe(3);
    });

    it('part de 0 si la clé est absente', async () => {
      const updated = await incrementStat('tabGroupsCreatedCount');
      expect(updated.tabGroupsCreatedCount).toBe(1);
    });
  });

  describe('incrementTabGroupsCreated', () => {
    it('incrémente tabGroupsCreatedCount', async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 1, tabsDeduplicatedCount: 0 },
      });
      await incrementTabGroupsCreated();
      const stats = await getStatisticsData();
      expect(stats.tabGroupsCreatedCount).toBe(2);
    });
  });

  describe('incrementTabsDeduplicated', () => {
    it('incrémente tabsDeduplicatedCount', async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 4 },
      });
      await incrementTabsDeduplicated();
      const stats = await getStatisticsData();
      expect(stats.tabsDeduplicatedCount).toBe(5);
    });
  });

  describe('resetStatisticsData', () => {
    it('remet les statistiques aux valeurs par défaut', async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 100, tabsDeduplicatedCount: 200 },
      });
      await resetStatisticsData();
      const stats = await getStatisticsData();
      expect(stats).toEqual(defaultStatistics);
    });
  });

  describe('watchStatisticsData', () => {
    it('retourne une fonction de cleanup', () => {
      const unwatch = watchStatisticsData(() => {});
      expect(typeof unwatch).toBe('function');
      unwatch();
    });

    it('la fonction de cleanup peut être appelée sans erreur', () => {
      const unwatch = watchStatisticsData(vi.fn());
      expect(() => unwatch()).not.toThrow();
    });
  });
});
