/**
 * Playwright fixture for the narrative documentation pipeline.
 *
 * Worker-scoped: launches one Chromium with the extension loaded and the
 * host-resolver mapped to the local mimetic-sites server, so tabs opened by
 * the scenario towards `http://github.com/...`, `http://youtube.com/...` etc.
 * are served from disk and the extension's domain rules match real-looking URLs.
 */
import { test as base, type BrowserContext } from '@playwright/test';
import {
  launchExtension,
  cleanupUserDataDir,
} from '../../e2e-shared/extension-loader.js';
import { getExtensionId } from '../../e2e-shared/extension-id.js';
import { getHostResolverRules } from '../fixtures/sites-server.js';

export interface DocScenarioFixtures {
  extensionContext: BrowserContext;
  extensionId: string;
}

const LOCALE_LANG: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
};

export const test = base.extend<DocScenarioFixtures>({
  extensionContext: [
    async ({}, use, testInfo) => {
      const locale = testInfo.project.name;
      const lang = LOCALE_LANG[locale] ?? 'en-US';

      const { context, userDataDir } = await launchExtension({
        label: `doc-scenarios-${locale}`,
        lang,
        deterministicRendering: true,
        viewport: { width: 1280, height: 800 },
        hostResolverRules: getHostResolverRules(),
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
