/**
 * Composed domain actions for session snapshots (creation + pin).
 *
 * Each action narrates a single business outcome ("create a snapshot with
 * these tabs", "pin an existing session") and hides the wizard / card
 * dropdown plumbing. Consumes `SnapshotWizardPage`; never reaches into
 * raw locators.
 *
 * Callers are expected to have already navigated to the Sessions section
 * before invoking these helpers.
 *
 * Relevant US: US-S001 (snapshot wizard), US-S008 (pinned sessions).
 */
import { expect, type Page } from '@playwright/test';
import { SnapshotWizardPage } from '../pages/SnapshotWizardPage.js';

export interface CreateSnapshotOptions {
  /** Optional free-form note persisted with the session. */
  note?: string;
  /**
   * Optional list of tab titles to deselect from the default "everything
   * selected" state before saving. Use this to capture a subset of the
   * currently open tabs.
   */
  deselect?: string[];
  /**
   * Optional list of tab titles to (re-)select (e.g. after a manual
   * `deselectAll`). When provided, the helper first deselects everything,
   * then re-selects the listed tabs.
   */
  selectOnly?: string[];
}

/**
 * Open the snapshot wizard from the Sessions options page. Returns the
 * `SnapshotWizardPage` instance.
 *
 * Relevant US: US-S001 (wizard entry point), US-S010 (empty-state CTA).
 */
export async function openSnapshotWizard(page: Page): Promise<SnapshotWizardPage> {
  await page.getByTestId('page-sessions-btn-snapshot').click();
  const wizard = new SnapshotWizardPage(page);
  await wizard.expectVisible({ timeout: 5000 });
  return wizard;
}

/**
 * End-to-end "create a snapshot with these tabs" flow.
 *
 * Steps: open wizard, wait for the asynchronous tab capture to resolve
 * (Save becomes enabled), set the name, adjust selection if requested,
 * optionally fill the note, save and wait for the dialog to close.
 *
 * Relevant US: US-S001 (snapshot creation, default-select-all behavior).
 */
export async function createSnapshotWithTabs(
  page: Page,
  name: string,
  options: CreateSnapshotOptions = {},
): Promise<void> {
  const wizard = await openSnapshotWizard(page);
  await wizard.expectSaveButtonEnabled();
  await wizard.fillName(name);

  if (options.selectOnly) {
    await wizard.deselectAllTabs();
    for (const title of options.selectOnly) {
      await wizard.toggleTab(title);
    }
  } else if (options.deselect) {
    for (const title of options.deselect) {
      await wizard.toggleTab(title);
    }
  }

  if (options.note !== undefined) {
    await wizard.fillNote(options.note);
  }

  await wizard.clickSave();
  await wizard.expectHidden();
}

/**
 * Pin an existing session by clicking the dedicated pin icon-button on its
 * card. The button carries a stable `data-testid` that switches between
 * `session-card-{id}-btn-pin` (unpinned) and `session-card-{id}-btn-unpin`
 * (pinned), so the helper is idempotent across re-runs and locale-agnostic
 * across the doc-scenarios matrix (en/fr/es).
 *
 * Drives the real UI path rather than seeding storage so the action
 * exercises the same code path users go through.
 *
 * Relevant US: US-S008 (pinned sessions appear in their own section).
 */
export async function pinSession(page: Page, sessionId: string): Promise<void> {
  await page.getByTestId(`session-card-${sessionId}-btn-pin`).click();
  await expect(
    page.getByTestId(`session-card-${sessionId}-btn-unpin`),
  ).toBeVisible({ timeout: 5000 });
}
