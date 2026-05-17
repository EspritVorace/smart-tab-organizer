/**
 * Pipeline-specific helpers for the narrative documentation scenarios.
 *
 * Lot 6 (issue #309) drained this file of UI atoms that overlapped with
 * `e2e-shared/pages/` Page Objects and `e2e-shared/actions/` Domain
 * Actions: every wizard-driving helper now lives in the shared bundle so
 * an evolution of the extension's DOM breaks both pipelines at the same
 * call site (which keeps the `e2e-flaky-detector` agent's heuristics in
 * sync with reality).
 *
 * What remains here is genuinely capture-pipeline-specific: opening a
 * fresh extension page with the right `(locale, theme, viewport)` and
 * spinning a mimetic-site tab through the local fixture server. Domain
 * actions (rule creation, snapshot wizard, restore conflicts, ...) and
 * storage seeding belong to `e2e-shared/actions/` instead.
 */
import type { BrowserContext, Page } from '@playwright/test';
import { injectLocaleOverride } from '../../e2e-shared/locale-injector.js';
import { DialogPage } from '../../e2e-shared/pages/index.js';
import { applyTheme, type Theme } from '../../e2e-shared/theme.js';

/**
 * Open a brand-new page on a `chrome-extension://` URL with the locale
 * override and theme already applied.
 *
 * The popup is a small floating panel (`#popup-app` is 400px wide with
 * `overflow: hidden`). Match the viewport so screenshots don't include
 * the surrounding empty 1280x800 canvas.
 */
export async function openExtensionPage(
  context: BrowserContext,
  extensionId: string,
  section: 'popup' | 'rules' | 'sessions' | 'stats' | 'importexport' | 'settings' | '',
  locale: string,
  theme: Theme,
): Promise<Page> {
  const page = await context.newPage();
  await injectLocaleOverride(page, locale);

  if (section === 'popup') {
    await page.setViewportSize({ width: 402, height: 800 });
  }

  const base = `chrome-extension://${extensionId}`;
  const targetUrl =
    section === 'popup'
      ? `${base}/popup.html`
      : section === ''
        ? `${base}/options.html`
        : `${base}/options.html#${section}`;

  await page.goto(targetUrl);
  await page.waitForLoadState('domcontentloaded');
  await applyTheme(page, theme);
  await page.waitForFunction(
    () => (document.body?.textContent ?? '').length > 30,
    { timeout: 10_000 },
  );
  await page.waitForTimeout(600);
  return page;
}

/**
 * Open a new tab in the supplied context navigating to a mimetic-site URL.
 * Returns the new Page (already navigated). Navigation can race with the
 * grouping pipeline; the tab is still created on race, so we swallow the
 * navigation error rather than fail the scenario.
 */
export async function openMimeticTab(
  context: BrowserContext,
  url: string,
): Promise<Page> {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8_000 });
  } catch {
    // Navigation races with grouping; the tab still exists.
  }
  return page;
}

/**
 * Close any open Radix dialog by sending Escape. Wrapped here (rather
 * than inlined in scenarios) so the wait is explicit and consistent.
 */
export async function dismissDialog(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  const dialog = new DialogPage(page);
  await dialog.expectHidden().catch(() => undefined);
}
