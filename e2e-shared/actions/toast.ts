/**
 * Wait for an in-app toast (Radix toast viewport) to appear.
 *
 * The extension renders its own toast viewport (testid `toast-viewport`).
 * Each toast root carries a `data-testid="toast-{variant}"` plus a
 * `data-variant` attribute. The helper attaches to the viewport first
 * (covers the "viewport not mounted yet" race) and then waits for the
 * first visible toast, optionally narrowed by variant.
 *
 * Returns the toast locator so callers can chain further assertions
 * (e.g. `expect(toast).toContainText(...)`).
 */
import type { Locator, Page } from '@playwright/test';

export type ToastVariant = 'success' | 'error' | 'info';

export interface WaitForToastOptions {
  /** Restrict the wait to a specific variant. */
  variant?: ToastVariant;
  /** Override the default 5s timeout. */
  timeoutMs?: number;
}

export async function waitForToast(
  page: Page,
  options: WaitForToastOptions = {},
): Promise<Locator> {
  const { variant, timeoutMs = 5_000 } = options;
  await page
    .getByTestId('toast-viewport')
    .waitFor({ state: 'attached', timeout: timeoutMs });
  const toast = variant
    ? page.getByTestId(`toast-${variant}`)
    : page.locator('[data-testid^="toast-"][data-variant]');
  await toast.first().waitFor({ state: 'visible', timeout: timeoutMs });
  return toast.first();
}
