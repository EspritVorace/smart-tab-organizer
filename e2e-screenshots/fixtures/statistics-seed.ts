/**
 * Seed data for statistics screenshots.
 *
 * Injects realistic statistics into chrome.storage.local to produce
 * a rich, non-trivial screenshot of the Statistics page.
 */
import type { BrowserContext } from '@playwright/test';
import { getServiceWorker } from '../helpers/screenshot-helper.js';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Build realistic daily buckets spread over recent weeks, using the same
 * rule IDs as SCREENSHOT_RULES from rules-seed.ts.
 */
function buildDailyBuckets(): Record<string, Record<string, { grouping: number; dedup: number }>> {
  return {
    // This week
    [daysAgo(0)]: {
      'sc-rule-jira':   { grouping: 4, dedup: 1 },
      'sc-rule-github': { grouping: 3, dedup: 0 },
    },
    [daysAgo(1)]: {
      'sc-rule-jira':   { grouping: 5, dedup: 2 },
      'sc-rule-notion': { grouping: 2, dedup: 0 },
    },
    [daysAgo(2)]: {
      'sc-rule-github': { grouping: 6, dedup: 1 },
      'sc-rule-linear': { grouping: 3, dedup: 0 },
    },
    // Last week
    [daysAgo(8)]: {
      'sc-rule-jira':   { grouping: 3, dedup: 1 },
      'sc-rule-github': { grouping: 2, dedup: 0 },
    },
    [daysAgo(10)]: {
      'sc-rule-notion': { grouping: 1, dedup: 0 },
      'sc-rule-trello': { grouping: 2, dedup: 1 },
    },
    // Older (within 30 days — counts in top rules but not weekly)
    [daysAgo(20)]: {
      'sc-rule-jira':   { grouping: 10, dedup: 3 },
      'sc-rule-github': { grouping: 8, dedup: 2 },
      'sc-rule-linear': { grouping: 5, dedup: 0 },
    },
  };
}

/** Inject statistics into chrome.storage.local, bypassing the UI. */
export async function seedStatistics(context: BrowserContext): Promise<void> {
  const sw = await getServiceWorker(context);
  const buckets = buildDailyBuckets();

  await sw.evaluate(async (stats) => {
    await chrome.storage.local.set({ statistics: stats });
  }, {
    tabGroupsCreatedCount: 142,
    tabsDeduplicatedCount: 38,
    dailyBuckets: buckets,
    firstUsedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  } as Parameters<typeof sw.evaluate>[1]);

  await new Promise((r) => setTimeout(r, 150));
}

/** Remove statistics from storage. */
export async function clearStatistics(context: BrowserContext): Promise<void> {
  const sw = await getServiceWorker(context);
  await sw.evaluate(async () => {
    await chrome.storage.local.remove('statistics');
  });
  await new Promise((r) => setTimeout(r, 100));
}
