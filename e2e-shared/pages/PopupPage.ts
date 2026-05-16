/**
 * Page Object for the extension popup (popup.html).
 *
 * The popup is not a Radix dialog (`role="dialog"`); it is the top-level
 * `<Box data-testid="popup">` rendered by `src/pages/popup.tsx`. We keep
 * the same Page Object shape used by the dialog wizards (locators + atomic
 * actions + atomic assertions) so callers stay symmetric.
 *
 * Selectors target the English UI (`--lang=en-US`).
 */
import { expect, type Locator, type Page } from '@playwright/test';

export class PopupPage {
  constructor(protected readonly page: Page) {}

  // ─── Locators ────────────────────────────────────────────────────────────

  /** Root popup container. */
  root(): Locator {
    return this.page.getByTestId('popup');
  }

  /** Popup header (title + settings button). */
  header(): Locator {
    return this.page.getByTestId('popup-header');
  }

  /** "Open settings" gear button in the popup header. */
  settingsButton(): Locator {
    return this.page.getByTestId('popup-header-btn-settings');
  }

  /** "Organize all tabs" hero button in the toolbar. */
  organizeButton(): Locator {
    return this.page.getByTestId('popup-toolbar-btn-organize');
  }

  /** "Save session" button in the toolbar. */
  saveSessionButton(): Locator {
    return this.page.getByTestId('popup-toolbar-btn-save');
  }

  /** "Restore session" button in the toolbar. */
  restoreSessionButton(): Locator {
    return this.page.getByTestId('popup-toolbar-btn-restore');
  }

  /** Pinned-sessions list rendered below the toolbar. */
  sessionsList(): Locator {
    return this.page.getByTestId('popup-profiles-list');
  }

  /** Empty-state callout shown when no pinned profile exists. */
  pinnedEmptyState(): Locator {
    return this.page.getByTestId('popup-pinned-empty');
  }

  /**
   * Toolbar wrapper (`popup-toolbar`). Useful as a stand-in for the
   * "statistics panel" referenced by the lot-5 plan: the popup no longer
   * surfaces tab-group / dedup counters, so this is the closest section
   * carrying actionable popup state.
   */
  statisticsPanel(): Locator {
    return this.page.getByTestId('popup-toolbar');
  }

  // ─── Atomic actions ──────────────────────────────────────────────────────

  /**
   * Navigate to the popup URL and wait for the settings button to appear.
   * Returns the `PopupPage` so callers can chain locators.
   */
  async open(extensionId: string): Promise<this> {
    await this.page.goto(`chrome-extension://${extensionId}/popup.html`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.settingsButton().waitFor({ state: 'visible', timeout: 10_000 });
    return this;
  }

  /** Click the "Organize all tabs" button. */
  async clickOrganize(): Promise<void> {
    await this.organizeButton().click();
  }

  /** Open the options page by clicking the gear icon. */
  async openSettings(): Promise<void> {
    await this.settingsButton().click();
  }

  // ─── Atomic assertions ───────────────────────────────────────────────────

  /** Assert the popup root is visible (popup actually mounted). */
  async expectVisible(): Promise<void> {
    await expect(this.root()).toBeVisible({ timeout: 10_000 });
  }

  /** Assert the Organize button is enabled (not in an `aria-disabled` state). */
  async expectOrganizeEnabled(): Promise<void> {
    await expect(this.organizeButton()).not.toHaveAttribute('aria-disabled', 'true');
  }

  /**
   * Assert a single popup-surfaced statistic field matches `value`. The
   * popup does not currently render numeric counters; this helper anchors
   * on the toolbar text so callers stay forward-compatible if/when stats
   * land back in the popup. It accepts any substring (case-insensitive).
   */
  async expectStatistic(name: string, value: string | number): Promise<void> {
    const panel = this.statisticsPanel();
    await expect(panel).toContainText(new RegExp(String(name), 'i'));
    await expect(panel).toContainText(new RegExp(String(value), 'i'));
  }
}
