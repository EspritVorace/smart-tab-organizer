/**
 * Base Playwright fixtures shared by every E2E pipeline.
 *
 * Provides the worker-scoped `extensionContext` (a persistent Chromium with
 * the WXT-built extension loaded) and the resolved `extensionId`. Concrete
 * pipelines extend this base to add their own page-scoped fixtures and
 * helpers:
 *
 * - `tests/e2e/fixtures.ts` adds `extensionPage`, `popupPage`, `optionsPage`
 *   and the `helpers` object used by the functional spec suite.
 * - `e2e-doc-scenarios/helpers/doc-fixture.ts` adds `docLocale`, `docTheme`
 *   and configures the host-resolver for the mimetic-sites fixture server.
 *
 * Centralising the base means a single launch path (and a single set of
 * Chromium args) drives both pipelines: an evolution of the extension's
 * boot behaviour breaks both suites at the same call site.
 */
import { test as base, type BrowserContext } from '@playwright/test';
import {
  launchExtension,
  cleanupUserDataDir,
  type LaunchExtensionOptions,
} from './extension-loader.js';
import { getExtensionId } from './extension-id.js';

// Side-effect import: registers custom matchers on Playwright's `expect`.
// Imported once from the base so both pipelines inherit the extended
// matchers (`toHaveDomainRulesCount`, `toHaveToast`, ...).
import './matchers/register.js';

export interface BaseExtensionFixtures {
  extensionContext: BrowserContext;
  extensionId: string;
}

/**
 * Per-pipeline launch overrides. The fixture base reads these from
 * `testInfo.project.metadata` (key: `extensionLaunch`) so a project can
 * declare host-resolver rules, viewport, etc. without having to redeclare
 * the entire `extensionContext` fixture.
 */
export interface BaseLaunchMetadata {
  /** Maps to {@link LaunchExtensionOptions}. */
  extensionLaunch?: LaunchExtensionOptions;
}

/**
 * Build a Playwright test base wired with the extension launch fixtures.
 *
 * Pipelines call this once and re-extend the returned `test` object with
 * their own fixtures (e.g. `extensionPage`, `docLocale`).
 *
 * `resolveLaunchOptions` lets the caller derive launch options from the
 * project metadata (locale, theme, host resolver, ...) without leaking
 * pipeline-specific knowledge into the base.
 */
export function createExtensionTest(
  resolveLaunchOptions: (testInfo: import('@playwright/test').TestInfo) => LaunchExtensionOptions = () => ({}),
) {
  return base.extend<BaseExtensionFixtures>({
    extensionContext: [
      async ({}, use, testInfo) => {
        const launchOptions = resolveLaunchOptions(testInfo);
        const { context, userDataDir } = await launchExtension(launchOptions);
        await use(context);
        await context.close();
        cleanupUserDataDir(userDataDir);
      },
      { scope: 'worker' },
    ],

    extensionId: [
      async ({ extensionContext }, use) => {
        await use(getExtensionId(extensionContext));
      },
      { scope: 'worker' },
    ],
  });
}
