/**
 * Composed flows for the extension popup.
 *
 * Each action narrates a single business outcome ("open the popup",
 * "trigger organize from the popup", "open settings from the popup")
 * and hides the navigation plumbing. Consumes `PopupPage`; never reaches
 * into raw locators.
 *
 * Relevant US: US-PO006..US-PO009.
 */
import type { BrowserContext, Page } from '@playwright/test';
import { PopupPage } from '../pages/PopupPage.js';

/**
 * Navigate the supplied page to the popup URL and return a ready
 * `PopupPage` instance.
 */
export async function openPopup(page: Page, extensionId: string): Promise<PopupPage> {
  const popup = new PopupPage(page);
  await popup.open(extensionId);
  return popup;
}

/**
 * Click the "Organize all tabs" button from the popup. The button sends an
 * `ORGANIZE_ALL_TABS` message to the service worker and then closes the
 * popup window via `window.close()`. The optional `extensionContext` is
 * accepted purely so callers can pass it for future side-effect waits;
 * the helper currently returns once the click resolves.
 */
export async function triggerOrganizeFromPopup(
  page: Page,
  extensionId: string,
  _extensionContext?: BrowserContext,
): Promise<void> {
  const popup = await openPopup(page, extensionId);
  await popup.clickOrganize();
}
