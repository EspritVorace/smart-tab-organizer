/**
 * Page Object for the rule "Options" edit sub-dialog (`OptionsEditModal`).
 *
 * Opened from the edit-wizard summary by clicking the "Modify" button for
 * the Options section. Wraps the deduplication switch + match-mode radio
 * group rendered inside the modal. The match-mode radios carry stable
 * `value="exact" | "includes" | "exact_ignore_params"` attributes, which
 * keeps the helper locale-agnostic across the doc-scenarios matrix.
 *
 * Relevant US: US-R005 (per-section sub-dialogs).
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { DialogPage } from './DialogPage.js';

export type DeduplicationMatchMode = 'exact' | 'includes' | 'exact_ignore_params';

export class OptionsEditModalPage extends DialogPage {
  constructor(page: Page) {
    super(page);
  }

  override dialog(): Locator {
    return this.page.getByTestId('modal-edit-options');
  }

  // ─── Locators ────────────────────────────────────────────────────────────

  /** Apply button (commits the modal). */
  applyButton(): Locator {
    return this.dialog().getByTestId('modal-edit-options-btn-apply');
  }

  /** Deduplication enable/disable Switch. */
  deduplicationSwitch(): Locator {
    return this.dialog().locator('[role="switch"]').first();
  }

  /**
   * Radio group for the deduplication match mode (rendered only when
   * deduplication is enabled).
   */
  matchModeGroup(): Locator {
    return this.dialog().locator('[role="radiogroup"]').first();
  }

  // ─── Atomic actions ──────────────────────────────────────────────────────

  /**
   * Pick a deduplication match mode. The modal stacks on top of the wizard
   * dialog; scoping by the modal's testid prevents accidental matches on a
   * radio from the underlying summary view.
   */
  async selectDeduplicationMode(mode: DeduplicationMatchMode): Promise<void> {
    await this.dialog().locator(`[role="radio"][value="${mode}"]`).first().click();
  }

  /** Toggle the deduplication Switch to match `enabled`. */
  async setDeduplicationEnabled(enabled: boolean): Promise<void> {
    const sw = this.deduplicationSwitch();
    const state = await sw.getAttribute('data-state');
    const isOn = state === 'checked';
    if (isOn !== enabled) await sw.click();
  }

  /** Click "Apply" to commit the modal. */
  async clickApply(): Promise<void> {
    await this.applyButton().click();
  }

  // ─── Atomic assertions ───────────────────────────────────────────────────

  /** Assert a given match-mode radio is selected. */
  async expectModeSelected(mode: DeduplicationMatchMode): Promise<void> {
    await expect(
      this.dialog().locator(`[role="radio"][value="${mode}"]`),
    ).toHaveAttribute('aria-checked', 'true');
  }
}
