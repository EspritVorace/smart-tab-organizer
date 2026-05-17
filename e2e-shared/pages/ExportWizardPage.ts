/**
 * Page Object for the rules Export wizard.
 *
 * Wraps the Radix dialog opened from the Import/Export options page when
 * the user picks "Export rules". Extends `ExportWizardPageBase` for the
 * generic surface (note field, toolbar, footer split-button) and adds
 * rule-specific helpers (`toggleRule`, `expectAllRulesSelected`).
 *
 * The sessions-flavoured sibling lives in `SessionsExportWizardPage`.
 *
 * Selectors target the English UI (`--lang=en-US`). Subclass and override
 * the locator getters to retarget another locale.
 *
 * Relevant US: US-IE008 (entry point), US-IE009 (export to file / clipboard).
 */
import { expect, type Page } from '@playwright/test';
import { ExportWizardPageBase } from './ExportWizardPageBase.js';

export class ExportWizardPage extends ExportWizardPageBase {
  constructor(page: Page) {
    super(page);
  }

  protected override primaryExportTestId(): string {
    return 'wizard-export-rules-btn-export';
  }

  protected override clipboardExportTestId(): string {
    return 'wizard-export-rules-btn-clipboard';
  }

  // ─── Atomic actions ──────────────────────────────────────────────────────

  /**
   * Toggle a rule row by its accessible label (the rule's `label` property).
   * Uses the dialog-scoped checkbox lookup so headers and toolbar buttons
   * cannot interfere.
   */
  async toggleRule(label: string): Promise<void> {
    await this.dialog().getByRole('checkbox', { name: label }).click();
  }

  // ─── Atomic assertions ───────────────────────────────────────────────────

  /**
   * Assert the wizard opened with every rule pre-selected, by checking the
   * count label matches `total`. Pass the known number of rules so the
   * assertion stays explicit (the page object never queries storage).
   */
  async expectAllRulesSelected(total: number): Promise<void> {
    await this.expectSelectedCount(total);
  }

  /**
   * Assert the "{count} rule(s) selected" label reflects `count`.
   * Useful after `selectAll()` / `deselectAll()` / `toggleRule(...)`.
   */
  async expectSelectedCount(count: number): Promise<void> {
    await expect(
      this.dialog().getByText(new RegExp(`${count} rule.*selected`, 'i')),
    ).toBeVisible();
  }
}
