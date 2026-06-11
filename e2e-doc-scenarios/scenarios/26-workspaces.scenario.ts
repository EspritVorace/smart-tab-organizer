/**
 * Scenario 26 — Workspaces page.
 *
 * Captures the Workspaces settings page for the Starlight docs. The
 * workspace cards are harmonised with the session/rule cards: an inline
 * "Switch" button (with icon) on inactive workspaces and a "..." overflow
 * menu (Edit / Delete). Seeds a second workspace so both an active card and
 * an inactive one (exposing the Switch button) are visible.
 */
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import { openExtensionPage } from '../helpers/ui-actions.js';
import {
  clearExtensionStorage,
  seedStorage,
} from '../../e2e-shared/actions/index.js';
import { WORKSPACES_MANIFEST } from './26-workspaces.routing.js';

const SCENARIO_ID = '26-workspaces';

test.describe.configure({ mode: 'serial' });

test('workspaces page', async (
  { extensionContext, extensionId, docLocale: locale, docTheme: theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [WORKSPACES_MANIFEST],
  });

  await clearExtensionStorage(extensionContext);
  // Seed a second workspace so the list shows both the active card (Default)
  // and an inactive one exposing the harmonised "Switch" button. The default
  // workspace stays active so its accent drives the theme.
  const now = new Date().toISOString();
  await seedStorage(extensionContext, {
    workspaces: [
      { id: 'default', name: 'Personal', accentColor: 'indigo', createdAt: now, updatedAt: now },
      { id: 'ws-work', name: 'Work', accentColor: 'green', createdAt: now, updatedAt: now },
    ],
    activeWorkspaceId: 'default',
  });

  const page = await openExtensionPage(
    extensionContext,
    extensionId,
    'workspaces',
    locale,
    theme,
  );
  await page.getByTestId('workspace-list').waitFor({ state: 'visible', timeout: 5_000 });
  await page.waitForTimeout(300);
  await captureStep(page, 'workspaces-page', {
    description:
      'Workspaces page with the active workspace and an inactive one exposing the Switch button and the "..." overflow menu.',
  });
  await page.close();

  await writeScenarioReadme({
    title: `Workspaces - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro: 'Workspaces settings page capture used by the Starlight documentation.',
  });
});
