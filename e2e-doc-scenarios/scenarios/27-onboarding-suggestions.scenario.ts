/**
 * Scenario 27 - Onboarding pack suggestions (issue #433).
 *
 * Captures the contextual onboarding hero used by the Starlight docs: with no
 * rule in the active workspace and a few open tabs matching a ready-made pack,
 * the home hero lists the matching packs (pre-selected) behind a single
 * "Import and organize" button.
 *
 * The matching tabs are spawned via the mimetic-sites server (real-looking
 * `http://github.com/...` URLs), so the GitHub pack crosses the threshold and
 * the contextual hero renders deterministically.
 */
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import { openExtensionPage, openMimeticTab } from '../helpers/ui-actions.js';
import { clearExtensionStorage } from '../../e2e-shared/actions/index.js';
import { ONBOARDING_SUGGESTIONS_MANIFEST } from './27-onboarding-suggestions.routing.js';

const SCENARIO_ID = '27-onboarding-suggestions';

test.describe.configure({ mode: 'serial' });

test('onboarding suggestions feature screen', async (
  { extensionContext, extensionId, docLocale: locale, docTheme: theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [ONBOARDING_SUGGESTIONS_MANIFEST],
  });

  // No rule + open GitHub tabs => the home hero turns contextual.
  await clearExtensionStorage(extensionContext);
  for (const url of [
    'http://github.com/repo-readme.html',
    'http://github.com/repo-issues.html',
    'http://github.com/repo-pulls.html',
  ]) {
    await openMimeticTab(extensionContext, url);
  }

  const home = await openExtensionPage(extensionContext, extensionId, '', locale, theme);
  await home
    .getByTestId('home-hero-suggest-import')
    .waitFor({ state: 'visible', timeout: 10_000 });
  await captureStep(home, 'home-hero-suggestions', {
    description:
      'Contextual onboarding hero suggesting the packs that match the open tabs.',
    elementSelector: 'section[aria-labelledby="home-hero-suggest-title"]',
  });
  await home.close();

  await writeScenarioReadme({
    title: `Onboarding suggestions - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro:
      'Contextual onboarding hero feature screen reused by the documentation (issue #433).',
  });
});
