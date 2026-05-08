/**
 * Satellite scenario `10-import-conflicts`.
 *
 * Starts with 4 seeded rules (reused from `e2e-screenshots/fixtures/rules-seed.ts`),
 * opens the rules import wizard, pastes a JSON crafted to produce one new,
 * one conflicting and one identical rule (`buildConflictJson()`), and
 * captures every step of the classification + conflict-mode resolution.
 */
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import {
  clearExtensionStorage,
  dismissDialog,
  importWizardNextToClassification,
  openExtensionPage,
  openImportRulesWizard,
  pasteImportJson,
  seedDomainRules,
  setImportConflictMode,
} from '../helpers/ui-actions.js';
import { SCREENSHOT_RULES } from '../../e2e-screenshots/fixtures/rules-seed.js';
import { buildConflictJson } from '../../e2e-screenshots/fixtures/conflicts-seed.js';
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

  await openImportRulesWizard(page);
  await pasteImportJson(page, buildConflictJson());
  await captureStep(page, 'import-wizard-paste', {
    description: 'Import wizard step 0, JSON pasted in Text mode (validation succeeded).',
  });

  await importWizardNextToClassification(page);
  await captureStep(page, 'import-wizard-classification-overwrite', {
    description: 'Classification step with conflict mode "overwrite" (default): one new, one conflicting, one identical.',
  });

  await setImportConflictMode(page, 'duplicate');
  await captureStep(page, 'import-wizard-classification-duplicate', {
    description: 'Classification step with conflict mode set to "duplicate".',
  });

  await setImportConflictMode(page, 'ignore');
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
