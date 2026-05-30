/**
 * Scenario 20 — Popup content.
 *
 * Element-cropped capture of the popup (no browser chrome) with rules and
 * sessions seeded, so the Starlight docs show a realistic command center.
 * Ported from the former `e2e-screenshots/pages/popup.screenshots.ts`.
 */
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import { openExtensionPage } from '../helpers/ui-actions.js';
import {
  clearExtensionStorage,
  seedDomainRules,
  seedSessions,
} from '../../e2e-shared/actions/index.js';
import {
  SCREENSHOT_RULES,
  SESSION_MORNING_DEV,
  PROFILE_WORK,
  PROFILE_PERSONAL,
} from '../fixtures/seed-data.js';
import { POPUP_MANIFEST } from './20-popup.routing.js';

const SCENARIO_ID = '20-popup';

test.describe.configure({ mode: 'serial' });

test('popup content', async (
  { extensionContext, extensionId, docLocale: locale, docTheme: theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [POPUP_MANIFEST],
  });

  await clearExtensionStorage(extensionContext);
  await seedDomainRules(extensionContext, SCREENSHOT_RULES);
  await seedSessions(extensionContext, [
    SESSION_MORNING_DEV,
    PROFILE_WORK,
    PROFILE_PERSONAL,
  ]);

  const popupPage = await openExtensionPage(
    extensionContext,
    extensionId,
    'popup',
    locale,
    theme,
  );
  await captureStep(popupPage, 'popup-content', {
    description: 'Popup with rules and sessions configured (command center).',
    elementSelector: '#popup-app',
  });
  await popupPage.close();

  await writeScenarioReadme({
    title: `Popup - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro:
      'Element-cropped popup capture used by the Starlight documentation.',
  });
});
