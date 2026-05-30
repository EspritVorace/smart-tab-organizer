/**
 * Scenario 23 — Settings page.
 *
 * Captures the Settings page (deduplication toggles, notification
 * preferences) for the Starlight docs. Ported from the former
 * `e2e-screenshots/pages/settings.screenshots.ts`.
 */
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import { openExtensionPage } from '../helpers/ui-actions.js';
import {
  clearExtensionStorage,
  seedDomainRules,
} from '../../e2e-shared/actions/index.js';
import { SCREENSHOT_RULES } from '../fixtures/seed-data.js';
import { SETTINGS_MANIFEST } from './23-settings.routing.js';

const SCENARIO_ID = '23-settings';

test.describe.configure({ mode: 'serial' });

test('settings page', async (
  { extensionContext, extensionId, docLocale: locale, docTheme: theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [SETTINGS_MANIFEST],
  });

  await clearExtensionStorage(extensionContext);
  await seedDomainRules(extensionContext, SCREENSHOT_RULES);

  const page = await openExtensionPage(
    extensionContext,
    extensionId,
    'settings',
    locale,
    theme,
  );
  await page.waitForTimeout(300);
  await captureStep(page, 'settings-misc', {
    description: 'Settings page with deduplication and notification preferences.',
  });
  await page.close();

  await writeScenarioReadme({
    title: `Settings - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro: 'Settings page capture used by the Starlight documentation.',
  });
});
