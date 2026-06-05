import type { Page } from '@playwright/test';
import { DialogPage } from '../../../e2e-shared/pages/index.js';

/** Navigate to the extension options page. */
export async function goToOptionsPage(page: Page, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Navigate to the Sessions section via hash routing and wait until the section
 * is fully rendered (settings loaded + hash applied + React committed).
 *
 * The options page reads window.location.hash on mount and switches tabs.
 * `useSyncedSettings` is async, so we must wait for its data before the
 * Sessions page renders.  We wait for the loading state to clear and then
 * allow React to commit the sessions view.
 */
export async function goToSessionsSection(page: Page, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/options.html#sessions`);
  await page.waitForLoadState('domcontentloaded');
  // Wait for the options page loading state ("Chargement...") to clear,
  // which signals that useSyncedSettings has resolved and SessionsPage is mounted.
  await page.waitForFunction(
    () => {
      const body = document.body.textContent ?? '';
      // Loading indicator is gone AND the page has meaningful content
      return !body.includes('Chargement') && body.length > 50;
    },
    null,
    { timeout: 10_000 },
  );
  await page.getByTestId('page-sessions-btn-snapshot').waitFor({ state: 'visible', timeout: 10_000 });
}

/**
 * Navigate to the Sessions section with the snapshot wizard pre-opened.
 * Uses the deep-link pattern: #sessions?action=snapshot
 */
export async function goToSessionsSectionWithSnapshot(page: Page, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/options.html#sessions?action=snapshot`);
  await page.waitForLoadState('domcontentloaded');
  // Wait for the wizard dialog (opened by the deep link action)
  const dialog = new DialogPage(page);
  await dialog.expectVisible({ timeout: 10_000 });
}

/**
 * Navigate to the Domain Rules section and wait for the page to be ready.
 */
export async function goToDomainRulesSection(page: Page, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/options.html#rules`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(
    () => {
      const body = document.body.textContent ?? '';
      return !body.includes('Chargement') && body.length > 50;
    },
    null,
    { timeout: 10_000 },
  );
  await page.getByTestId('page-rules-btn-add').waitFor({ state: 'visible', timeout: 10_000 });
}

/**
 * Navigate to the Import / Export section of the options page and wait
 * until both action cards are visible (rules + sessions). Uses the
 * sidebar nav item rather than the hash so the same code path covers
 * tests that exercise hash routing separately.
 */
export async function goToImportExportSection(page: Page, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(
    () => {
      const body = document.body.textContent ?? '';
      return !body.includes('Chargement') && body.length > 50;
    },
    null,
    { timeout: 10_000 },
  );
  // Use the test id so the click is unambiguous (the accessible name now
  // matches both the sidebar nav item and the home quick-action card).
  await page.getByTestId('sidebar-nav-item-importexport').click();
  await page.getByTestId('page-import-export-card-import-rules').waitFor({ state: 'visible' });
}

/**
 * Navigate to the Statistics section via hash routing and wait until the
 * sub-tab bar is rendered (settings loaded + StatisticsPage mounted).
 */
export async function goToStatsSection(page: Page, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/options.html#stats`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(
    () => {
      const body = document.body.textContent ?? '';
      return !body.includes('Chargement') && body.length > 50;
    },
    null,
    { timeout: 10_000 },
  );
  await page.getByTestId('page-stats-tabs').waitFor({ state: 'visible', timeout: 10_000 });
}

/** Navigate to the extension popup page. */
export async function goToPopup(page: Page, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('popup-header-btn-settings').waitFor({ state: 'visible', timeout: 10_000 });
}
