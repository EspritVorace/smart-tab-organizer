/**
 * Scenario 21 - Rules feature screens.
 *
 * Captures the Domain Rules states reused by the Starlight docs and the
 * Chrome Web Store listing: the Add-Rule wizard step 1, the import file
 * dialog, and the bulk-action bar. Ported from the former
 * `e2e-screenshots/pages/rules.screenshots.ts`.
 *
 * The `rules-import-text-conflicts` documentation screen is produced by the
 * `10-import-conflicts` scenario (routed there), so it is not re-captured.
 */
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import { openExtensionPage, dismissDialog } from '../helpers/ui-actions.js';
import {
  clearExtensionStorage,
  openRuleWizard,
  openRulesImportWizard,
  seedDomainRules,
} from '../../e2e-shared/actions/index.js';
import { DomainRulesListPage } from '../../e2e-shared/pages/index.js';
import { SCREENSHOT_RULES } from '../fixtures/seed-data.js';
import { RULES_MANIFEST } from './21-rules.routing.js';

const SCENARIO_ID = '21-rules';

test.describe.configure({ mode: 'serial' });

test('rules feature screens', async (
  { extensionContext, extensionId, docLocale: locale, docTheme: theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [RULES_MANIFEST],
  });

  await clearExtensionStorage(extensionContext);
  await seedDomainRules(extensionContext, SCREENSHOT_RULES);

  // --- Add-Rule wizard, step 1 -------------------------------------------
  {
    const page = await openExtensionPage(
      extensionContext,
      extensionId,
      'rules',
      locale,
      theme,
    );
    await openRuleWizard(page);
    await captureStep(page, 'rules-create-step1', {
      description: 'Add-Rule wizard at step 1 (identity fields).',
    });
    await page.close();
  }

  // --- Bulk action bar ----------------------------------------------------
  {
    const page = await openExtensionPage(
      extensionContext,
      extensionId,
      'rules',
      locale,
      theme,
    );
    const list = new DomainRulesListPage(page);
    await list.expectListVisible();
    // Select two rules to reveal the bulk action bar.
    await list.selectRule('sc-rule-jira');
    await list.selectRule('sc-rule-github');
    await page.waitForTimeout(400);
    await captureStep(page, 'rules-bulk-actions', {
      description: 'Rules list with two rules selected and the bulk action bar visible.',
    });
    await page.close();
  }

  // --- Import wizard, file dialog ----------------------------------------
  {
    const page = await openExtensionPage(
      extensionContext,
      extensionId,
      'importexport',
      locale,
      theme,
    );
    await page.getByTestId('page-import-export').waitFor({ state: 'visible' });
    await openRulesImportWizard(page, { section: 'import-export' });
    await captureStep(page, 'rules-import-file-dialog', {
      description: 'Import wizard in file mode (initial step).',
    });
    await dismissDialog(page);
    await page.close();
  }

  await writeScenarioReadme({
    title: `Rules - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro:
      'Domain Rules feature screens reused by the documentation and the Chrome Web Store listing.',
  });
});
