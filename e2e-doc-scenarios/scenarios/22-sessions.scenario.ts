/**
 * Scenario 22 - Sessions feature screens.
 *
 * Captures the Sessions & Profiles states reused by the README (sessions
 * list), the Starlight docs (snapshot wizard) and the Chrome Web Store
 * listing (deep search). Ported from the former
 * `e2e-screenshots/pages/sessions.screenshots.ts`.
 *
 * The `sessions-restore-conflict` documentation/store screen is produced by
 * the `11-restore-conflicts` scenario (routed there), so it is not
 * re-captured here.
 */
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import { openExtensionPage, dismissDialog } from '../helpers/ui-actions.js';
import {
  clearExtensionStorage,
  openSnapshotWizard,
  seedSessions,
} from '../../e2e-shared/actions/index.js';
import { SessionsListPage } from '../../e2e-shared/pages/index.js';
import { ALL_SESSIONS } from '../fixtures/seed-data.js';
import { SESSIONS_MANIFEST } from './22-sessions.routing.js';

const SCENARIO_ID = '22-sessions';

test.describe.configure({ mode: 'serial' });

test('sessions feature screens', async (
  { extensionContext, extensionId, docLocale: locale, docTheme: theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [SESSIONS_MANIFEST],
  });

  await clearExtensionStorage(extensionContext);
  await seedSessions(extensionContext, ALL_SESSIONS);

  // --- Sessions list ------------------------------------------------------
  {
    const page = await openExtensionPage(
      extensionContext, extensionId, 'sessions', locale, theme,
    );
    const list = new SessionsListPage(page);
    await list.expectListVisible();
    await page.waitForTimeout(300);
    await captureStep(page, 'sessions-list', {
      description: 'Sessions list with snapshots and pinned profiles.',
    });
    await page.close();
  }

  // --- Snapshot creation wizard ------------------------------------------
  {
    const page = await openExtensionPage(
      extensionContext, extensionId, 'sessions', locale, theme,
    );
    const list = new SessionsListPage(page);
    await list.expectListVisible();
    await openSnapshotWizard(page);
    await page.waitForTimeout(300);
    await captureStep(page, 'sessions-create-snapshot', {
      description: 'Snapshot creation wizard open.',
    });
    await dismissDialog(page);
    await page.close();
  }

  // --- Deep search --------------------------------------------------------
  {
    const page = await openExtensionPage(
      extensionContext, extensionId, 'sessions', locale, theme,
    );
    const list = new SessionsListPage(page);
    await list.expectListVisible();
    await list.search('github');
    await page.waitForTimeout(600);
    await captureStep(page, 'sessions-search-deep', {
      description: 'Sessions deep search matching tab titles inside a snapshot.',
    });
    await page.close();
  }

  await writeScenarioReadme({
    title: `Sessions - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro:
      'Sessions & Profiles feature screens reused by the README, the documentation and the Chrome Web Store listing.',
  });
});
