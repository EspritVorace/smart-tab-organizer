/**
 * Satellite scenario `12-deduplication-modes`.
 *
 * Seeds a single rule, opens its edit wizard, expands the Options collapsible
 * and captures the form once for each deduplication match mode (`exact`,
 * `includes`, `exact_ignore_params`).
 */
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import {
  clearExtensionStorage,
  dismissDialog,
  expandEditWizardOptions,
  openEditRuleWizard,
  openExtensionPage,
  seedDomainRules,
  selectDeduplicationMode,
} from '../helpers/ui-actions.js';
import { DEDUPLICATION_MODES_MANIFEST } from './12-deduplication-modes.routing.js';

const SCENARIO_ID = '12-deduplication-modes';

const SEED_RULE = {
  id: 'doc-rule-dedup',
  domainFilter: 'github.com',
  label: 'GitHub',
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'smart_label',
  deduplicationMatchMode: 'exact',
  deduplicationEnabled: true,
  color: 'grey',
  categoryId: 'development',
  presetId: null,
  enabled: true,
};

const MODES = ['exact', 'includes', 'exact_ignore_params'] as const;

test.describe.configure({ mode: 'serial' });

test('deduplication modes', async (
  { extensionContext, extensionId, docLocale: locale, docTheme: theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [DEDUPLICATION_MODES_MANIFEST],
  });

  await clearExtensionStorage(extensionContext);
  await seedDomainRules(extensionContext, [SEED_RULE]);

  const rulesPage = await openExtensionPage(
    extensionContext,
    extensionId,
    'rules',
    locale,
    theme,
  );
  await rulesPage.getByTestId('page-rules-list').waitFor({ state: 'visible' });

  await openEditRuleWizard(rulesPage, SEED_RULE.id);
  await expandEditWizardOptions(rulesPage);

  for (const mode of MODES) {
    await selectDeduplicationMode(rulesPage, mode);
    await captureStep(rulesPage, `edit-wizard-options-${mode.replace(/_/g, '-')}`, {
      description: `Edit wizard, Options section expanded with deduplication mode "${mode}" selected.`,
    });
  }

  await dismissDialog(rulesPage);
  await rulesPage.close();

  await writeScenarioReadme({
    title: `Deduplication modes - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro:
      'Satellite scenario that opens the edit wizard for an existing rule and captures the Options step once per deduplication match mode (exact, includes, exact_ignore_params).',
  });
});
