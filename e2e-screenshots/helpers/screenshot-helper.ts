/**
 * Core helpers for the Chrome Web Store screenshot generation.
 *
 * captureScreen() — navigate to a section, apply a theme, run an optional
 *                   setup callback, then save a 1280×800 PNG.
 *
 * captureAll()    — loop over the two themes (light / dark) and call
 *                   captureScreen() for each, producing two PNGs per call.
 *                   The locale comes from the Playwright project name.
 */
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import type { BrowserContext, Page } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Absolute path to the screenshots output folder at the repo root */
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../doc/assets');

/** Absolute path to the built extension's _locales directory */
const LOCALES_DIR = path.resolve(__dirname, '../../.output/chrome-mv3/_locales');

type MessageEntry = {
  message: string;
  placeholders?: Record<string, { content: string }>;
};

/**
 * Load messages.json for a locale, or null for 'en' (Chrome's default).
 * These messages are injected via addInitScript to override chrome.i18n.getMessage,
 * because the Playwright Chromium binary on Linux ignores --lang and always
 * reports en-US from chrome.i18n.getUILanguage().
 */
function loadLocaleMessages(locale: string): Record<string, MessageEntry> | null {
  if (locale === 'en') return null;
  const filePath = path.join(LOCALES_DIR, locale, 'messages.json');
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, MessageEntry>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Wait for the service worker, retrying up to 5 s */
export async function getServiceWorker(context: BrowserContext) {
  let sw = context.serviceWorkers()[0];
  if (sw) return sw;
  const deadline = Date.now() + 5_000;
  while (!sw && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 200));
    sw = context.serviceWorkers()[0];
  }
  if (!sw) throw new Error('Service worker not found');
  return sw;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Capture a single screenshot.
 *
 * @param context     - BrowserContext with the extension loaded
 * @param extensionId - Extension ID (from the service worker URL)
 * @param section     - Options-page section hash, e.g. 'rules', 'sessions', 'settings',
 *                      'importexport', or 'popup' (opens popup.html instead)
 * @param theme       - 'light' | 'dark'
 * @param locale      - Playwright project name: 'en' | 'fr' | 'es'
 * @param filename    - Output file name WITHOUT extension, e.g. 'en-dark-rules-list'
 * @param setup       - Optional async callback executed after navigation but before capture
 */
export async function captureScreen(
  context: BrowserContext,
  extensionId: string,
  section: string,
  theme: 'light' | 'dark',
  locale: string,
  filename: string,
  setup?: (page: Page) => Promise<void>,
): Promise<void> {
  const page = await context.newPage();
  try {
    const base = `chrome-extension://${extensionId}`;
    const isPopup = section === 'popup';

    // 1. Inject locale override before first navigation.
    //    The Playwright Chromium binary on Linux ignores --lang and always uses en-US
    //    for chrome.i18n, so we override getMessage() directly in the page context.
    //    addInitScript re-runs on every navigation (including page.reload() below),
    //    ensuring React always receives translated strings on mount.
    const messages = loadLocaleMessages(locale);
    if (messages) {
      await page.addInitScript((msgs: Record<string, MessageEntry>) => {
        const orig = chrome.i18n.getMessage.bind(chrome.i18n);
        chrome.i18n.getMessage = function (
          messageId: string,
          substitutions?: string | string[],
        ): string {
          const entry = msgs[messageId];
          if (!entry) return orig(messageId, substitutions);

          let msg = entry.message;
          if (!entry.placeholders) return msg;

          const subs = substitutions
            ? Array.isArray(substitutions)
              ? substitutions
              : [substitutions]
            : [];

          for (const [name, placeholder] of Object.entries(entry.placeholders)) {
            // Resolve positional references ($1, $2…) inside the placeholder content
            let content = placeholder.content.replace(
              /\$(\d+)/g,
              (_, n: string) => subs[parseInt(n, 10) - 1] ?? '',
            );
            // Replace $PLACEHOLDER_NAME$ in the message (case-insensitive)
            msg = msg.replace(new RegExp(`\\$${name}\\$`, 'gi'), content);
          }

          return msg;
        };
      }, messages as Parameters<typeof page.addInitScript>[1]);
    }

    // 2. Navigate directly to the target URL (correct origin for localStorage)
    let targetUrl: string;
    if (isPopup) {
      targetUrl = `${base}/popup.html`;
    } else {
      targetUrl = section
        ? `${base}/options.html#${section}`
        : `${base}/options.html`;
    }
    await page.goto(targetUrl);
    await page.waitForLoadState('domcontentloaded');

    // 3. Set theme via localStorage (next-themes reads 'theme' key on mount)
    await page.evaluate((t) => localStorage.setItem('theme', t), theme);

    // 4. Reload so next-themes re-reads localStorage and applies the correct theme.
    //    A simple hash navigation (e.g. options.html → options.html#rules) does NOT
    //    trigger a full page reload, so next-themes would keep the stale theme from
    //    its initial mount. page.reload() forces a clean remount at the target URL.
    //    The addInitScript locale override also re-runs on this reload.
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // 5. Wait for the app to finish loading (useSyncedSettings resolves)
    await page.waitForFunction(
      () => {
        const body = document.body?.textContent ?? '';
        return body.length > 30;
      },
      { timeout: 10_000 },
    );

    // 6. Short stabilisation pause (theme class applied, React committed)
    await page.waitForTimeout(600);

    // 7. Run optional setup callback
    if (setup) {
      await setup(page);
      // Extra pause after interactions
      await page.waitForTimeout(400);
    }

    // 8. Ensure output directory exists
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    // 9. Capture exactly 1280×800
    const filePath = path.join(SCREENSHOTS_DIR, `${filename}.png`);
    await page.screenshot({
      path: filePath,
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    });

    console.log(`  ✓ ${filename}.png`);
  } finally {
    await page.close();
  }
}

/**
 * Loop over the two themes (light / dark) and capture one screenshot per theme.
 * Produces filenames like `{locale}-{theme}-{baseName}.png`.
 *
 * @param context     - BrowserContext with the extension loaded
 * @param extensionId - Extension ID
 * @param locale      - Playwright project name ('en' | 'fr' | 'es')
 * @param section     - Options-page section hash (or 'popup')
 * @param baseName    - Feature name without locale/theme prefix, e.g. 'rules-list'
 * @param setup       - Optional async callback executed after navigation, before capture
 */
export async function captureAll(
  context: BrowserContext,
  extensionId: string,
  locale: string,
  section: string,
  baseName: string,
  setup?: (page: Page) => Promise<void>,
): Promise<void> {
  const themes: Array<'light' | 'dark'> = ['light', 'dark'];
  for (const theme of themes) {
    const filename = `${locale}-${theme}-${baseName}`;
    await captureScreen(context, extensionId, section, theme, locale, filename, setup);
  }
}
