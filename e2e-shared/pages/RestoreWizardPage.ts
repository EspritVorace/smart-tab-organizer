/**
 * Page Object for the Restore wizard (US-S004, US-S005, US-S017).
 *
 * Wraps the Radix dialog opened by "Customize" on a session card's restore
 * split-button. The wizard has two steps:
 *
 * - Step 0 (Selection): tab selection via TabTree + destination radio
 *   (current window / new window / replace current window).
 * - Step 1 (Conflict resolution, only when restoring into the current
 *   window with detected conflicts): duplicate-tab action + per-group
 *   merge/create_new/skip selectors.
 *
 * The "Replace" mode wipes the current window; the "Merge" mode is the
 * combination of selecting `current` as destination plus picking the
 * merge action on each conflicting group on step 1. Composed flows
 * (`restoreSessionAsReplace`, `restoreSessionAsMerge`) live in
 * `e2e-shared/actions/sessions-restore.ts`.
 *
 * Selectors target the English UI (`--lang=en-US`).
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { DialogPage } from './DialogPage.js';

export type RestoreTargetMode = 'current' | 'new' | 'replace';

export type DuplicateTabAction = 'skip' | 'open_anyway';

export type GroupConflictAction = 'merge' | 'create_new' | 'skip';

export class RestoreWizardPage extends DialogPage {
  constructor(page: Page) {
    super(page);
  }

  override dialog(): Locator {
    return this.page.getByTestId('wizard-restore');
  }

  // ─── Locators: step containers ───────────────────────────────────────────

  /** Step 0 (selection + destination). */
  step0Selection(): Locator {
    return this.dialog().getByTestId('wizard-restore-step-0');
  }

  /** Step 1 (conflict resolution), visible only when conflicts are detected. */
  step1Conflicts(): Locator {
    return this.dialog().getByTestId('wizard-restore-step-1');
  }

  // ─── Locators: step 0 ────────────────────────────────────────────────────

  /** Radio group for the restore destination. */
  modeSelector(): Locator {
    return this.dialog().getByTestId('wizard-restore-radio-destination');
  }

  /** Restore-into-current-window radio. */
  currentWindowRadio(): Locator {
    return this.dialog().getByTestId('wizard-restore-radio-current-window');
  }

  /** Restore-into-new-window radio. */
  newWindowRadio(): Locator {
    return this.dialog().getByTestId('wizard-restore-radio-new-window');
  }

  /** Replace-current-window radio. */
  replaceWindowRadio(): Locator {
    return this.dialog().getByTestId('wizard-restore-radio-replace-window');
  }

  /** TabTree container for picking which tabs to restore. */
  tabSelectionList(): Locator {
    return this.dialog().getByTestId('tab-tree');
  }

  /** Primary "Restore" button (step 0 + step 1). */
  restoreButton(): Locator {
    return this.dialog().getByTestId('wizard-restore-btn-restore');
  }

  // ─── Locators: step 1 ────────────────────────────────────────────────────

  /** Duplicate-tab action radio for "skip" (default). */
  duplicateSkipRadio(): Locator {
    return this.step1Conflicts().locator('[role="radio"][value="skip"]');
  }

  /** Duplicate-tab action radio for "open_anyway". */
  duplicateOpenAnywayRadio(): Locator {
    return this.step1Conflicts().locator('[role="radio"][value="open_anyway"]');
  }

  /**
   * "Back" button visible on step 1 (returns to step 0). The button label
   * is the same "Previous" string used by other wizards.
   */
  backButton(): Locator {
    return this.dialog().getByRole('button', { name: /previous/i });
  }

  // ─── Atomic actions: destination ─────────────────────────────────────────

  /** Select the "current window" destination radio. */
  async selectCurrentWindowMode(): Promise<void> {
    await this.currentWindowRadio().click();
  }

  /** Select the "new window" destination radio. */
  async selectNewWindowMode(): Promise<void> {
    await this.newWindowRadio().click();
  }

  /** Select the "replace current window" destination radio (US-RF Replace). */
  async selectReplaceMode(): Promise<void> {
    await this.replaceWindowRadio().click();
  }

  /**
   * Select the "Merge" outcome: equivalent to picking `current` as the
   * destination, then resolving conflicts via the merge action on the
   * conflict step (cf. `setGroupConflictAction`).
   *
   * Picking the destination only; callers drive the conflict step explicitly.
   */
  async selectMergeMode(): Promise<void> {
    await this.currentWindowRadio().click();
  }

  // ─── Atomic actions: tab selection ───────────────────────────────────────

  /**
   * Toggle a single tab by its title. Each row exposes a Radix Checkbox
   * with `aria-label="Select tab {title}"` (cf. `tabTreeSelectTab` message).
   */
  async toggleTab(title: string): Promise<void> {
    await this.tabSelectionList()
      .getByRole('checkbox', { name: new RegExp(`select tab.*${escapeRegExp(title)}`, 'i') })
      .first()
      .click();
  }

  // ─── Atomic actions: navigation ──────────────────────────────────────────

  /**
   * Click the primary "Restore" button. From step 0 with no conflicts the
   * wizard closes; with conflicts it advances to step 1 instead.
   */
  async clickRestore(): Promise<void> {
    await this.restoreButton().click();
  }

  /** Return to step 0 from the conflict resolution step. */
  async clickBack(): Promise<void> {
    await this.backButton().click();
  }

  // ─── Atomic actions: conflict resolution (step 1) ────────────────────────

  /** Pick the duplicate-tab action (skip / open anyway). */
  async setDuplicateTabAction(action: DuplicateTabAction): Promise<void> {
    if (action === 'skip') {
      await this.duplicateSkipRadio().click();
    } else {
      await this.duplicateOpenAnywayRadio().click();
    }
  }

  /**
   * Pick the conflict action for a specific group, identified by its title.
   * The conflict row renders the group title; the Select sits next to it
   * with an `aria-label` localized to "Group action". The selector below
   * scopes by row to disambiguate when several groups conflict.
   */
  async setGroupConflictAction(groupTitle: string, action: GroupConflictAction): Promise<void> {
    const row = this.step1Conflicts().locator('div', { hasText: groupTitle }).first();
    await row.locator('button[role="combobox"], .rt-SelectTrigger').first().click();
    const labels: Record<GroupConflictAction, RegExp> = {
      merge: /merge/i,
      create_new: /create.*new|new group/i,
      skip: /skip/i,
    };
    await this.page.getByRole('option', { name: labels[action] }).first().click();
  }

  // ─── Atomic assertions ───────────────────────────────────────────────────

  async expectOnStep(step: 0 | 1): Promise<void> {
    if (step === 0) {
      await expect(this.step0Selection()).toBeVisible();
    } else {
      await expect(this.step1Conflicts()).toBeVisible();
    }
  }

  /** Assert the current-window radio is the active destination. */
  async expectCurrentWindowSelected(): Promise<void> {
    await expect(this.currentWindowRadio()).toBeChecked();
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
