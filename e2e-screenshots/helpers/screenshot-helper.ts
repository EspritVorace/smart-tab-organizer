/**
 * Core helpers for the Chrome Web Store screenshot generation.
 *
 * captureScreen() — navigate to a section, apply a theme, run an optional
 *                   setup callback, then save a 1280×800 PNG.
 *
 * captureAll()    — loop over the two themes (light / dark) and call
 *                   captureScreen() for each, producing two PNGs per call.
 *                   The locale comes from the Playwright project name.
 *
 * After each capture, screenshots are:
 *   - saved to docs/src/assets/screenshots/ (primary, all screenshots)
 *   - copied to doc/readme/  and  doc/chrome-web-store/  via the routing manifest
 *     declared in `e2e-screenshots/routing.ts`.
 *
 * All PNG files are re-encoded through sharp (in `e2e-shared/sharp-save.ts`)
 * to strip embedded metadata, ensuring stable binary output across runs so
 * that git does not report spurious changes.
 */
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { BrowserContext, Page } from '@playwright/test';
import { savePng } from '../../e2e-shared/sharp-save.js';
import { injectLocaleOverride } from '../../e2e-shared/locale-injector.js';
import { applyTheme, type Theme } from '../../e2e-shared/theme.js';
import { waitForServiceWorker } from '../../e2e-shared/extension-id.js';
import type { Locale } from '../../e2e-shared/routing/types.js';
import { SCREENSHOTS_MANIFEST } from '../routing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Absolute path to the documentation screenshots folder (all screenshots) */
const DOCS_DIR = path.resolve(__dirname, '../../docs/src/assets/screenshots');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Wait for the service worker, retrying up to 5 s.
 * Re-exported for backwards compatibility with fixture seed helpers
 * (`fixtures/rules-seed.ts` etc. import this).
 */
export async function getServiceWorker(context: BrowserContext) {
  return waitForServiceWorker(context, 5_000);
}

/**
 * Open a page, inject locale override, navigate to the target section, apply
 * theme, wait for the app to settle, and run the optional setup callback.
 * Returns the ready Page — the caller is responsible for closing it.
 */
async function preparePage(
  context: BrowserContext,
  extensionId: string,
  section: string,
  theme: Theme,
  locale: string,
  setup?: (page: Page) => Promise<void>,
): Promise<Page> {
  const page = await context.newPage();
  const base = `chrome-extension://${extensionId}`;
  const isPopup = section === 'popup';

  // 1. Inject locale override before first navigation. addInitScript re-runs on
  //    every navigation (including page.reload() below), so React always sees
  //    translated strings.
  await injectLocaleOverride(page, locale);

  // 2. Navigate directly to the target URL (correct origin for localStorage)
  const targetUrl = isPopup
    ? `${base}/popup.html`
    : section
      ? `${base}/options.html#${section}`
      : `${base}/options.html`;
  await page.goto(targetUrl);
  await page.waitForLoadState('domcontentloaded');

  // 3. Set theme via localStorage and reload so next-themes re-reads it.
  //    A simple hash navigation does NOT trigger a full page reload, so
  //    next-themes would keep the stale theme from its initial mount.
  await applyTheme(page, theme);

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
    await page.waitForTimeout(400);
  }

  return page;
}

/**
 * Persist a buffer as `<filename>.png` in the canonical docs directory and
 * fan out to manifest-declared destinations.
 */
async function saveCapture(
  buffer: Buffer,
  filename: string,
  locale: Locale,
  theme: Theme,
): Promise<void> {
  await savePng(buffer, filename, {
    outputDir: DOCS_DIR,
    locale,
    theme,
    manifests: [SCREENSHOTS_MANIFEST],
  });
  console.log(`  ✓ ${filename}.png`);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Capture a single full-viewport screenshot (clipped to 1280×800).
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
  theme: Theme,
  locale: string,
  filename: string,
  setup?: (page: Page) => Promise<void>,
): Promise<void> {
  const page = await preparePage(context, extensionId, section, theme, locale, setup);
  try {
    const buffer = await page.screenshot({
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    });
    await saveCapture(buffer, filename, locale as Locale, theme);
  } finally {
    await page.close();
  }
}

/**
 * Capture a single screenshot cropped to a specific DOM element.
 * The PNG dimensions match the element's bounding box exactly.
 *
 * @param context         - BrowserContext with the extension loaded
 * @param extensionId     - Extension ID (from the service worker URL)
 * @param section         - Options-page section hash (or 'popup')
 * @param theme           - 'light' | 'dark'
 * @param locale          - Playwright project name: 'en' | 'fr' | 'es'
 * @param filename        - Output file name WITHOUT extension
 * @param elementSelector - CSS selector of the element to capture
 * @param setup           - Optional async callback executed after navigation but before capture
 */
export async function captureScreenElement(
  context: BrowserContext,
  extensionId: string,
  section: string,
  theme: Theme,
  locale: string,
  filename: string,
  elementSelector: string,
  setup?: (page: Page) => Promise<void>,
): Promise<void> {
  const page = await preparePage(context, extensionId, section, theme, locale, setup);
  try {
    // Wait for the element to be attached to the DOM, then get its bounding rect
    // via JS rather than via Playwright's visibility check. Playwright's `state: 'visible'`
    // can return false for elements that are visually present but have an ancestor with
    // `overflow: hidden` (e.g. popup.html sets overflow:hidden on #popup-app and
    // .radix-themes to control the popup dimensions).
    await page.locator(elementSelector).waitFor({ state: 'attached', timeout: 15_000 });
    const clip = await page.evaluate((selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    }, elementSelector);
    if (!clip || clip.width === 0 || clip.height === 0) {
      throw new Error(`Element "${elementSelector}" has zero dimensions: ${JSON.stringify(clip)}`);
    }
    const buffer = await page.screenshot({
      clip: {
        x: Math.round(clip.x),
        y: Math.round(clip.y),
        width: Math.round(clip.width),
        height: Math.round(clip.height),
      },
    });
    await saveCapture(buffer, filename, locale as Locale, theme);
  } finally {
    await page.close();
  }
}

/**
 * Loop over the two themes (light / dark) and capture one full-viewport
 * screenshot per theme. Produces filenames like `{locale}-{theme}-{baseName}.png`.
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
  const themes: Theme[] = ['light', 'dark'];
  for (const theme of themes) {
    const filename = `${locale}-${theme}-${baseName}`;
    await captureScreen(context, extensionId, section, theme, locale, filename, setup);
  }
}

/**
 * Loop over the two themes (light / dark) and capture one element-level
 * screenshot per theme. The PNG dimensions match the element's bounding box.
 * Produces filenames like `{locale}-{theme}-{baseName}.png`.
 *
 * @param context         - BrowserContext with the extension loaded
 * @param extensionId     - Extension ID
 * @param locale          - Playwright project name ('en' | 'fr' | 'es')
 * @param section         - Options-page section hash (or 'popup')
 * @param baseName        - Feature name without locale/theme prefix
 * @param elementSelector - CSS selector of the element to capture
 * @param setup           - Optional async callback executed after navigation, before capture
 */
export async function captureAllElement(
  context: BrowserContext,
  extensionId: string,
  locale: string,
  section: string,
  baseName: string,
  elementSelector: string,
  setup?: (page: Page) => Promise<void>,
): Promise<void> {
  const themes: Theme[] = ['light', 'dark'];
  for (const theme of themes) {
    const filename = `${locale}-${theme}-${baseName}`;
    await captureScreenElement(context, extensionId, section, theme, locale, filename, elementSelector, setup);
  }
}
