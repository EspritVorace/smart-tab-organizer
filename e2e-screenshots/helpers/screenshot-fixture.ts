/**
 * Playwright fixture for Chrome extension screenshot tests.
 *
 * Provides:
 *   - extensionContext  — worker-scoped BrowserContext with the extension loaded
 *   - extensionId       — extension ID derived from the service worker URL
 *
 * The browser is launched once per locale (Playwright project name).
 * Theme switching is handled inside captureAll() via localStorage.
 */
import {
  test as base,
  chromium,
  type BrowserContext,
} from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXTENSION_PATH = path.resolve(__dirname, '../../.output/chrome-mv3');

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
      const langArg = `--lang=${LOCALE_LANG[locale] ?? 'en-US'}`;

      const userDataDir = path.join(
        os.tmpdir(),
        `playwright-screenshots-${locale}-${Date.now()}`,
      );
      fs.mkdirSync(userDataDir, { recursive: true });

      // Pre-populate Chrome's Preferences with the desired locale.
      // The --lang flag alone is unreliable on Linux for chrome.i18n:
      // Chrome resolves the extension locale from the stored profile preferences
      // rather than the command-line flag when a profile already exists.
      const langCode = LOCALE_LANG[locale] ?? 'en-US';
      const defaultDir = path.join(userDataDir, 'Default');
      fs.mkdirSync(defaultDir, { recursive: true });
      fs.writeFileSync(
        path.join(defaultDir, 'Preferences'),
        JSON.stringify({
          intl: {
            accept_languages: langCode,
            selected_languages: langCode,
          },
        }),
      );

      // Resolve Chromium executable: prefer a "chromium-custom" build (CI),
      // then fall back to any versioned Playwright Chromium already on disk.
      function findChrome(): string | undefined {
        const candidates = [
          // CI / manually pre-installed custom build
          path.join(os.homedir(), '.cache/ms-playwright/chromium-custom/chrome-linux64/chrome'),
          // Playwright 1.58 expected version
          path.join(os.homedir(), '.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'),
          // Older Playwright version that may already be present
          path.join(os.homedir(), '.cache/ms-playwright/chromium-1194/chrome-linux/chrome'),
        ];
        return candidates.find((p) => fs.existsSync(p));
      }
      const executablePath = findChrome();

      const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        executablePath,
        args: [
          `--disable-extensions-except=${EXTENSION_PATH}`,
          `--load-extension=${EXTENSION_PATH}`,
          langArg,
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-popup-blocking',
          '--force-device-scale-factor=1',
        ],
        viewport: { width: 1280, height: 800 },
      });

      // Wait for the extension service worker to register
      const deadline = Date.now() + 10_000;
      while (!context.serviceWorkers()[0] && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!context.serviceWorkers()[0]) {
        throw new Error('Extension service worker did not start within 10 s');
      }

      await use(context);

      await context.close();
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
    },
    { scope: 'worker' },
  ],

  extensionId: [
    async ({ extensionContext }, use) => {
      const sw = extensionContext.serviceWorkers()[0];
      if (!sw) throw new Error('Service worker not available');
      const id = new URL(sw.url()).hostname;
      await use(id);
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
