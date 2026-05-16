/**
 * Page Object for the sessions Export wizard.
 *
 * Wraps the Radix dialog opened from the Import/Export options page when
 * the user picks "Export sessions" (and from the Sessions page in some
 * narrative flows). Distinct from `ExportWizardPage` (rules) because the
 * selectable list is split in two sub-groups: Pinned Sessions (US-IE013)
 * and Sessions, each with its own indeterminate header checkbox and a
 * `Separator` between them when both buckets are non-empty.
 *
 * Inherits the common note field, toolbar and footer split-button from
 * `ExportWizardPageBase`. Only the list shape and the count label differ.
 *
 * Selectors target the English UI (`--lang=en-US`). Subclass and override
 * the locator getters to retarget another locale.
 *
 * Relevant US: US-IE012 (export sessions envelope), US-IE013 (pinned vs
 * normal sub-groups).
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { ExportWizardPageBase } from './ExportWizardPageBase.js';

export class SessionsExportWizardPage extends ExportWizardPageBase {
  constructor(page: Page) {
    super(page);
  }

  // ─── Locators ────────────────────────────────────────────────────────────

  /**
   * Group-level checkbox for the Pinned Sessions sub-group (US-IE013).
   * Located by its accessible label so it doesn't collide with the
   * per-session row checkboxes.
   */
  pinnedGroupCheckbox(): Locator {
    return this.dialog().getByRole('checkbox', { name: /pinned sessions/i });
  }

  /** Group-level checkbox for the Sessions (unpinned) sub-group. */
  normalGroupCheckbox(): Locator {
    return this.dialog().getByRole('checkbox', { name: /^sessions$/i });
  }

  /**
   * The "Pinned Sessions" section header text. Use it to assert the section
   * is rendered (it is hidden when no pinned sessions exist).
   */
  pinnedGroup(): Locator {
    return this.dialog().getByText(/pinned sessions/i).first();
  }

  /**
   * The "Sessions" section header text. Use it to assert the unpinned
   * section is rendered.
   */
  normalGroup(): Locator {
    return this.dialog().getByText(/^sessions$/i).first();
  }

  // ─── Atomic actions ──────────────────────────────────────────────────────

  /**
   * Toggle a single session row by its accessible label (the session's
   * `name` property).
   */
  async toggleSession(name: string): Promise<void> {
    await this.dialog().getByRole('checkbox', { name }).click();
  }

  /** Toggle the group-level checkbox of the Pinned Sessions section. */
  async togglePinnedGroup(): Promise<void> {
    await this.pinnedGroupCheckbox().click();
  }

  /** Toggle the group-level checkbox of the Sessions (unpinned) section. */
  async toggleNormalGroup(): Promise<void> {
    await this.normalGroupCheckbox().click();
  }

  // ─── Atomic assertions ───────────────────────────────────────────────────

  /**
   * Assert the visual separator between Pinned and Sessions is present.
   * Rendered as a Radix Separator inside the dialog body, distinct from the
   * footer separator which sits below the Cancel/Export buttons. Asserting
   * both section headers cover the visual contract without depending on a
   * brittle DOM index.
   */
  async expectPinnedSeparator(): Promise<void> {
    await expect(this.pinnedGroup()).toBeVisible();
    await expect(this.normalGroup()).toBeVisible();
  }

  /** Assert the wizard opened with every session pre-selected. */
  async expectAllSessionsSelected(total: number): Promise<void> {
    await this.expectSelectedCount(total);
  }

  /**
   * Assert the "{count} session(s) selected" label reflects `count`.
   * Counterpart of `ExportWizardPage.expectSelectedCount` for sessions.
   */
  async expectSelectedCount(count: number): Promise<void> {
    await expect(
      this.dialog().getByText(new RegExp(`${count} session.*selected`, 'i')),
    ).toBeVisible();
  }
}
