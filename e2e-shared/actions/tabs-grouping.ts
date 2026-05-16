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
import type { Page } from '@playwright/test';

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
