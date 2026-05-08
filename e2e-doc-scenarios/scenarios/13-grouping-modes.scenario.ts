/**
 * Satellite scenario `13-grouping-modes`.
 *
 * Opens the rule creation wizard, walks step 1 once, and captures step 2 with
 * each configuration mode selected (`preset`, `ask`, `manual`). The
 * `config-mode-description` paragraph rendered next to the mode list provides
 * the contextual explanation requested by US-DS003.
 */
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import {
  clearExtensionStorage,
  dismissRuleWizard,
  fillRuleWizardStep1,
  openExtensionPage,
  openRuleWizard,
  selectConfigurationMode,
  type ConfigMode,
} from '../helpers/ui-actions.js';
import { GROUPING_MODES_MANIFEST } from './13-grouping-modes.routing.js';

const SCENARIO_ID = '13-grouping-modes';

const MODES: ConfigMode[] = ['preset', 'ask', 'manual'];

test.describe.configure({ mode: 'serial' });

test('grouping modes', async (
  { extensionContext, extensionId, docLocale: locale, docTheme: theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [GROUPING_MODES_MANIFEST],
  });

  await clearExtensionStorage(extensionContext);

  const rulesPage = await openExtensionPage(
    extensionContext,
    extensionId,
    'rules',
    locale,
    theme,
  );

  await openRuleWizard(rulesPage);
  await fillRuleWizardStep1(rulesPage, {
    label: 'GitHub',
    domainFilter: 'github.com',
  });

  for (const mode of MODES) {
    await selectConfigurationMode(rulesPage, mode);
    // The right column carries the contextual description for the active mode.
    await rulesPage
      .getByTestId('config-mode-description')
      .waitFor({ state: 'visible' });
    await captureStep(rulesPage, `rules-wizard-step2-mode-${mode}`, {
      description: `Rule wizard step 2 with configuration mode "${mode}" selected and its contextual description visible.`,
    });
  }

  await dismissRuleWizard(rulesPage);
  await rulesPage.close();

  await writeScenarioReadme({
    title: `Grouping modes - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro:
      'Satellite scenario that walks the rule wizard up to step 2 and captures the form once per configuration mode (preset, ask, manual) so the contextual description is visible for each.',
  });
});
