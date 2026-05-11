/**
 * Satellite scenario `11-restore-conflicts`.
 *
 * Seeds a single session whose first group is `(title: "Work", color: "blue")`,
 * spawns a live tab group with the same `(title, color)` in the current
 * window, then opens the customize-restore wizard so `analyzeConflicts()`
 * detects a conflict and the wizard moves to the ConflictResolutionStep.
 */
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import {
  clearExtensionStorage,
  clickRestoreInWizard,
  createLiveTabGroup,
  dismissDialog,
  openCustomizeRestoreWizard,
  openExtensionPage,
  seedSessions,
} from '../helpers/ui-actions.js';
import { SESSION_FOR_CONFLICT } from '../../e2e-screenshots/fixtures/sessions-seed.js';
import { RESTORE_CONFLICTS_MANIFEST } from './11-restore-conflicts.routing.js';

const SCENARIO_ID = '11-restore-conflicts';

test.describe.configure({ mode: 'serial' });

test('restore conflicts', async (
  { extensionContext, extensionId, docLocale: locale, docTheme: theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [RESTORE_CONFLICTS_MANIFEST],
  });

  await clearExtensionStorage(extensionContext);
  // SESSION_FOR_CONFLICT contains a "Work" (blue) group whose live counterpart
  // we will create below to trigger the conflict-resolution step.
  await seedSessions(extensionContext, [SESSION_FOR_CONFLICT]);

  const sessionsPage = await openExtensionPage(
    extensionContext,
    extensionId,
    'sessions',
    locale,
    theme,
  );
  await sessionsPage.getByTestId('page-sessions-list').waitFor({ state: 'visible' });

  // Create the live "Work" blue group in the current window so that the
  // RestoreWizard's analyzeConflicts() detects a conflicting group.
  await createLiveTabGroup(extensionContext, sessionsPage, 'Work', 'blue');

  await captureStep(sessionsPage, 'sessions-list-with-live-conflict', {
    description: 'Sessions page with one seeded snapshot and a live "Work" tab group already open in the same window.',
  });

  await openCustomizeRestoreWizard(sessionsPage, SESSION_FOR_CONFLICT.id);
  await captureStep(sessionsPage, 'restore-wizard-step0', {
    description: 'Restore wizard step 0 (destination + tab selection) before triggering conflict analysis.',
  });

  await clickRestoreInWizard(sessionsPage);
  await sessionsPage
    .getByTestId('wizard-restore-step-1')
    .waitFor({ state: 'visible', timeout: 10_000 });
  await captureStep(sessionsPage, 'restore-wizard-conflict-resolution', {
    description: 'Restore wizard step 1 (ConflictResolutionStep) showing detected conflicting group and per-group actions.',
  });

  await dismissDialog(sessionsPage);
  await sessionsPage.close();

  await writeScenarioReadme({
    title: `Restore conflicts - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro:
      'Satellite scenario that seeds a session and an opposing live tab group sharing the same title and colour, then opens the restore wizard so the ConflictResolutionStep is captured with a real conflict.',
  });
});
