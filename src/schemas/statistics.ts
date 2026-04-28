import { z } from 'zod';

const dailyRuleBucketSchema = z.object({
  grouping: z.number().int().min(0).default(0),
  dedup: z.number().int().min(0).default(0),
});

const dayBucketSchema = z.record(z.string(), dailyRuleBucketSchema);

const dailyBucketsSchema = z.record(z.string(), dayBucketSchema);

export const statisticsSchema = z.object({
  tabGroupsCreatedCount: z.number().int().min(0).default(0),
  tabsDeduplicatedCount: z.number().int().min(0).default(0),
  dailyBuckets: dailyBucketsSchema.default({}),
  firstUsedAt: z.string().optional(),
});

export type StatisticsFromSchema = z.infer<typeof statisticsSchema>;
