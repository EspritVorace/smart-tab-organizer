/**
 * Shared abstract base for export wizard Page Objects.
 *
 * Both `ExportWizardPage` (rules, US-IE008..US-IE009) and
 * `SessionsExportWizardPage` (sessions, US-IE012..US-IE013) wrap the same
 * `ExportWizardShell` UI surface: an optional note textarea, a
 * "Select all / Deselect all" toolbar, a selectable list (flat for rules,
 * Pinned/Sessions sub-groups for sessions) and a footer split-button
 * (Export to JSON file / clipboard).
 *
 * This base captures the genuinely common parts only: note field, toolbar,
 * primary footer split-button and Cancel button. Anything list-shape
 * specific (rule labels, session group headers, pinned separator, ...)
 * stays in the concrete subclasses to keep the inheritance lean.
 *
 * Subclasses customise the count-label assertion by overriding
 * `expectSelectedCount(count)`, since the message ("rule(s) selected" vs
 * "session(s) selected") is the only count-label difference between the
 * two surfaces.
 */
import { expect, type Locator } from '@playwright/test';
import { DialogPage } from './DialogPage.js';

export abstract class ExportWizardPageBase extends DialogPage {
  // ─── Locators ────────────────────────────────────────────────────────────

  /** Optional free-form export note textarea. */
  noteField(): Locator {
    return this.dialog().locator('textarea').first();
  }

  /**
   * Primary "Export" button (defaults to JSON file).
   *
   * Subclasses override `primaryExportTestId` to point at their specific
   * testid (rules vs. sessions); the base falls back to a role-based
   * lookup when the subclass does not provide one.
   */
  exportFileButton(): Locator {
    const testId = this.primaryExportTestId();
    if (testId) return this.dialog().getByTestId(testId);
    return this.dialog().getByRole('button', { name: /^export$/i });
  }

  /**
   * Chevron / "Export options" button that opens the split-button popover
   * (file vs. clipboard). Locale-agnostic: anchors on the Lucide
   * `chevron-down` icon used inside the chevron button (see SplitButton).
   */
  exportOptionsButton(): Locator {
    return this.dialog().locator('button:has(svg.lucide-chevron-down)').first();
  }

  /**
   * Clipboard menu item inside the split-button popover. Lives outside the
   * dialog (Radix DropdownMenu.Content is portalled), so we anchor on the
   * page, not on `dialog()`. Subclasses provide a testid for cross-locale
   * stability; the base falls back to a role-based lookup.
   */
  exportClipboardButton(): Locator {
    const testId = this.clipboardExportTestId();
    if (testId) return this.page.getByTestId(testId);
    return this.page.getByRole('menuitem', { name: /clipboard/i });
  }

  // ─── Subclass extension points ───────────────────────────────────────────

  /**
   * Optional testid for the primary "Export to file" button. Subclasses
   * return the concrete value (e.g. `wizard-export-rules-btn-export`); the
   * base falls back to a role-based lookup when undefined.
   */
  protected primaryExportTestId(): string | undefined {
    return undefined;
  }

  /** Optional testid for the clipboard menu item in the split-button popover. */
  protected clipboardExportTestId(): string | undefined {
    return undefined;
  }

  /** "Select all" toolbar button (exact match to avoid the sibling "Deselect all"). */
  selectAllButton(): Locator {
    return this.dialog().getByRole('button', { name: 'Select All', exact: true });
  }

  /** "Deselect all" toolbar button. */
  deselectAllButton(): Locator {
    return this.dialog().getByRole('button', { name: /deselect all/i });
  }

  /** Every selectable row checkbox inside the dialog (flat or grouped). */
  selectionList(): Locator {
    return this.dialog().getByRole('checkbox');
  }

  // ─── Atomic actions ──────────────────────────────────────────────────────

  /** Type into the optional note field. */
  async fillNote(text: string): Promise<void> {
    await this.noteField().fill(text);
  }

  /** Click the toolbar "Select All" button. */
  async selectAll(): Promise<void> {
    await this.selectAllButton().click();
  }

  /** Click the toolbar "Deselect All" button. */
  async deselectAll(): Promise<void> {
    await this.deselectAllButton().click();
  }

  /** Click the primary "Export" button (writes a JSON file). */
  async clickExportToFile(): Promise<void> {
    await this.exportFileButton().click();
  }

  /** Open the split-button popover and click the "Clipboard" entry. */
  async clickExportToClipboard(): Promise<void> {
    await this.exportOptionsButton().click();
    await this.exportClipboardButton().click();
  }

  /** Close the wizard via its "Cancel" button. */
  async cancel(): Promise<void> {
    await this.clickButton(/cancel/i);
  }

  // ─── Atomic assertions ───────────────────────────────────────────────────

  /** Assert the primary Export button is enabled (selection non-empty). */
  async expectExportButtonEnabled(): Promise<void> {
    await expect(this.exportFileButton()).toBeEnabled();
  }

  /** Assert the primary Export button is disabled (no selection). */
  async expectExportButtonDisabled(): Promise<void> {
    await expect(this.exportFileButton()).toBeDisabled();
  }

  /** Assert the previously typed note is reflected in the note field value. */
  async expectNoteVisible(text: string): Promise<void> {
    await expect(this.noteField()).toHaveValue(text);
  }

  /**
   * Subclasses know which i18n string to match for the "{n} item(s) selected"
   * count label (rule vs. session), so the base only declares the contract.
   */
  abstract expectSelectedCount(count: number): Promise<void>;
}
