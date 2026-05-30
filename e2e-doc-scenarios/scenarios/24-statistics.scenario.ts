/**
 * Scenario 24 — Statistics overview.
 *
 * Seeds a deterministic statistics window and captures the populated
 * Statistics page for the Starlight docs. Ported from the former
 * `e2e-screenshots/pages/statistics.screenshots.ts`.
 */
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import { openExtensionPage } from '../helpers/ui-actions.js';
import {
  clearExtensionStorage,
  seedStorage,
} from '../../e2e-shared/actions/index.js';
import { buildStatistics } from '../fixtures/seed-data.js';
import { STATISTICS_MANIFEST } from './24-statistics.routing.js';

const SCENARIO_ID = '24-statistics';

test.describe.configure({ mode: 'serial' });

test('statistics overview', async (
  { extensionContext, extensionId, docLocale: locale, docTheme: theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [STATISTICS_MANIFEST],
  });

  await clearExtensionStorage(extensionContext);
  await seedStorage(extensionContext, { statistics: buildStatistics() });

  const page = await openExtensionPage(
    extensionContext,
    extensionId,
    'stats',
    locale,
    theme,
  );
  await page.getByTestId('page-stats').waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  await captureStep(page, 'statistics-overview', {
    description: 'Statistics page with totals, weekly trend and top-rules bars.',
  });
  await page.close();

  await writeScenarioReadme({
    title: `Statistics - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro: 'Populated Statistics page capture used by the Starlight documentation.',
  });
});
