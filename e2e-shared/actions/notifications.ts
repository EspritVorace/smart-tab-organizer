/**
 * Composed flows for native browser notifications driven by the extension
 * service worker.
 *
 * The notifications domain is one of the few corners of the test suite
 * that talks to the service worker directly rather than the DOM (Chrome
 * does not expose notification chrome to Playwright). These helpers wrap
 * the recurring SW dance so notification-aware specs stop duplicating the
 * same `evaluate` payloads.
 *
 * Relevant US: US-N001..US-N005.
 */
import type { BrowserContext, Page } from '@playwright/test';

// Minimal Chrome typings used inside `evaluate` callbacks. The full
// `@types/chrome` is not a dependency of the shared bundle, so we model
// only the surface this file needs (notifications + storage + windows).
declare const chrome: {
  notifications: {
    getAll(cb: (notifications: Record<string, unknown>) => void): void;
    clear(id: string): void;
  };
  storage: {
    local: {
      set(items: Record<string, unknown>): Promise<void>;
    };
  };
  windows: {
    getCurrent(): Promise<{ id?: number }>;
  };
};

/**
 * Resolve the running service worker, retrying briefly when Chrome has
 * idle-terminated it between tests. Returns the SW page or throws after
 * `timeoutMs`.
 */
export async function getServiceWorker(
  context: BrowserContext,
  timeoutMs = 5_000,
): Promise<Page> {
  const deadline = Date.now() + timeoutMs;
  let sw = context.serviceWorkers()[0];
  while (!sw && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 100));
    sw = context.serviceWorkers()[0];
  }
  if (!sw) throw new Error('Service worker not available (idle termination?)');
  return sw as unknown as Page;
}

/**
 * Polls until `executeNotificationUndoById` is exposed on the SW's
 * `globalThis`. Needed because the SW may be idle-terminated and
 * restarting; the test would race the SW's re-initialisation otherwise.
 */
export async function getServiceWorkerWithUndoFn(
  context: BrowserContext,
  timeoutMs = 5_000,
): Promise<Page> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const sw = context.serviceWorkers()[0];
    if (sw) {
      const ready = await sw
        .evaluate(() => typeof (globalThis as unknown as { executeNotificationUndoById?: unknown }).executeNotificationUndoById === 'function')
        .catch(() => false);
      if (ready) return sw as unknown as Page;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('executeNotificationUndoById not available on SW globalThis after timeout');
}

/**
 * Polls until `handleOrganizeAllTabs` is exposed on the SW's `globalThis`.
 * Used by popup-organize specs that bypass the popup UI and call the
 * handler directly.
 */
export async function getServiceWorkerWithOrganizeFn(
  context: BrowserContext,
  timeoutMs = 5_000,
): Promise<Page> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const sw = context.serviceWorkers()[0];
    if (sw) {
      const ready = await sw
        .evaluate(() => typeof (globalThis as unknown as { handleOrganizeAllTabs?: unknown }).handleOrganizeAllTabs === 'function')
        .catch(() => false);
      if (ready) return sw as unknown as Page;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('handleOrganizeAllTabs not available on SW globalThis after timeout');
}

/** Returns every notification id currently registered with Chrome. */
export async function getNotificationIds(sw: Page): Promise<string[]> {
  return sw.evaluate(async () => {
    return new Promise<string[]>((resolve) =>
      chrome.notifications.getAll((n) => resolve(Object.keys(n ?? {}))),
    );
  });
}

/**
 * Returns notification ids whose prefix matches `prefix` (defaults to
 * `smarttab-`, the prefix used by the extension). Filters out ids
 * registered by other extensions / Chrome internals.
 */
export async function getSmartTabNotificationIds(
  sw: Page,
  prefix = 'smarttab-',
): Promise<string[]> {
  const all = await getNotificationIds(sw);
  return all.filter((id) => id.startsWith(prefix));
}

/** Clears every Chrome notification registered for the current profile. */
export async function clearAllNotifications(sw: Page): Promise<void> {
  await sw.evaluate(async () => {
    const all = await new Promise<Record<string, unknown>>((resolve) =>
      chrome.notifications.getAll((n) => resolve(n ?? {})),
    );
    await Promise.all(Object.keys(all).map((id) => chrome.notifications.clear(id)));
  });
}

/**
 * Writes notification preferences directly to `chrome.storage.local`.
 * Accepts a partial patch; omitted keys keep their stored value.
 */
export async function setNotificationPrefs(
  sw: Page,
  prefs: { notifyOnGrouping?: boolean; notifyOnDeduplication?: boolean },
): Promise<void> {
  await sw.evaluate(async (p: Record<string, unknown>) => {
    await chrome.storage.local.set(p);
  }, prefs as Record<string, unknown>);
  await new Promise((r) => setTimeout(r, 100));
}

/**
 * Executes the SW-exposed `executeNotificationUndoById` helper for the
 * supplied notification id. Resolves once the SW has finished running the
 * undo handler (no fixed wait; callers add their own settle if needed).
 */
export async function executeNotificationUndo(
  context: BrowserContext,
  notificationId: string,
): Promise<void> {
  const sw = await getServiceWorkerWithUndoFn(context);
  await sw.evaluate(async (id: string) => {
    const fn = (globalThis as unknown as {
      executeNotificationUndoById: (id: string) => Promise<void>;
    }).executeNotificationUndoById;
    await fn(id);
  }, notificationId);
}

/**
 * Trigger the batch organize-all-tabs handler via the service worker.
 *
 * The popup-organize tests historically bypassed the popup UI (which
 * closes itself via `window.close()` and detaches Playwright before the
 * SW finishes) and called `handleOrganizeAllTabs` directly. This helper
 * keeps that pattern available as a domain action so specs don't repeat
 * the SW-readiness handshake.
 */
export async function triggerOrganizeAllTabsViaSW(context: BrowserContext): Promise<void> {
  const sw = await getServiceWorkerWithOrganizeFn(context);
  await sw.evaluate(async () => {
    const win = await chrome.windows.getCurrent();
    const fn = (globalThis as unknown as {
      handleOrganizeAllTabs: (windowId: number | undefined) => Promise<void>;
    }).handleOrganizeAllTabs;
    await fn(win.id);
  });
  await new Promise((r) => setTimeout(r, 2_000));
}
