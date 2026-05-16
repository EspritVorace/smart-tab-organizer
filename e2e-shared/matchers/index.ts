/**
 * Custom Playwright matchers shared between `tests/e2e/` and
 * `e2e-doc-scenarios/`.
 *
 * The matchers are split into two surfaces:
 *
 * - **Context-scoped matchers** (`toHaveDomainRulesCount`,
 *   `toHaveSessionsCount`, `toHaveStatistic`) read `chrome.storage.local`
 *   through the extension service worker. They poll until the storage
 *   converges (no `waitForTimeout`), which keeps async storage writes
 *   from racing the assertion.
 *
 * - **Page-scoped matchers** (`toHaveDialogOpen`, `toHaveToast`) wrap
 *   `expect(locator).toBeVisible()` so test authors can write
 *   `await expect(page).toHaveToast('success')` instead of locating the
 *   Radix `data-testid` themselves.
 *
 * Matchers are registered globally via `./register.ts`; importing this
 * file directly does NOT activate them.
 */
import { expect, type BrowserContext, type Page } from '@playwright/test';

// Minimal Chrome typings used inside `evaluate` callbacks. The full
// `@types/chrome` is not a dependency of the test bundle, so we only
// model the surface this file needs (storage.local). Declaring the
// global as `any` here keeps the call-sites readable without leaking
// `as any` casts.
declare const chrome: {
  storage: {
    local: {
      get(
        defaults: Record<string, unknown>,
      ): Promise<Record<string, unknown>>;
    };
  };
};

const POLL_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 100;

type MatcherResult = {
  pass: boolean;
  message: () => string;
  name?: string;
  expected?: unknown;
  actual?: unknown;
};

/** Statistic field name allowed by `toHaveStatistic`. */
export type StatisticName = 'tabGroupsCreatedCount' | 'tabsDeduplicatedCount';

/**
 * Resolve the running service worker, retrying briefly when Chrome has
 * idle-terminated it between tests.
 */
async function getServiceWorker(context: BrowserContext) {
  const deadline = Date.now() + 5000;
  let sw = context.serviceWorkers()[0];
  while (!sw && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 100));
    sw = context.serviceWorkers()[0];
  }
  if (!sw) throw new Error('Service worker not available (idle termination?)');
  return sw;
}

async function readDomainRulesCount(context: BrowserContext): Promise<number> {
  const sw = await getServiceWorker(context);
  return sw.evaluate(async () => {
    const result = await chrome.storage.local.get({ domainRules: [] });
    return Array.isArray(result.domainRules) ? result.domainRules.length : 0;
  });
}

async function readSessionsCount(context: BrowserContext): Promise<number> {
  const sw = await getServiceWorker(context);
  return sw.evaluate(async () => {
    const result = await chrome.storage.local.get({ sessions: [] });
    return Array.isArray(result.sessions) ? result.sessions.length : 0;
  });
}

async function readStatistic(
  context: BrowserContext,
  name: StatisticName,
): Promise<number> {
  const sw = await getServiceWorker(context);
  return sw.evaluate(async (field: StatisticName) => {
    const result = await chrome.storage.local.get({
      statistics: { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 0 },
    });
    const stats = (result.statistics ?? {}) as Record<string, number>;
    return Number(stats[field] ?? 0);
  }, name);
}

/**
 * Poll `read` until it returns `expected` or `timeoutMs` elapses. Returns
 * the last observed value, regardless of whether the predicate matched.
 */
async function pollUntilEquals<T>(
  read: () => Promise<T>,
  expected: T,
  timeoutMs: number,
): Promise<{ pass: boolean; lastValue: T }> {
  const deadline = Date.now() + timeoutMs;
  let lastValue = await read();
  if (lastValue === expected) return { pass: true, lastValue };
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    lastValue = await read();
    if (lastValue === expected) return { pass: true, lastValue };
  }
  return { pass: false, lastValue };
}

