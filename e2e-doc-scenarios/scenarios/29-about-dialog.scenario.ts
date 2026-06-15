/**
 * Scenario 29 — About dialog.
 *
 * Element-cropped capture of the About dialog for the Starlight docs. The
 * dialog is reached from the workspace switcher in the Options sidebar
 * footer (`About...` item), then captured cropped to its own bounding box
 * so the docs show a clean identity card (version, environment, links,
 * open source credits).
 */
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import { openExtensionPage } from '../helpers/ui-actions.js';
import { clearExtensionStorage, seedDomainRules } from '../../e2e-shared/actions/index.js';
import { SCREENSHOT_RULES } from '../fixtures/seed-data.js';
import { ABOUT_DIALOG_MANIFEST } from './29-about-dialog.routing.js';

const SCENARIO_ID = '29-about-dialog';

test.describe.configure({ mode: 'serial' });

test('about dialog', async (
  { extensionContext, extensionId, docLocale: locale, docTheme: theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [ABOUT_DIALOG_MANIFEST],
  });

  await clearExtensionStorage(extensionContext);
  // A couple of rules so the sidebar footer (which hosts the workspace
  // switcher) renders in a realistic, non-empty Options page.
  await seedDomainRules(extensionContext, SCREENSHOT_RULES);

  const page = await openExtensionPage(extensionContext, extensionId, '', locale, theme);

  // Open the workspace switcher dropdown in the sidebar footer, then the
  // "About..." entry that opens the dialog.
  await page.getByTestId('workspace-footer-trigger').click();
  await page.getByTestId('workspace-switcher-about').click();

  const dialog = page.getByTestId('about-dialog');
  await dialog.waitFor({ state: 'visible', timeout: 5_000 });
  // Let the open animation settle and the third-party credit chips load.
  await page.waitForTimeout(500);

  await captureStep(page, 'about-dialog', {
    description:
      'About dialog: version, environment details, useful links and open source credits.',
    elementSelector: '[data-testid="about-dialog"]',
  });
  await page.close();

  await writeScenarioReadme({
    title: `About dialog - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro: 'Element-cropped About dialog capture used by the Starlight documentation.',
  });
});
