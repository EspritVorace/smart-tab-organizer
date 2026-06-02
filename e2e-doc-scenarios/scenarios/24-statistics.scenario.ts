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
  await page.getByTestId('page-stats-summary').waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  await captureStep(page, 'statistics-overview', {
    description: 'Statistics summary sub-page with headline KPIs and the weekly trend.',
  });

  // Walk the four sub-tabs so the docs show each detailed view.
  const subTabs: Array<{ tab: string; view: string; capture: string; description: string }> = [
    { tab: 'page-stats-tab-rules', view: 'page-stats-rules', capture: 'statistics-rules', description: 'Statistics rules sub-page: lifetime totals, weekly trend and most active rules.' },
    { tab: 'page-stats-tab-sessions', view: 'page-stats-sessions', capture: 'statistics-sessions', description: 'Statistics sessions sub-page: volumes, activity and top categories/domains.' },
    { tab: 'page-stats-tab-storage', view: 'page-stats-storage', capture: 'statistics-storage', description: 'Statistics storage sub-page: quota usage and per-category breakdown.' },
  ];

  for (const { tab, view, capture, description } of subTabs) {
    await page.getByTestId(tab).click();
    await page.getByTestId(view).waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    await captureStep(page, capture, { description });
  }

  await page.close();

  await writeScenarioReadme({
    title: `Statistics - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro: 'Populated Statistics page capture used by the Starlight documentation.',
  });
});
