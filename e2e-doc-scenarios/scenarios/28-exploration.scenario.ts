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

// Curated so the first domain ("grouping") is fully discovered: it collapses to
// a single header row showing the green "Terminé" badge right after the title,
// which showcases the completed-group design. The next incomplete domain
// ("dedup") then auto-opens and illustrates the three row states: several
// discovered rows, two still to discover, and the keep-strategy rows locked
// (their prerequisite, deduplication enabled, is not met).
const DISCOVERED = [
  'grouping.create', 'grouping.edit', 'grouping.mode.preset', 'grouping.mode.ask',
  'grouping.mode.manual', 'grouping.mode.label', 'grouping.nameSource.title',
  'grouping.nameSource.url', 'grouping.nameSource.smart', 'grouping.url.regex',
  'grouping.url.queryParam', 'grouping.titleRegex', 'grouping.fallbackLabel',
  'grouping.color', 'grouping.presetApplied', 'grouping.reorder.drag',
  'grouping.reorder.keyboard', 'grouping.toggle', 'grouping.overlaps',
  'grouping.merge', 'grouping.view.filterSort',
  'dedup.match.exact', 'dedup.match.includes', 'dedup.match.ignoreParams',
  'sessions.snapshot', 'sessions.restore.current',
  'workspaces.create',
  'packs.openGallery',
  'stats.view', 'stats.exploration', 'stats.trends',
  'settings.theme', 'settings.toggle.grouping', 'settings.quickActions',
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
