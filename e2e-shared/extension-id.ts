/**
 * Resolves the Chrome extension ID from a launched BrowserContext.
 *
 * Chromium assigns a stable hash-based ID to a `--load-extension` build; the
 * service worker URL `chrome-extension://<id>/sw.js` exposes it.
 */
import type { BrowserContext, Worker } from '@playwright/test';

/** Wait for the extension service worker, retrying up to `timeoutMs`. */
export async function waitForServiceWorker(
  context: BrowserContext,
  timeoutMs = 5_000,
): Promise<Worker> {
  let sw = context.serviceWorkers()[0];
  if (sw) return sw;
  const deadline = Date.now() + timeoutMs;
  while (!sw && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 200));
    sw = context.serviceWorkers()[0];
  }
  if (!sw) throw new Error('Service worker not found');
  return sw;
}

/** Extract the extension ID from the running service worker URL. */
export function getExtensionId(context: BrowserContext): string {
  const sw = context.serviceWorkers()[0];
  if (!sw) {
    throw new Error('Service worker not available — call waitForServiceWorker first');
  }
  return new URL(sw.url()).hostname;
}
