/**
 * Page Object for the rules / sessions Export wizard.
 *
 * Pendant of `ImportWizardPage`. Wraps the Radix dialog opened from the
 * Import/Export options page (rules) and from the Sessions page
 * (sessions). The wizard is single-step:
 *
 * - an optional note `TextArea`,
 * - a "Select all / Deselect all" toolbar,
 * - a list of selectable rows (flat for rules, grouped Pinned/Sessions
 *   for sessions, cf. US-IE013),
 * - a "{n} rule(s) selected" / "{n} session(s) selected" count label,
 * - a footer split-button (`Export` + chevron menu with "JSON File" /
 *   "Clipboard").
 *
 * As with the import wizard, this class exposes **atomic** building
 * blocks. Composed flows (`exportRulesToFile`, ...) live in
 * `e2e-shared/actions/rules-import-export.ts`.
 *
 * Selectors target the English UI (`--lang=en-US`). Sub-class and
 * override the locator getters to retarget another locale.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { DialogPage } from './DialogPage.js';

export class ExportWizardPage extends DialogPage {
  constructor(page: Page) {
    super(page);
  }

  // ─── Locators ────────────────────────────────────────────────────────────

  /** Every selectable row checkbox (rules or sessions). */
  selectionList(): Locator {
    return this.dialog().getByRole('checkbox');
  }

  /** Free-form export note textarea. */
  noteField(): Locator {
    return this.dialog().locator('textarea').first();
  }

  /** Primary "Export" button (opens the OS file save picker on Chrome). */
  exportFileButton(): Locator {
    return this.dialog().getByRole('button', { name: /^export$/i });
  }

  /**
   * Chevron / "Export options" button that opens the split-button popover
   * (file vs clipboard).
   */
  exportOptionsButton(): Locator {
    return this.dialog().getByRole('button', { name: /export.*option|chevron/i });
  }

  /**
   * Clipboard menu item inside the split-button popover. Lives outside
   * the dialog (Radix Popover.Content is portalled), so we anchor on the
   * page, not on `dialog()`.
   */
  exportClipboardButton(): Locator {
    return this.page.getByRole('menuitem', { name: /clipboard/i });
  }

  /** "Select all" toolbar button (exact match to avoid the "Deselect all" sibling). */
  selectAllButton(): Locator {
    return this.dialog().getByRole('button', { name: 'Select All', exact: true });
  }

  /** "Deselect all" toolbar button. */
  deselectAllButton(): Locator {
    return this.dialog().getByRole('button', { name: /deselect all/i });
  }

  /**
   * "Pinned Sessions" sub-group header checkbox (US-IE013). Locates the
   * group-level checkbox by its accessible label so it does not collide
   * with the per-session row checkboxes.
   */
  pinnedSessionsGroup(): Locator {
    return this.dialog().getByRole('checkbox', { name: /pinned sessions/i });
  }

  /** "Sessions" sub-group header checkbox (US-IE013). */
  sessionsGroup(): Locator {
    return this.dialog().getByRole('checkbox', { name: /^sessions$/i });
  }

  // ─── Atomic actions ──────────────────────────────────────────────────────

  /** Type a note into the optional note field. */
  async fillNote(text: string): Promise<void> {
    await this.noteField().fill(text);
  }

  /** Click the "Select All" toolbar button. */
  async selectAll(): Promise<void> {
    await this.selectAllButton().click();
  }

  /** Click the "Deselect All" toolbar button. */
  async deselectAll(): Promise<void> {
    await this.deselectAllButton().click();
  }

  /**
   * Toggle a single row by its accessible label (rule label or session
   * name). Uses the dialog-scoped checkbox lookup so headers and toolbar
   * buttons cannot interfere.
   */
  async toggleRule(label: string): Promise<void> {
    await this.dialog().getByRole('checkbox', { name: label }).click();
  }

  /** Click the primary "Export" button (file save path). */
  async clickExportToFile(): Promise<void> {
    await this.exportFileButton().click();
  }

  /** Open the split-button popover and click the "Clipboard" entry. */
  async clickExportToClipboard(): Promise<void> {
    await this.exportOptionsButton().click();
    await this.exportClipboardButton().click();
  }

  /** Close the wizard via the "Cancel" button. */
  async cancel(): Promise<void> {
    await this.clickButton(/cancel/i);
  }

  // ─── Atomic assertions ───────────────────────────────────────────────────

  /**
   * Assert the wizard opened with every item pre-selected, by checking
   * the count label matches `total`. Pass the known number of items so
   * the assertion stays explicit (the page object never queries storage).
   */
  async expectAllRulesSelected(total: number): Promise<void> {
    await expect(
      this.dialog().getByText(new RegExp(`${total} rule.*selected`, 'i')),
    ).toBeVisible();
  }

  /** Assert a previously typed note is reflected in the note field value. */
  async expectNoteVisible(text: string): Promise<void> {
    await expect(this.noteField()).toHaveValue(text);
  }

  /** Assert the primary Export button is enabled (selection non-empty). */
  async expectExportButtonEnabled(): Promise<void> {
    await expect(this.exportFileButton()).toBeEnabled();
  }

  /** Assert the primary Export button is disabled (no selection). */
  async expectExportButtonDisabled(): Promise<void> {
    await expect(this.exportFileButton()).toBeDisabled();
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
