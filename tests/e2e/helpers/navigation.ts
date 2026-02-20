import type { Page } from '@playwright/test';

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
  // Allow React to finish committing any pending state updates.
  await page.waitForTimeout(500);
}

/**
 * Navigate to the Sessions section with the snapshot wizard pre-opened.
 * Uses the deep-link pattern: #sessions?action=snapshot
 */
export async function goToSessionsSectionWithSnapshot(page: Page, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/options.html#sessions?action=snapshot`);
  await page.waitForLoadState('domcontentloaded');
  // Wait for the wizard dialog (opened by the deep link action)
  await page
    .getByRole('dialog')
    .waitFor({ state: 'visible', timeout: 10_000 });
}

/** Navigate to the extension popup page. */
export async function goToPopup(page: Page, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(300);
}
