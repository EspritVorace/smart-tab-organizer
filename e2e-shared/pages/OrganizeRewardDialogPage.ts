/**
 * Page Object for the post-import "Organize now" reward dialog (issue #433).
 *
 * The dialog is offered after any rules import that changed the rule set. It is
 * a Radix modal dialog scoped by `data-testid="organize-reward-dialog"`, so it
 * coexists with (and overlays) the closing import wizard. Specs that import
 * rules and then need the page back must dismiss it.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { DialogPage } from './DialogPage.js';

export class OrganizeRewardDialogPage extends DialogPage {
  constructor(page: Page) {
    super(page);
  }

  /** Scope to the reward dialog (several dialogs can be in the DOM at once). */
  dialog(): Locator {
    return this.page.getByTestId('organize-reward-dialog');
  }

  /** The aria-live region that announces the organize outcome. */
  result(): Locator {
    return this.page.getByTestId('organize-reward-result');
  }

  /** Trigger the existing Organize flow on the current window. */
  async organizeNow(): Promise<void> {
    await this.page.getByTestId('organize-reward-organize').click();
  }

  /** Dismiss the reward without organizing ("Later"). */
  async dismiss(): Promise<void> {
    await this.page.getByTestId('organize-reward-later').click();
    await this.expectHidden();
  }

  /**
   * Dismiss the reward only if it opened. Imports that change the rule set
   * surface it; imports of identical rules do not. Lets shared import flows
   * stay correct in both cases.
   */
  async dismissIfPresent(timeout = 1500): Promise<void> {
    try {
      await this.expectVisible({ timeout });
    } catch {
      return;
    }
    await this.dismiss();
  }

  /** Close the reward once an organize result has been announced. */
  async close(): Promise<void> {
    await this.page.getByTestId('organize-reward-close').click();
    await this.expectHidden();
  }

  /** Assert the organize outcome was announced (non-empty live region). */
  async expectResultAnnounced(options?: { timeout?: number }): Promise<void> {
    await expect(this.result()).not.toBeEmpty(options);
  }
}
