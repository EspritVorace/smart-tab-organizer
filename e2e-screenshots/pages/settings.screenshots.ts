/**
 * Settings page screenshots (1 screen × 3 locales × 2 themes = 6 PNGs)
 */
import { test } from '../helpers/screenshot-fixture.js';
import { captureAll } from '../helpers/screenshot-helper.js';
import { seedRules } from '../fixtures/rules-seed.js';

test.describe('Settings screenshots', () => {
  /**
   * settings-misc
   * Settings section with deduplication toggles, notification preferences,
   * and other general settings.
   */
  test('settings-misc', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    // Seed some rules so the page is not in an empty state
    await seedRules(extensionContext);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'settings',
      'settings-misc',
      async (page) => {
        // Navigate to Settings via sidebar (hash routing only handles #sessions).
        // Sidebar button order: [0]=collapse, [1]=Rules, [2]=Import/Export,
        //   [3]=Sessions, [4]=Statistics, [5]=Settings
        await page.locator('button.rt-Button').nth(5).click();
        await page.waitForTimeout(400);
      },
    );
  });
});
