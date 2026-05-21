/**
 * Composed flows for tab deduplication (US-D family).
 *
 * Mirrors the philosophy of `tabs-grouping.ts`: thin narrative wrappers
 * around the helper-fixture primitives so combined/notifications specs
 * stop spelling out the "open duplicate, wait for dedup, assert tab
 * count" recipe inline.
 */
import { expect, type BrowserContext, type Page } from '@playwright/test';
import {
  executeNotificationUndo,
  getServiceWorker,
  getSmartTabNotificationIds,
} from './notifications.js';

export interface DeduplicationHelpers {
  createTab(url: string): Promise<Page>;
  getTabCount(): Promise<number>;
  waitForDeduplication(timeoutMs?: number): Promise<void>;
}

/**
 * Open a duplicate tab on `url` and assert that the tab count did NOT
 * grow. The assertion is best-effort: when deduplication is disabled,
 * Chrome briefly shows two tabs before any cleanup, so we compare the
 * post-settle count against the pre-duplicate snapshot.
 */
export async function expectTabDeduplicated(
  helpers: DeduplicationHelpers,
  url: string,
): Promise<void> {
  const before = await helpers.getTabCount();
  await helpers.createTab(url);
  await helpers.waitForDeduplication();
  const after = await helpers.getTabCount();
  expect(after).toBeLessThanOrEqual(before);
}

/**
 * Undo the most recent deduplication notification via the SW-exposed
 * `executeNotificationUndoById` helper. Resolves once Chrome has
 * reopened the closed tab (returns the SW page so callers can keep
 * driving it if needed).
 *
 * Returns the notification id that was undone (useful for follow-up
 * assertions on `shouldSkipDeduplication`).
 */
export async function undoLastDeduplication(
  context: BrowserContext,
): Promise<string> {
  const sw = await getServiceWorker(context);
  const ids = await getSmartTabNotificationIds(sw);
  const notifId = ids[ids.length - 1];
  if (!notifId) {
    throw new Error('undoLastDeduplication: no smarttab-* notification found.');
  }
  await executeNotificationUndo(context, notifId);
  return notifId;
}
