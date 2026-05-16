/**
 * Page Object for the Snapshot wizard (session creation, US-S001).
 *
 * Wraps the Radix dialog opened by "Take Snapshot" on the Sessions page.
 * Exposes the session-name input, the TabTree selection (with its
 * Select all / Deselect all toolbar), the note field and the Save button.
 *
 * The wizard pre-selects every captured tab on open; `expectSaveEnabled`
 * is the most reliable way to wait for the asynchronous capture to finish
 * (the Save button is disabled until the capture resolves and at least
 * one tab is selected).
 *
 * Composed flows (`createSnapshotWithTabs`, ...) live in
 * `e2e-shared/actions/sessions-snapshot.ts`.
 *
 * Selectors target the English UI (`--lang=en-US`).
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { DialogPage } from './DialogPage.js';

export class SnapshotWizardPage extends DialogPage {
  constructor(page: Page) {
    super(page);
  }

  override dialog(): Locator {
    return this.page.getByTestId('wizard-snapshot');
  }

  // ─── Locators ────────────────────────────────────────────────────────────

  /** Session name input. */
  sessionNameInput(): Locator {
    return this.dialog().getByTestId('wizard-snapshot-field-name');
  }

  /** Optional note textarea. */
  noteField(): Locator {
    return this.dialog().getByTestId('wizard-snapshot-field-notes');
  }

  /** TabTree container holding every selectable row. */
  tabList(): Locator {
    return this.dialog().getByTestId('tab-tree');
  }

  /**
   * Collection of selectable checkboxes inside the TabTree (one per tab
   * plus one per group header). Used to count selection state.
   */
  tabCheckboxes(): Locator {
    return this.tabList().getByRole('checkbox');
  }

  /** "Select all" button rendered inside the TabTree action bar. */
  selectAllButton(): Locator {
    return this.tabList().getByRole('button', { name: 'Select All', exact: true });
  }

  /** "Deselect all" button (replaces Select All when everything is checked). */
  deselectAllButton(): Locator {
    return this.tabList().getByRole('button', { name: 'Deselect All', exact: true });
  }

  /** Primary "Save Session" button in the footer. */
  saveButton(): Locator {
    return this.dialog().getByTestId('wizard-snapshot-btn-save');
  }

  /** "Cancel" button in the footer. */
  cancelButton(): Locator {
    return this.dialog().getByTestId('wizard-snapshot-btn-cancel');
  }

  /**
   * Blue Callout shown when the wizard was opened from a Chrome tab group
   * (only a subset of tabs is preselected).
   */
  activeGroupCallout(): Locator {
    return this.dialog().getByTestId('wizard-snapshot-group-callout');
  }

  // ─── Atomic actions ──────────────────────────────────────────────────────

  /** Fill the session name input. */
  async fillName(name: string): Promise<void> {
    await this.sessionNameInput().fill(name);
  }

  /** Fill the optional note textarea. */
  async fillNote(text: string): Promise<void> {
    await this.noteField().fill(text);
  }

  /**
   * Toggle a single tab by its title. Each TabTree row exposes a Radix
   * Checkbox with `aria-label="Select tab {title}"` (cf. `tabTreeSelectTab`
   * message). When the wizard contains multiple tabs sharing the same
   * title, only the first match is toggled.
   */
  async toggleTab(title: string): Promise<void> {
    await this.tabList()
      .getByRole('checkbox', { name: new RegExp(`select tab.*${escapeRegExp(title)}`, 'i') })
      .first()
      .click();
  }

  /** Click the TabTree "Select all" button. */
  async selectAllTabs(): Promise<void> {
    await this.selectAllButton().click();
  }

  /** Click the TabTree "Deselect all" button. */
  async deselectAllTabs(): Promise<void> {
    await this.deselectAllButton().click();
  }

  /** Submit the wizard via "Save Session". */
  async clickSave(): Promise<void> {
    await this.saveButton().click();
  }

  /** Cancel the wizard. */
  async clickCancel(): Promise<void> {
    await this.cancelButton().click();
  }

  // ─── Atomic assertions ───────────────────────────────────────────────────

  /**
   * Assert the Save button is enabled. Useful to wait for the asynchronous
   * `captureCurrentTabs()` call to resolve before driving the wizard.
   */
  async expectSaveButtonEnabled(): Promise<void> {
    await expect(this.saveButton()).toBeEnabled({ timeout: 10_000 });
  }

  /** Assert the Save button is disabled (capture pending or no tab selected). */
  async expectSaveButtonDisabled(): Promise<void> {
    await expect(this.saveButton()).toBeDisabled();
  }

  /**
   * Assert the TabTree exposes exactly `count` tab rows (groups excluded).
   * Tab rows are identified by their `aria-label` starting with
   * `Select tab` (group headers use `Select group`).
   */
  async expectCapturedTabsCount(count: number): Promise<void> {
    await expect(
      this.tabList().getByRole('checkbox', { name: /^select tab/i }),
    ).toHaveCount(count);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