export const customMatchers = {
  /**
   * Assert that the extension has exactly `expected` domain rules stored
   * in `chrome.storage.local.domainRules`. Polls until the value
   * converges, so it is safe to call right after an import or a UI
   * action that mutates storage asynchronously.
   */
  async toHaveDomainRulesCount(
    context: BrowserContext,
    expected: number,
  ): Promise<MatcherResult> {
    const { pass, lastValue } = await pollUntilEquals(
      () => readDomainRulesCount(context),
      expected,
      POLL_TIMEOUT_MS,
    );
    return {
      pass,
      name: 'toHaveDomainRulesCount',
      expected,
      actual: lastValue,
      message: () =>
        pass
          ? `Expected domainRules count NOT to be ${expected}, but it was.`
          : `Expected domainRules count to be ${expected}, but got ${lastValue}.`,
    };
  },

  /**
   * Assert that `chrome.storage.local.sessions` contains exactly
   * `expected` entries. Polling matches the async write performed by the
   * sessions wizard / snapshot flow.
   */
  async toHaveSessionsCount(
    context: BrowserContext,
    expected: number,
  ): Promise<MatcherResult> {
    const { pass, lastValue } = await pollUntilEquals(
      () => readSessionsCount(context),
      expected,
      POLL_TIMEOUT_MS,
    );
    return {
      pass,
      name: 'toHaveSessionsCount',
      expected,
      actual: lastValue,
      message: () =>
        pass
          ? `Expected sessions count NOT to be ${expected}, but it was.`
          : `Expected sessions count to be ${expected}, but got ${lastValue}.`,
    };
  },

  /**
   * Assert that a single statistic field
   * (`tabGroupsCreatedCount` or `tabsDeduplicatedCount`) matches
   * `expected`. Both fields default to 0 when missing.
   */
  async toHaveStatistic(
    context: BrowserContext,
    name: StatisticName,
    expected: number,
  ): Promise<MatcherResult> {
    const { pass, lastValue } = await pollUntilEquals(
      () => readStatistic(context, name),
      expected,
      POLL_TIMEOUT_MS,
    );
    return {
      pass,
      name: 'toHaveStatistic',
      expected,
      actual: lastValue,
      message: () =>
        pass
          ? `Expected statistic "${name}" NOT to be ${expected}, but it was.`
          : `Expected statistic "${name}" to be ${expected}, but got ${lastValue}.`,
    };
  },

  /**
   * Assert that a Radix dialog (`role="dialog"`) is visible on the page,
   * optionally filtered by accessible name (case-insensitive substring
   * match).
   */
  async toHaveDialogOpen(
    page: Page,
    name?: string | RegExp,
  ): Promise<MatcherResult> {
    const dialogs = name
      ? page.getByRole('dialog', { name })
      : page.getByRole('dialog');
    try {
      await expect(dialogs.first()).toBeVisible({ timeout: POLL_TIMEOUT_MS });
      return {
        pass: true,
        name: 'toHaveDialogOpen',
        expected: name ?? 'any dialog',
        message: () =>
          name
            ? `Expected NO dialog matching ${String(name)} to be visible, but one was.`
            : `Expected NO dialog to be visible, but one was.`,
      };
    } catch {
      return {
        pass: false,
        name: 'toHaveDialogOpen',
        expected: name ?? 'any dialog',
        actual: 'no matching dialog visible',
        message: () =>
          name
            ? `Expected a dialog matching ${String(name)} to be visible, but none was.`
            : `Expected a dialog to be visible, but none was.`,
      };
    }
  },

  /**
   * Assert that a Radix Toast of the requested variant is visible. The
   * Toaster (`src/components/UI/Toaster/Toaster.tsx`) renders
   * `data-testid="toast-${variant}"` so the matcher targets the same
   * locator used in existing specs (`options-toasts.spec.ts`).
   */
  async toHaveToast(
    page: Page,
    variant: 'success' | 'error' | 'info',
  ): Promise<MatcherResult> {
    const toast = page.getByTestId(`toast-${variant}`).first();
    try {
      await expect(toast).toBeVisible({ timeout: POLL_TIMEOUT_MS });
      return {
        pass: true,
        name: 'toHaveToast',
        expected: variant,
        message: () =>
          `Expected NO "${variant}" toast to be visible, but one was.`,
      };
    } catch {
      return {
        pass: false,
        name: 'toHaveToast',
        expected: variant,
        actual: 'not visible',
        message: () =>
          `Expected a "${variant}" toast to be visible, but none was.`,
      };
    }
  },
};
