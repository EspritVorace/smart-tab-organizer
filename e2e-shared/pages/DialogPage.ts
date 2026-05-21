/**
 * Base Page Object for Radix `role="dialog"` elements.
 *
 * Subclasses provide locators, atomic actions and assertions specific to
 * their dialog. They may override `dialog()` when more than one dialog can
 * be visible at the same time (use `.first()`, `.nth(n)`, or a more
 * specific scope).
 *
 * Direct instantiation (`new DialogPage(page)`) is allowed when a spec
 * only needs the generic "a Radix dialog is open" assertion (e.g.
 * keyboard-shortcut sequences that fan out to several wizards and only
 * check that one of them opened). For dialog-specific interactions,
 * subclass instead.
 *
 * Page Objects in this folder stay close to the DOM: one method per
 * locator, one method per atomic action, one method per atomic
 * expectation. Composed flows (e.g. "import rules via text") live in
 * `e2e-shared/actions/` and consume Page Objects.
 */
import { expect, type Locator, type Page } from '@playwright/test';

export class DialogPage {
  constructor(protected readonly page: Page) {}

  /**
   * Root locator for the dialog. Defaults to the first `role="dialog"` on
   * the page; override in subclasses when several dialogs can co-exist
   * (e.g. nested wizards, confirmation overlays, ...).
   */
  dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  /** Wait for the dialog to become visible. */
  async expectVisible(options?: { timeout?: number }): Promise<void> {
    await expect(this.dialog()).toBeVisible(options);
  }

  /** Wait for the dialog to be hidden or detached. */
  async expectHidden(options?: { timeout?: number }): Promise<void> {
    await expect(this.dialog()).toBeHidden(options);
  }

  /**
   * Shortcut for `dialog().getByRole('button', { name }).click()`.
   * Accepts both an exact string and a RegExp (case-insensitive matchers
   * are recommended to stay robust across i18n).
   */
  async clickButton(name: RegExp | string): Promise<void> {
    await this.dialog().getByRole('button', { name }).click();
  }
}
