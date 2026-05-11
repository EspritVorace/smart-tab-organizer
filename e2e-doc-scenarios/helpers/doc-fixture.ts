/**
 * Playwright fixture for the narrative documentation pipeline.
 *
 * Worker-scoped: launches one Chromium with the extension loaded and the
 * host-resolver mapped to the local mimetic-sites server, so tabs opened by
 * the scenario towards `http://github.com/...`, `http://youtube.com/...` etc.
 * are served from disk and the extension's domain rules match real-looking URLs.
 *
 * Reads `(locale, theme)` from the project's `metadata` (see
 * `playwright.doc.config.ts`); the scenario reuses that metadata so every
 * (locale x theme) variant runs in its own persistent context.
 */
import { test as base, type BrowserContext } from '@playwright/test';
import {
  launchExtension,
  cleanupUserDataDir,
} from '../../e2e-shared/extension-loader.js';
import { getExtensionId } from '../../e2e-shared/extension-id.js';
import { getHostResolverRules } from '../fixtures/sites-server.js';
import type { Locale, Theme } from '../../e2e-shared/routing/types.js';

export interface DocScenarioFixtures {
  extensionContext: BrowserContext;
  extensionId: string;
  docLocale: Locale;
  docTheme: Theme;
}

const LOCALE_LANG: Record<Locale, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
};

interface ProjectMetadata {
  locale?: Locale;
  theme?: Theme;
}

function readProjectMetadata(metadata: unknown): { locale: Locale; theme: Theme } {
  const meta = (metadata ?? {}) as ProjectMetadata;
  if (!meta.locale || !meta.theme) {
    throw new Error(
      'doc-scenarios project metadata must declare both `locale` and `theme` (see playwright.doc.config.ts)',
    );
  }
  return { locale: meta.locale, theme: meta.theme };
}

export const test = base.extend<DocScenarioFixtures>({
  docLocale: [
    async ({}, use, testInfo) => {
      const { locale } = readProjectMetadata(testInfo.project.metadata);
      await use(locale);
    },
    { scope: 'worker' },
  ],

  docTheme: [
    async ({}, use, testInfo) => {
      const { theme } = readProjectMetadata(testInfo.project.metadata);
      await use(theme);
    },
    { scope: 'worker' },
  ],

  extensionContext: [
    async ({}, use, testInfo) => {
      const { locale, theme } = readProjectMetadata(testInfo.project.metadata);
      const lang = LOCALE_LANG[locale];

      const { context, userDataDir } = await launchExtension({
        label: `doc-scenarios-${locale}-${theme}`,
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
