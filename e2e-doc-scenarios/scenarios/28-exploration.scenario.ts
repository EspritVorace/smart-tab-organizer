/**
 * Scenario 28 — Exploration catalogue overview.
 *
 * Seeds a deterministic exploration progress (a mix of automatic discoveries,
 * one manual mark, and several still-locked entries) so the captured page shows
 * the coverage summary, the named phase, per-domain bars and the three row
 * states (discovered / to discover / not yet available) for the Starlight docs.
 */
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import { openExtensionPage } from '../helpers/ui-actions.js';
import { clearExtensionStorage, seedStorage } from '../../e2e-shared/actions/index.js';
import { EXPLORATION_MANIFEST } from './28-exploration.routing.js';

const SCENARIO_ID = '28-exploration';

// Curated so the default-open "grouping" domain shows all three states:
// several discovered rows, "Create a rule" still to discover, and the
// rule-dependent rows locked (their prerequisite is not met).
const DISCOVERED = [
  'grouping.mode.preset', 'grouping.mode.ask', 'grouping.mode.manual', 'grouping.mode.label',
  'grouping.color', 'grouping.nameSource.title', 'grouping.url.regex', 'grouping.titleRegex',
  'grouping.fallbackLabel',
  'dedup.match.exact', 'dedup.match.includes', 'dedup.match.ignoreParams',
  'sessions.snapshot', 'sessions.restore.current',
  'workspaces.create',
  'packs.openGallery',
  'stats.view', 'stats.exploration', 'stats.trends',
  'settings.theme', 'settings.toggle.grouping', 'settings.toggle.dedup', 'settings.quickActions',
  'nav.globalSearch', 'nav.mnemonics',
  'help.drawer', 'help.contextF1',
  'io.exportRules', 'io.importRules',
];
const MANUALLY_MARKED = ['grouping.category'];

test.describe.configure({ mode: 'serial' });

test('exploration catalogue overview', async (
  { extensionContext, extensionId, docLocale: locale, docTheme: theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [EXPLORATION_MANIFEST],
  });

  await clearExtensionStorage(extensionContext);
  await seedStorage(extensionContext, {
    explorationProgress: {
      discovered: DISCOVERED,
      manuallyMarked: MANUALLY_MARKED,
      values: {},
      initializedAt: 1_700_000_000_000,
    },
  });

  const page = await openExtensionPage(extensionContext, extensionId, 'exploration', locale, theme);
  await page.getByTestId('page-exploration').waitFor({ state: 'visible' });
  await page.getByTestId('exploration-coverage-summary').waitFor({ state: 'visible' });
  await page.getByTestId('exploration-domain-grouping').waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  await captureStep(page, 'exploration-overview', {
    description:
      'Exploration catalogue: global coverage and phase, per-domain progress bars, and the three row states (discovered, to discover, not yet available).',
  });

  await page.close();

  await writeScenarioReadme({
    title: `Exploration - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro: 'Populated Exploration catalogue capture used by the Starlight documentation.',
  });
});
