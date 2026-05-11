/**
 * Playwright fixture for Chrome extension screenshot tests.
 *
 * Provides:
 *   - extensionContext  — worker-scoped BrowserContext with the extension loaded
 *   - extensionId       — extension ID derived from the service worker URL
 *
 * The browser is launched once per locale (Playwright project name).
 * Theme switching is handled inside captureAll() via localStorage.
 *
 * Backed by the shared launcher in `e2e-shared/extension-loader.ts`.
 */
import { test as base, type BrowserContext } from '@playwright/test';
import {
  launchExtension,
  cleanupUserDataDir,
} from '../../e2e-shared/extension-loader.js';
import { getExtensionId } from '../../e2e-shared/extension-id.js';

/** Maps Playwright project name → Chrome --lang value */
const LOCALE_LANG: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
};

export interface ScreenshotFixtures {
  /** BrowserContext with the extension loaded (worker-scoped) */
  extensionContext: BrowserContext;
  /** Chrome extension ID from the service worker URL */
  extensionId: string;
}

export const test = base.extend<ScreenshotFixtures>({
  extensionContext: [
    async ({}, use, testInfo) => {
      const locale = testInfo.project.name;
      const lang = LOCALE_LANG[locale] ?? 'en-US';

      const { context, userDataDir } = await launchExtension({
        label: `screenshots-${locale}`,
        lang,
        deterministicRendering: true,
        viewport: { width: 1280, height: 800 },
      });

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

export { expect } from '@playwright/test';
