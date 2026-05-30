/**
 * Satellite scenario `10-import-conflicts`.
 *
 * Starts with the shared seeded rules (`../fixtures/seed-data.ts`),
 * opens the rules import wizard, pastes a JSON crafted to produce one new,
 * one conflicting and one identical rule (`buildConflictJson()`), and
 * captures every step of the classification + conflict-mode resolution.
 *
 * Lot 6 (issue #309): consumes shared Domain Actions and the
 * `ImportWizardPage` Page Object exclusively, so a DOM evolution on the
 * import wizard breaks the functional and narrative pipelines at the same
 * call site.
 */
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import { dismissDialog, openExtensionPage } from '../helpers/ui-actions.js';
import {
  clearExtensionStorage,
  openRulesImportWizard,
  seedDomainRules,
} from '../../e2e-shared/actions/index.js';
import { SCREENSHOT_RULES, buildConflictJson } from '../fixtures/seed-data.js';
import { IMPORT_CONFLICTS_MANIFEST } from './10-import-conflicts.routing.js';

const SCENARIO_ID = '10-import-conflicts';

test.describe.configure({ mode: 'serial' });

test('import conflicts', async (
  { extensionContext, extensionId, docLocale: locale, docTheme: theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [IMPORT_CONFLICTS_MANIFEST],
  });

  await clearExtensionStorage(extensionContext);
  // Reuse the screenshot pipeline's 6-rule seed: covers preset, smart_label,
  // title-regex, smart_manual, disabled, and another smart_label rule. The
  // crafted import JSON targets labels "GitHub" (conflicting), "Slack" (new),
  // and "Linear" (identical) so all three classification buckets are populated.
  await seedDomainRules(extensionContext, SCREENSHOT_RULES);

  const page = await openExtensionPage(
    extensionContext,
    extensionId,
    'importexport',
    locale,
    theme,
  );
  await page.getByTestId('page-import-export').waitFor({ state: 'visible' });
  await captureStep(page, 'import-export-with-rules', {
    description: 'Import/Export page with four seeded rules ready to be imported on top of.',
  });

  const wizard = await openRulesImportWizard(page);
  await wizard.pasteJson(buildConflictJson());
  // Validation runs on each input change; brief breath so the success
  // callout renders before capture.
  await page.waitForTimeout(200);
  await captureStep(page, 'import-wizard-paste', {
    description: 'Import wizard step 0, JSON pasted in Text mode (validation succeeded).',
  });

  await wizard.clickNext();
  // Radix renders step 1 inside the same dialog; small breath so the
  // classification scroll area mounts before capture.
  await page.waitForTimeout(300);
  await captureStep(page, 'import-wizard-classification-overwrite', {
    description: 'Classification step with conflict mode "overwrite" (default): one new, one conflicting, one identical.',
  });

  await wizard.setConflictMode('duplicate');
  await page.waitForTimeout(150);
  await captureStep(page, 'import-wizard-classification-duplicate', {
    description: 'Classification step with conflict mode set to "duplicate".',
  });

  await wizard.setConflictMode('ignore');
  await page.waitForTimeout(150);
  await captureStep(page, 'import-wizard-classification-ignore', {
    description: 'Classification step with conflict mode set to "ignore".',
  });

  await dismissDialog(page);
  await page.close();

  await writeScenarioReadme({
    title: `Import conflicts - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro:
      'Satellite scenario that imports a JSON containing identical, conflicting and new rules on top of a four-rule seed, capturing the classification step under each conflict-resolution mode.',
  });
});
