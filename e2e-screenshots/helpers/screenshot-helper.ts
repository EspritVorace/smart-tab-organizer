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
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../screenshots');

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
    const firstUrl = isPopup ? `${base}/popup.html` : `${base}/options.html`;

    // 1. Navigate to the extension origin so localStorage is on the right origin
    await page.goto(firstUrl);
    await page.waitForLoadState('domcontentloaded');

    // 2. Set theme via localStorage (next-themes reads 'theme' key on mount)
    await page.evaluate((t) => localStorage.setItem('theme', t), theme);

    // 3. Navigate to the actual target (with section hash)
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

    // 4. Wait for the app to finish loading (useSyncedSettings resolves)
    await page.waitForFunction(
      () => {
        const body = document.body?.textContent ?? '';
        return body.length > 30;
      },
      { timeout: 10_000 },
    );

    // 5. Short stabilisation pause (theme class applied, React committed)
    await page.waitForTimeout(600);

    // 6. Run optional setup callback
    if (setup) {
      await setup(page);
      // Extra pause after interactions
      await page.waitForTimeout(400);
    }

    // 7. Ensure output directory exists
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    // 8. Capture exactly 1280×800
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
