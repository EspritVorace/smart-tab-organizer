/**
 * Composed domain actions for session restoration.
 *
 * Each action narrates a single business outcome ("restore this session as
 * Replace", "restore this session merging with the current window") and
 * hides the wizard step plumbing. Consumes `RestoreWizardPage`; never
 * reaches into raw locators.
 *
 * Callers are expected to have already navigated to the Sessions section
 * before invoking these helpers.
 *
 * Relevant US: US-S003 (restore in new window), US-S004 (restore in
 * current window), US-S005 (conflict resolution), US-S011 (restore
 * split-button options), US-S017 (collapsed groups).
 */
import type { Page } from '@playwright/test';
import {
  RestoreWizardPage,
  type DuplicateTabAction,
  type GroupConflictAction,
} from '../pages/RestoreWizardPage.js';

export interface RestoreReplaceOptions {
  /** Tab titles to deselect before clicking Restore. */
  deselect?: string[];
}

export interface RestoreMergeOptions extends RestoreReplaceOptions {
  /** Action to apply on duplicate tabs (default: 'skip'). */
  duplicateTabAction?: DuplicateTabAction;
  /**
   * Per-group conflict actions, keyed by the conflicting group's title.
   * Groups not listed keep their default action ('merge').
   */
  groupActions?: Record<string, GroupConflictAction>;
}

/**
 * Open the Customize-restoration wizard for a given session by clicking
 * the SplitButton chevron on its card and selecting the "Customize" item.
 *
 * Relevant US: US-S004 (entry point), US-S011 (split-button options).
 */
export async function openCustomizeRestoreWizard(
  page: Page,
  sessionId: string,
): Promise<RestoreWizardPage> {
  const card = page.getByTestId(`session-card-${sessionId}`);
  await card.getByRole('button', { name: /restore options/i }).click();
  await page.getByTestId('session-restore-menu-customize').click();
  const wizard = new RestoreWizardPage(page);
  await wizard.expectVisible({ timeout: 5000 });
  return wizard;
}

/**
 * End-to-end "restore this session as Replace" flow.
 *
 * Steps: open the customize wizard, select the Replace destination radio,
 * optionally deselect a subset of tabs, click Restore, wait for the
 * dialog to close. Replace mode wipes the current window so there is no
 * conflict resolution step.
 *
 * Relevant US: US-S004 (replace current window outcome).
 */
export async function restoreSessionAsReplace(
  page: Page,
  sessionId: string,
  opts: RestoreReplaceOptions = {},
): Promise<void> {
  const wizard = await openCustomizeRestoreWizard(page, sessionId);
  await wizard.selectReplaceMode();
  if (opts.deselect) {
    for (const title of opts.deselect) {
      await wizard.toggleTab(title);
    }
  }
  await wizard.clickRestore();
  await wizard.expectHidden({ timeout: 10_000 });
}

/**
 * End-to-end "restore this session merging with the current window" flow.
 *
 * Steps: open the customize wizard, select the current-window destination,
 * optionally deselect a subset of tabs, click Restore. If no conflicts are
 * detected the wizard closes immediately; otherwise the helper drives the
 * conflict-resolution step using the supplied duplicate/group actions and
 * then submits the final Restore.
 *
 * Relevant US: US-S004 (merge into current window), US-S005 (conflict
 * resolution choices).
 */
export async function restoreSessionAsMerge(
  page: Page,
  sessionId: string,
  opts: RestoreMergeOptions = {},
): Promise<void> {
  const wizard = await openCustomizeRestoreWizard(page, sessionId);
  await wizard.selectMergeMode();
  if (opts.deselect) {
    for (const title of opts.deselect) {
      await wizard.toggleTab(title);
    }
  }
  await wizard.clickRestore();

  // The wizard advances to step 1 only when conflicts were detected. Wait
  // for either outcome with a short race so callers don't pay a hard delay.
  const onConflictStep = await wizard
    .step1Conflicts()
    .waitFor({ state: 'visible', timeout: 2_000 })
    .then(() => true)
    .catch(() => false);

  if (!onConflictStep) {
    await wizard.expectHidden({ timeout: 10_000 });
    return;
  }

  if (opts.duplicateTabAction) {
    await wizard.setDuplicateTabAction(opts.duplicateTabAction);
  }
  for (const [groupTitle, action] of Object.entries(opts.groupActions ?? {})) {
    await wizard.setGroupConflictAction(groupTitle, action);
  }
  await wizard.clickRestore();
  await wizard.expectHidden({ timeout: 10_000 });
}
