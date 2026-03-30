/**
 * Popup screenshots (1 screen × 3 locales × 2 themes = 6 PNGs)
 */
import { test } from '../helpers/screenshot-fixture.js';
import { captureAll, captureAllElement } from '../helpers/screenshot-helper.js';
import { seedRules } from '../fixtures/rules-seed.js';
import { seedSessions } from '../fixtures/sessions-seed.js';
import { PROFILE_WORK, PROFILE_PERSONAL, SESSION_MORNING_DEV } from '../fixtures/sessions-seed.js';

test.describe('Popup screenshots', () => {
  /**
   * popup-overview
   * The extension popup showing statistics, quick-action toolbar, profiles list,
   * and the grouping / dedup toggle switches.
   * A pinned profile is seeded so the Profiles section is populated.
   */
  test('popup-overview', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);
    await seedSessions(extensionContext, [
      SESSION_MORNING_DEV,
      PROFILE_WORK,
      PROFILE_PERSONAL,
    ]);

    await captureAll(
      extensionContext,
      extensionId,
      locale,
      'popup',
      'popup-overview',
    );
  });

  /**
   * popup-content
   * The popup UI cropped to its exact dimensions (#popup-app bounding box),
   * without the surrounding browser chrome / white page margins.
   * Same seed as popup-overview so the content is identical.
   */
  test('popup-content', async ({ extensionContext, extensionId }, testInfo) => {
    const locale = testInfo.project.name;
    await seedRules(extensionContext);
    await seedSessions(extensionContext, [
      SESSION_MORNING_DEV,
      PROFILE_WORK,
      PROFILE_PERSONAL,
    ]);

    await captureAllElement(
      extensionContext,
      extensionId,
      locale,
      'popup',
      'popup-content',
      '#popup-app',
      async (page) => {
        // Resize viewport to popup width (350 px content + 2 px breathing room)
        // so that #popup-app fills exactly the popup dimensions without whitespace.
        await page.setViewportSize({ width: 352, height: 800 });
        await page.waitForTimeout(300);
      },
    );
  });
});
