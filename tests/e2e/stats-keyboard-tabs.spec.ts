/**
 * E2E tests for the Statistics page keyboard shortcuts:
 *  - PageDown moves to the next sub-tab (summary -> rules -> sessions -> storage).
 *  - PageUp moves to the previous sub-tab.
 *  - Both are clamped at the ends (no wrap-around).
 *
 * The active sub-tab is asserted through the URL hash, which `handleTabChange`
 * keeps in sync (`#stats`, `#stats/rules`, `#stats/sessions`, `#stats/storage`).
 */
import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { goToStatsSection } from './helpers/navigation';

async function expectHash(page: Page, hash: string): Promise<void> {
  await page.waitForFunction((h) => window.location.hash === h, hash, {
    timeout: 5_000,
  });
  expect(new URL(page.url()).hash).toBe(hash);
}

test.describe('[KBD-STATS] Statistics sub-tab navigation', () => {
  test('PageDown / PageUp move between the stats sub-tabs, clamped at the ends', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToStatsSection(page, extensionId);

    // Arrives on the summary sub-tab.
    await expectHash(page, '#stats');

    // PageDown walks forward through every sub-tab.
    await page.keyboard.press('PageDown');
    await expectHash(page, '#stats/rules');
    await page.keyboard.press('PageDown');
    await expectHash(page, '#stats/sessions');
    await page.keyboard.press('PageDown');
    await expectHash(page, '#stats/storage');

    // Clamped at the last sub-tab: PageDown is a no-op.
    await page.keyboard.press('PageDown');
    await expectHash(page, '#stats/storage');

    // PageUp walks back to the first sub-tab.
    await page.keyboard.press('PageUp');
    await expectHash(page, '#stats/sessions');
    await page.keyboard.press('PageUp');
    await expectHash(page, '#stats/rules');
    await page.keyboard.press('PageUp');
    await expectHash(page, '#stats');

    // Clamped at the first sub-tab: PageUp is a no-op.
    await page.keyboard.press('PageUp');
    await expectHash(page, '#stats');

    await page.close();
  });
});
