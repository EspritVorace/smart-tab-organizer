import { describe, it, expect } from 'vitest';
import { statisticsSchema } from '../../src/schemas/statistics';

describe('statisticsSchema', () => {
  it('parses an empty object using all defaults', () => {
    const result = statisticsSchema.parse({});
    expect(result).toEqual({
      tabGroupsCreatedCount: 0,
      tabsDeduplicatedCount: 0,
      dailyBuckets: {},
    });
  });

  it('preserves provided counters', () => {
    const result = statisticsSchema.parse({
      tabGroupsCreatedCount: 5,
      tabsDeduplicatedCount: 12,
    });
    expect(result.tabGroupsCreatedCount).toBe(5);
    expect(result.tabsDeduplicatedCount).toBe(12);
  });

  it('accepts a populated dailyBuckets structure', () => {
    const result = statisticsSchema.parse({
      dailyBuckets: {
        '2026-05-03': {
          'rule-1': { grouping: 3, dedup: 1 },
          'rule-2': { grouping: 0, dedup: 4 },
        },
      },
    });
    expect(result.dailyBuckets['2026-05-03']['rule-1']).toEqual({
      grouping: 3,
      dedup: 1,
    });
  });

  it('fills missing rule bucket counts with 0', () => {
    const result = statisticsSchema.parse({
      dailyBuckets: {
        '2026-05-03': {
          'rule-1': {},
        },
      },
    });
    expect(result.dailyBuckets['2026-05-03']['rule-1']).toEqual({
      grouping: 0,
      dedup: 0,
    });
  });

  it('preserves the firstUsedAt timestamp when provided', () => {
    const result = statisticsSchema.parse({
      firstUsedAt: '2026-01-01T00:00:00Z',
    });
    expect(result.firstUsedAt).toBe('2026-01-01T00:00:00Z');
  });

  it('rejects negative counters', () => {
    expect(() => statisticsSchema.parse({ tabGroupsCreatedCount: -1 })).toThrow();
    expect(() => statisticsSchema.parse({ tabsDeduplicatedCount: -3 })).toThrow();
  });

  it('rejects non-integer counters', () => {
    expect(() => statisticsSchema.parse({ tabGroupsCreatedCount: 1.5 })).toThrow();
  });

  it('rejects negative grouping/dedup values inside a bucket', () => {
    expect(() =>
      statisticsSchema.parse({
        dailyBuckets: { '2026-05-03': { 'rule-1': { grouping: -1, dedup: 0 } } },
      }),
    ).toThrow();
  });
});
