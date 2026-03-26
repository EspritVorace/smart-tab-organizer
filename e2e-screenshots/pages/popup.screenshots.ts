/**
 * Popup screenshots (1 screen × 3 locales × 2 themes = 6 PNGs)
 */
import { test } from '../helpers/screenshot-fixture.js';
import { captureAll } from '../helpers/screenshot-helper.js';
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
});
