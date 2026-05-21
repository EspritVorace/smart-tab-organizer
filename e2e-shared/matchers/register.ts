/**
 * Registers the custom matchers from `./index.ts` on Playwright's global
 * `expect`. Importing this module once (typically from a Playwright
 * fixtures file) activates the matchers for every test that uses the
 * same `expect`.
 *
 * Splitting registration from definition lets `./index.ts` stay
 * side-effect-free, which is useful for unit-style imports (e.g.
 * documentation, ad-hoc scripts) that need the matcher functions
 * without polluting the global `expect`.
 *
 * Augments the global `PlaywrightTest.Matchers` interface so callers
 * get type-safe access to the new matchers:
 *
 * ```ts
 * await expect(extensionContext).toHaveDomainRulesCount(1);
 * await expect(page).toHaveToast('success');
 * ```
 */
import { expect, type BrowserContext, type Page } from '@playwright/test';
import { customMatchers, type StatisticName } from './index.js';

expect.extend(customMatchers);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PlaywrightTest {
    interface Matchers<R, T> {
      /** Storage-backed assertion: `chrome.storage.local.domainRules.length`. */
      toHaveDomainRulesCount(
        this: T extends BrowserContext ? Matchers<R, T> : never,
        expected: number,
      ): R;
      /** Storage-backed assertion: `chrome.storage.local.sessions.length`. */
      toHaveSessionsCount(
        this: T extends BrowserContext ? Matchers<R, T> : never,
        expected: number,
      ): R;
      /** Storage-backed assertion: single `statistics` field equality. */
      toHaveStatistic(
        this: T extends BrowserContext ? Matchers<R, T> : never,
        name: StatisticName,
        expected: number,
      ): R;
      /** UI assertion: a Radix `role="dialog"` is visible. */
      toHaveDialogOpen(
        this: T extends Page ? Matchers<R, T> : never,
        name?: string | RegExp,
      ): R;
      /** UI assertion: a Radix Toast of the given variant is visible. */
      toHaveToast(
        this: T extends Page ? Matchers<R, T> : never,
        variant: 'success' | 'error' | 'info',
      ): R;
    }
  }
}

export {};
