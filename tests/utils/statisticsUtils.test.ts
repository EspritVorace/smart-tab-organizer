import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import {
  getStatisticsData,
  setStatisticsData,
  updateStatisticsData,
  incrementStat,
  stampRuleLastUsed,
  resetStatisticsData,
  watchStatisticsData,
  purgeOldBuckets,
} from '../../src/utils/statisticsUtils';
import { defaultStatistics } from '../../src/types/statistics';

describe('statisticsUtils', () => {
  describe('getStatisticsData', () => {
    it('returns default values when storage is empty', async () => {
      const stats = await getStatisticsData();
      expect(stats).toEqual(defaultStatistics);
    });

    it('returns the stored data', async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 10, dailyBuckets: {} },
      });
      const stats = await getStatisticsData();
      expect(stats.tabGroupsCreatedCount).toBe(5);
      expect(stats.tabsDeduplicatedCount).toBe(10);
    });

    it('merges with default values when stored data is partial', async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 42 },
      });
      const stats = await getStatisticsData();
      expect(stats.tabGroupsCreatedCount).toBe(42);
      expect(stats.tabsDeduplicatedCount).toBe(0);
      expect(stats.dailyBuckets).toEqual({});
    });

    it('returns default values on error', async () => {
      vi.spyOn(fakeBrowser.storage.local, 'get').mockRejectedValueOnce(
        new Error('Storage error'),
      );
      const stats = await getStatisticsData();
      expect(stats).toEqual(defaultStatistics);
    });
  });

  describe('setStatisticsData', () => {
    it('writes statistics to storage', async () => {
      const data = { tabGroupsCreatedCount: 7, tabsDeduplicatedCount: 3, dailyBuckets: {} };
      await setStatisticsData(data);
      const stored = await fakeBrowser.storage.local.get('statistics');
      expect(stored.statistics).toEqual(data);
    });
  });

  describe('updateStatisticsData', () => {
    it('partially updates statistics', async () => {
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
    it("increments tabGroupsCreatedCount for type 'grouping'", async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 3, tabsDeduplicatedCount: 0, dailyBuckets: {} },
      });
      await incrementStat('grouping', 'rule-1');
      const stats = await getStatisticsData();
      expect(stats.tabGroupsCreatedCount).toBe(4);
      expect(stats.tabsDeduplicatedCount).toBe(0);
    });

    it("increments tabsDeduplicatedCount for type 'dedup'", async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 7, dailyBuckets: {} },
      });
      await incrementStat('dedup', 'rule-2');
      const stats = await getStatisticsData();
      expect(stats.tabsDeduplicatedCount).toBe(8);
      expect(stats.tabGroupsCreatedCount).toBe(0);
    });

    it("writes to the daily bucket for the rule", async () => {
      await incrementStat('grouping', 'rule-abc');
      const stats = await getStatisticsData();
      const today = new Date().toISOString().slice(0, 10);
      expect(stats.dailyBuckets[today]?.['rule-abc']?.grouping).toBe(1);
      expect(stats.dailyBuckets[today]?.['rule-abc']?.dedup).toBe(0);
    });

    it('accumulates successive calls in the bucket', async () => {
      await incrementStat('grouping', 'rule-x');
      await incrementStat('grouping', 'rule-x');
      await incrementStat('dedup', 'rule-x');
      const stats = await getStatisticsData();
      const today = new Date().toISOString().slice(0, 10);
      expect(stats.dailyBuckets[today]?.['rule-x']?.grouping).toBe(2);
      expect(stats.dailyBuckets[today]?.['rule-x']?.dedup).toBe(1);
    });

    it('initializes firstUsedAt on the first increment', async () => {
      const stats = await getStatisticsData();
      expect(stats.firstUsedAt).toBeUndefined();
      await incrementStat('grouping', 'rule-1');
      const updated = await getStatisticsData();
      expect(updated.firstUsedAt).toBeDefined();
    });

    it('does not change firstUsedAt when it is already set', async () => {
      const existingDate = '2026-01-01T00:00:00.000Z';
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 1, tabsDeduplicatedCount: 0, dailyBuckets: {}, firstUsedAt: existingDate },
      });
      await incrementStat('grouping', 'rule-1');
      const stats = await getStatisticsData();
      expect(stats.firstUsedAt).toBe(existingDate);
    });
  });

  describe('stampRuleLastUsed', () => {
    type StoredRule = { id: string; lastUsedAt?: string };

    async function readRules(): Promise<StoredRule[]> {
      return (await fakeBrowser.storage.local.get('domainRules')).domainRules as StoredRule[];
    }

    it('stamps lastUsedAt on the matching rule only', async () => {
      await fakeBrowser.storage.local.set({
        domainRules: [{ id: 'r1' }, { id: 'r2' }],
      });
      await stampRuleLastUsed('r1');
      const rules = await readRules();
      expect(rules.find((r) => r.id === 'r1')?.lastUsedAt).toBeDefined();
      expect(rules.find((r) => r.id === 'r2')?.lastUsedAt).toBeUndefined();
    });

    it("ignores the synthetic '__unmatched__' id", async () => {
      await fakeBrowser.storage.local.set({ domainRules: [{ id: 'r1' }] });
      await stampRuleLastUsed('__unmatched__');
      expect((await readRules())[0].lastUsedAt).toBeUndefined();
    });

    it('does nothing when the rule id is unknown', async () => {
      await fakeBrowser.storage.local.set({ domainRules: [{ id: 'r1' }] });
      await stampRuleLastUsed('does-not-exist');
      expect((await readRules())[0].lastUsedAt).toBeUndefined();
    });

    it('does not throw when there are no rules', async () => {
      await expect(stampRuleLastUsed('r1')).resolves.toBeUndefined();
    });
  });

  describe('resetStatisticsData', () => {
    it('resets statistics back to default values', async () => {
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

    it('does not throw when setStatisticsData fails', async () => {
      vi.spyOn(fakeBrowser.storage.local, 'set').mockRejectedValueOnce(
        new Error('Storage write error'),
      );
      await expect(resetStatisticsData()).resolves.toBeUndefined();
    });
  });

  describe('watchStatisticsData', () => {
    it('returns a cleanup function', () => {
      const unwatch = watchStatisticsData(() => {});
      expect(typeof unwatch).toBe('function');
      unwatch();
    });

    it('invokes the callback with data merged with defaults when storage changes', async () => {
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
  it('keeps recent entries', () => {
    const today = new Date().toISOString().slice(0, 10);
    const buckets = { [today]: { 'rule-1': { grouping: 1, dedup: 0 } } };
    expect(purgeOldBuckets(buckets)).toEqual(buckets);
  });

  it('removes entries older than maxDays days', () => {
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

  it('keeps entries that are exactly maxDays days old', () => {
    const boundary = new Date();
    boundary.setDate(boundary.getDate() - 90);
    const boundaryDate = boundary.toISOString().slice(0, 10);
    const buckets = { [boundaryDate]: { 'rule-1': { grouping: 1, dedup: 0 } } };
    const result = purgeOldBuckets(buckets);
    expect(result[boundaryDate]).toBeDefined();
  });

  it('returns an empty object when buckets is empty', () => {
    expect(purgeOldBuckets({})).toEqual({});
  });

  it('respects a custom maxDays value', () => {
    const old = new Date();
    old.setDate(old.getDate() - 8);
    const oldDate = old.toISOString().slice(0, 10);
    const buckets = { [oldDate]: { 'rule-1': { grouping: 1, dedup: 0 } } };
    expect(purgeOldBuckets(buckets, 7)[oldDate]).toBeUndefined();
    expect(purgeOldBuckets(buckets, 30)[oldDate]).toBeDefined();
  });
});
