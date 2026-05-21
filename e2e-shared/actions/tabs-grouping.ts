/**
 * Composed flows for automatic tab grouping (US-G family).
 *
 * Wraps the recurring "open a child tab, wait for grouping to settle" dance
 * around the helper-fixture primitives. The action layer doesn't talk to
 * the SW directly here: the `helpers` fixture already exposes well-tested
 * `createTabFromOpener` / `waitForTabGrouped` primitives, this module just
 * narrates the business intent so specs read as "given an opener, open a
 * grouped child" rather than a sequence of micro-steps.
 */
import type { BrowserContext, Page } from '@playwright/test';
import { waitForServiceWorker } from '../extension-id.js';

// Minimal Chrome typings consumed inside `evaluate` callbacks. The shared
// bundle does not pull in `@types/chrome`; the only API used here is
// `chrome.tabGroups.query`, which we narrow via an `unknown` cast at the
// call site below.
declare const chrome: unknown;

export interface TabGroupInfo {
  id: number;
  title: string;
  color: string;
  tabCount: number;
  tabIds: number[];
}

/**
 * Helper-fixture surface consumed by these actions. Mirrors the relevant
 * subset of `tests/e2e/fixtures.ts#ExtensionHelpers` so this module can
 * be imported from anywhere without a transitive Playwright-fixtures
 * dependency.
 */
export interface GroupingHelpers {
  createTab(url: string): Promise<Page>;
  createTabFromOpener(openerPage: Page, url: string): Promise<Page>;
  waitForGrouping(timeoutMs?: number): Promise<void>;
  waitForTabGrouped(expectedTitle?: string, timeoutMs?: number): Promise<TabGroupInfo[]>;
}

/**
 * Simulate opening a child tab via the middle-click flow (auxclick): a
 * tab opened from another tab using a synthetic "middle click" hint that
 * the content script normally injects. The child is created with the
 * opener's tab id so the grouping engine treats it as a related tab.
 *
 * Returns the new `Page` so callers can drive the child if needed.
 */
export async function openChildTabViaMiddleClick(
  helpers: GroupingHelpers,
  parent: Page,
  url: string,
): Promise<Page> {
  return helpers.createTabFromOpener(parent, url);
}

/**
 * Simulate opening a child tab via the "open in new tab" context-menu
 * entry. At the SW level the flow is identical to middle-click (same
 * `createTabFromOpener` invocation); the helper is exposed separately to
 * document intent in tests where the user gesture matters.
 */
export async function openChildTabViaContextMenu(
  helpers: GroupingHelpers,
  parent: Page,
  url: string,
): Promise<Page> {
  return helpers.createTabFromOpener(parent, url);
}

/**
 * Wait for at least one Chrome tab group to exist (optionally with a
 * specific title). Returns the snapshot of groups available at resolve
 * time, so callers can assert further details.
 */
export async function waitForGroupCreated(
  helpers: GroupingHelpers,
  title?: string,
  timeoutMs = 8_000,
): Promise<TabGroupInfo[]> {
  return helpers.waitForTabGrouped(title, timeoutMs);
}

/**
 * Wait for the extension's grouping pipeline to settle without the helpers
 * fixture. Polls `chrome.tabGroups.query` via the service worker until the
 * group count is stable for 600 ms or the timeout elapses.
 *
 * Used by the narrative capture pipeline, which only has access to the
 * BrowserContext (no `helpers` injection): the doc-scenarios fixture
 * extends the same `e2e-shared/fixtures-base.ts` as the functional suite
 * but stops short of plumbing the `helpers` object.
 */
export async function waitForGroupingSettled(
  context: BrowserContext,
  timeoutMs = 5_000,
): Promise<void> {
  const sw = await waitForServiceWorker(context);
  const deadline = Date.now() + timeoutMs;
  let lastCount = -1;
  let stableMs = 0;
  while (Date.now() < deadline) {
    const count = await sw.evaluate<number>(async () => {
      const browser = chrome as unknown as {
        tabGroups?: { query: (q: object) => Promise<unknown[]> };
      };
      if (!browser.tabGroups) return 0;
      const groups = await browser.tabGroups.query({});
      return groups.length;
    });
    if (count === lastCount) {
      stableMs += 200;
      if (stableMs >= 600) return;
    } else {
      lastCount = count;
      stableMs = 0;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
}
