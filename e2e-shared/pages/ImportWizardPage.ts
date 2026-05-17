/**
 * Page Object for the rules / sessions Import wizard.
 *
 * Wraps the Radix dialog opened from the Import/Export options page. The
 * goal of this class is to expose **atomic** building blocks:
 *
 * - locators (`textArea`, `nextButton`, ...),
 * - atomic actions (`selectTextMode`, `pasteJson`, `clickNext`, ...),
 * - atomic assertions (`expectInvalidJsonError`,
 *   `expectClassification`).
 *
 * Composed flows (e.g. `importRulesViaText(...)`) belong in
 * `e2e-shared/actions/` so that they can be shared between
 * `tests/e2e/` (functional) and `e2e-doc-scenarios/` (narrative
 * captures) without forcing callers through the imperative spec style.
 *
 * The selectors target the English UI used by the default Playwright
 * Chromium launch (`--lang=en-US`). When the wizard is exercised under a
 * different locale, override the regexes by subclassing and replacing the
 * locator getters.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { DialogPage } from './DialogPage.js';

export interface ImportClassificationCounts {
  new?: number;
  conflicting?: number;
  identical?: number;
}

export type ImportConflictMode = 'overwrite' | 'duplicate' | 'ignore';

export class ImportWizardPage extends DialogPage {
  constructor(page: Page) {
    super(page);
  }

  // ─── Locators ────────────────────────────────────────────────────────────

  /** Textarea for raw JSON input (visible in Text mode). */
  textArea(): Locator {
    return this.dialog().locator('textarea').first();
  }

  /** "Drag and drop" zone (visible in File mode). */
  fileDropZone(): Locator {
    return this.dialog().getByText(/drag/i);
  }

  /** "Browse" button inside the file drop zone. */
  browseButton(): Locator {
    return this.dialog().getByRole('button', { name: /browse/i });
  }

  /**
   * "Next" button in the source-step footer.
   *
   * Locale-agnostic: anchors on the last button in the dialog (the
   * `WizardModal.Footer` is the bottom-most flex, so its rightmost button
   * is the dialog's last button in DOM order). Pack mode renders its own
   * Next button with the dedicated `import-wizard-pack-next` testid; the
   * generic `nextButton()` still finds it because it remains the last
   * footer button.
   */
  nextButton(): Locator {
    return this.dialog().locator('button').last();
  }

  /**
   * "Confirm import" button in the classification-step footer.
   *
   * Locale-agnostic: anchors on the last button in the dialog (Previous +
   * Confirm Import on step 1).
   */
  confirmButton(): Locator {
    return this.dialog().locator('button').last();
  }

  /**
   * Gray info callout shown on step 1 when the imported payload carries a
   * user-supplied note (rendered by `ImportedNoteCallout`).
   */
  noteCallout(): Locator {
    return this.dialog()
      .locator('.rt-CalloutRoot')
      .filter({ hasText: /export note/i })
      .first();
  }

  /**
   * Red error callout shown on step 0 when JSON parsing fails (rendered by
   * `ImportErrorCallout`). The "Invalid JSON format" text is stable enough
   * to anchor on; finer-grained banners (Zod errors) appear in the same
   * callout.
   */
  errorBanner(): Locator {
    return this.dialog()
      .locator('.rt-CalloutRoot')
      .filter({ hasText: /invalid json format/i })
      .first();
  }

  /**
   * Collection of per-row selection checkboxes rendered on the
   * classification step. Each row is `role="checkbox"`; callers can
   * filter further by accessible name.
   */
  selectionList(): Locator {
    return this.dialog().getByRole('checkbox');
  }

  // ─── Atomic actions ──────────────────────────────────────────────────────

  /**
   * Switch the source segmented control to "File" mode.
   *
   * Locale-agnostic: anchors on the Radix `SegmentedControl.Item` button
   * (`button.rt-SegmentedControlItem[value="file"]`), which is set by
   * `SourceModeSegmented` and unaffected by translation.
   */
  async selectFileMode(): Promise<void> {
    await this.dialog()
      .locator('button.rt-SegmentedControlItem[value="file"]')
      .first()
      .click();
  }

  /**
   * Switch the source segmented control to "Text" mode.
   *
   * Locale-agnostic via the `[value="text"]` attribute on the
   * `SegmentedControl.Item` button.
   */
  async selectTextMode(): Promise<void> {
    await this.dialog()
      .locator('button.rt-SegmentedControlItem[value="text"]')
      .first()
      .click();
    await this.textArea().waitFor({ state: 'visible' });
  }

  /**
   * Pick a conflict-resolution mode on the classification step
   * (`ConflictModeSelector`). Locale-agnostic via the `[value=]` attribute
   * carried by each Radix `SegmentedControl.Item` button.
   */
  async setConflictMode(mode: ImportConflictMode): Promise<void> {
    await this.dialog()
      .locator(`button.rt-SegmentedControlItem[value="${mode}"]`)
      .first()
      .click();
  }

  /**
   * Ensure Text mode is active and fill the textarea with `json`.
   * Idempotent: if Text mode is already active, only the textarea is
   * filled.
   */
  async pasteJson(json: string): Promise<void> {
    if (!(await this.textArea().isVisible())) {
      await this.selectTextMode();
    }
    await this.textArea().fill(json);
  }

  /** Click the "Next" button (advances source-step to classification). */
  async clickNext(): Promise<void> {
    await this.nextButton().click();
  }

  /** Click the "Confirm import" button on the classification step. */
  async confirmImport(): Promise<void> {
    await this.confirmButton().click();
  }

  /** Close the wizard via the "Cancel" button. */
  async cancel(): Promise<void> {
    await this.clickButton(/cancel/i);
  }

  // ─── Atomic assertions ───────────────────────────────────────────────────

  /** Assert the "Invalid JSON format" callout is visible. */
  async expectInvalidJsonError(): Promise<void> {
    await expect(this.errorBanner()).toBeVisible();
  }

  /**
   * Assert the classification step exposes the expected counts for each
   * bucket. Every field of `counts` is optional; omitted buckets are not
   * asserted, which lets a single call cover partial scenarios such as
   * `expectClassification({ new: 1 })`.
   */
  async expectClassification(counts: ImportClassificationCounts): Promise<void> {
    const dialog = this.dialog();
    if (counts.new !== undefined) {
      await expect(
        dialog.getByText(new RegExp(`new rules.*${counts.new}`, 'i')),
      ).toBeVisible();
    }
    if (counts.conflicting !== undefined) {
      await expect(
        dialog.getByText(new RegExp(`conflicting rules.*${counts.conflicting}`, 'i')),
      ).toBeVisible();
    }
    if (counts.identical !== undefined) {
      await expect(
        dialog.getByText(new RegExp(`identical rules.*${counts.identical}`, 'i')),
      ).toBeVisible();
    }
  }
}
