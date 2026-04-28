/**
 * Statistics page screenshots (2 screens x 3 locales x 2 themes = 12 PNGs)
 *
 *  statistics-overview  Rich data: totals, weekly trend badges, top-rules bars.
 *  statistics-empty     Default state before any grouping or dedup has occurred.
 */
import { test } from '../helpers/screenshot-fixture.js';
import { captureAll } from '../helpers/screenshot-helper.js';
import { seedRules } from '../fixtures/rules-seed.js';
import { seedStatistics, clearStatistics } from '../fixtures/statistics-seed.js';

test.describe('Statistics screenshots', () => {
  /**
   * statistics-overview
   * Statistics page populated with realistic data:
   *   section 1 (totals) + section 2 (this-week trends) + section 3 (top rules bars).
   */
  test('statistics-overview', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);
    await seedStatistics(extensionContext);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'stats',
      'statistics-overview',
    );

    await clearStatistics(extensionContext);
  });

  /**
   * statistics-empty
   * Statistics page in its default state (all zeros, no data yet).
   * Illustrates the empty / first-launch experience.
   */
  test('statistics-empty', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);
    await clearStatistics(extensionContext);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'stats',
      'statistics-empty',
    );
  });
});
