/**
 * Force a `light` / `dark` theme on a Page by writing the next-themes
 * `localStorage('theme')` key and reloading.
 *
 * The reload is required: a hash navigation does not remount React, so
 * next-themes would keep the stale theme from its initial mount.
 */
import type { Page } from '@playwright/test';

export type Theme = 'light' | 'dark';

export async function applyTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate((t) => localStorage.setItem('theme', t), theme);
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
}
