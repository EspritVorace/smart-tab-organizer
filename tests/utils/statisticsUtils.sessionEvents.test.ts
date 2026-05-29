import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  getStatisticsData,
  incrementSessionEvent,
  purgeOldSessionBuckets,
} from '../../src/utils/statisticsUtils';
import type { SessionDailyBuckets, Statistics } from '../../src/types/statistics';
import { defaultStatistics } from '../../src/types/statistics';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

describe('statisticsUtils session events', () => {
  beforeEach(async () => {
    await fakeBrowser.storage.local.clear();
  });

  describe('incrementSessionEvent', () => {
    it('initializes session events when storage is empty', async () => {
      await incrementSessionEvent('created');
      const stats = await getStatisticsData();
      expect(stats.sessionEvents?.created).toBe(1);
      expect(stats.sessionEvents?.restored).toBe(0);
      expect(stats.sessionEvents?.archived).toBe(0);
      expect(stats.sessionEvents?.dailyBuckets[todayStr()].created).toBe(1);
    });

    it('increments restored counter and tabsRestored together', async () => {
      await incrementSessionEvent('restored', { tabsRestored: 5 });
      const stats = await getStatisticsData();
      expect(stats.sessionEvents?.restored).toBe(1);
      expect(stats.sessionEvents?.tabsRestored).toBe(5);
      const today = stats.sessionEvents?.dailyBuckets[todayStr()];
      expect(today?.restored).toBe(1);
      expect(today?.tabsRestored).toBe(5);
    });

    it('does not bump tabsRestored on non-restored events', async () => {
      await incrementSessionEvent('archived');
      await incrementSessionEvent('created');
      const stats = await getStatisticsData();
      expect(stats.sessionEvents?.tabsRestored).toBe(0);
    });

    it('preserves existing rule statistics fields', async () => {
      const initial: Statistics = {
        ...defaultStatistics,
        tabGroupsCreatedCount: 12,
        tabsDeduplicatedCount: 3,
      };
      await fakeBrowser.storage.local.set({ statistics: initial });
      await incrementSessionEvent('created');
      const stats = await getStatisticsData();
      expect(stats.tabGroupsCreatedCount).toBe(12);
      expect(stats.tabsDeduplicatedCount).toBe(3);
      expect(stats.sessionEvents?.created).toBe(1);
    });

    it('sets firstUsedAt on first call if missing', async () => {
      await incrementSessionEvent('created');
      const stats = await getStatisticsData();
      expect(stats.firstUsedAt).toBeDefined();
    });

    it('accumulates multiple events on the same day', async () => {
      await incrementSessionEvent('created');
      await incrementSessionEvent('created');
      await incrementSessionEvent('restored', { tabsRestored: 3 });
      await incrementSessionEvent('restored', { tabsRestored: 2 });
      const stats = await getStatisticsData();
      expect(stats.sessionEvents?.created).toBe(2);
      expect(stats.sessionEvents?.restored).toBe(2);
      expect(stats.sessionEvents?.tabsRestored).toBe(5);
      const today = stats.sessionEvents?.dailyBuckets[todayStr()];
      expect(today?.created).toBe(2);
      expect(today?.restored).toBe(2);
      expect(today?.tabsRestored).toBe(5);
    });

    it('migrates legacy statistics (without sessionEvents) transparently', async () => {
      await fakeBrowser.storage.local.set({
        statistics: {
          tabGroupsCreatedCount: 5,
          tabsDeduplicatedCount: 2,
          dailyBuckets: {},
        },
      });
      await incrementSessionEvent('archived');
      const stats = await getStatisticsData();
      expect(stats.sessionEvents?.archived).toBe(1);
      expect(stats.tabGroupsCreatedCount).toBe(5);
    });
  });

  describe('purgeOldSessionBuckets', () => {
    it('drops buckets older than the cutoff', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10);
      const buckets: SessionDailyBuckets = {
        [oldDate.toISOString().slice(0, 10)]: { created: 1, restored: 0, tabsRestored: 0, archived: 0 },
        [recentDate.toISOString().slice(0, 10)]: { created: 2, restored: 0, tabsRestored: 0, archived: 0 },
      };
      const pruned = purgeOldSessionBuckets(buckets, 90);
      expect(Object.keys(pruned)).toHaveLength(1);
      expect(pruned[recentDate.toISOString().slice(0, 10)].created).toBe(2);
    });
  });
});
