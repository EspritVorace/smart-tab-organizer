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
 *   - saved to doc/documentation/ (primary, all screenshots)
 *   - copied to doc/readme/       (screenshots used in READMEs)
 *   - copied to doc/chrome-web-store/ (screenshots for the Chrome Web Store)
 *
 * All PNG files are re-encoded through sharp to strip embedded metadata
 * (tIME, tEXt, iTXt…), ensuring stable binary output across runs so that
 * git does not report spurious changes.
 */
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import sharp from 'sharp';
import type { BrowserContext, Page } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Absolute path to the documentation screenshots folder (all screenshots) */
const DOCS_DIR = path.resolve(__dirname, '../../docs/src/assets/screenshots');

/** Absolute path to the readme screenshots folder */
const README_DIR = path.resolve(__dirname, '../../doc/readme');

/** Absolute path to the Chrome Web Store screenshots folder */
const CHROME_STORE_DIR = path.resolve(__dirname, '../../doc/chrome-web-store');

/** Absolute path to the built extension's _locales directory */
const LOCALES_DIR = path.resolve(__dirname, '../../.output/chrome-mv3/_locales');

// ---------------------------------------------------------------------------
// Copy-destination patterns
// ---------------------------------------------------------------------------

/**
 * Screenshots that are referenced in the README files (all 3 locales, dark theme only).
 * Matched against the full filename without extension, e.g. 'en-dark-rules-create-summary'.
 */
const README_PATTERNS: RegExp[] = [
  /^(?:en|fr|es)-dark-rules-create-summary$/,
  /^(?:en|fr|es)-dark-sessions-list$/,
  /^(?:en|fr|es)-dark-sessions-search-deep$/,
  /^(?:en|fr|es)-dark-rules-import-text-conflicts$/,
  /^(?:en|fr|es)-dark-popup-content$/,
];

/**
 * Screenshots to include in the Chrome Web Store listing.
 * Per the store's requirements: 4 specific screens × 3 locales = 12 files.
 */
const CHROME_STORE_PATTERNS: RegExp[] = [
  /^(?:en|fr|es)-dark-rules-bulk-actions$/,
  /^(?:en|fr|es)-dark-sessions-search-deep$/,
  /^(?:en|fr|es)-dark-sessions-restore-conflict$/,
  /^(?:en|fr|es)-light-rules-bulk-actions$/,
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

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

/**
 * Save a PNG buffer to disk, stripping all metadata in the process.
 * sharp re-encodes the PNG without tIME, tEXt, iTXt or other ancillary
 * chunks, producing stable binary output across runs.
 *
 * Copies are also written to readme/ and chrome-web-store/ when the
 * filename matches the corresponding patterns.
 */
async function savePng(buffer: Buffer, filename: string): Promise<void> {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  const filePath = path.join(DOCS_DIR, `${filename}.png`);

  // Re-encode through sharp — metadata is stripped by default (no withMetadata() call)
  await sharp(buffer).png().toFile(filePath);
  console.log(`  ✓ ${filename}.png`);

  // Copy to readme/ if this screenshot is referenced by a README
  if (README_PATTERNS.some((p) => p.test(filename))) {
    fs.mkdirSync(README_DIR, { recursive: true });
    fs.copyFileSync(filePath, path.join(README_DIR, `${filename}.png`));
  }

  // Copy to chrome-web-store/ if this screenshot is for the store listing
  if (CHROME_STORE_PATTERNS.some((p) => p.test(filename))) {
    fs.mkdirSync(CHROME_STORE_DIR, { recursive: true });
    fs.copyFileSync(filePath, path.join(CHROME_STORE_DIR, `${filename}.png`));
  }
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
  theme: 'light' | 'dark',
  locale: string,
  setup?: (page: Page) => Promise<void>,
): Promise<Page> {
  const page = await context.newPage();
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
          const content = placeholder.content.replace(
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
  const targetUrl = isPopup
    ? `${base}/popup.html`
    : section
      ? `${base}/options.html#${section}`
      : `${base}/options.html`;
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

  return page;
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
  theme: 'light' | 'dark',
  locale: string,
  filename: string,
  setup?: (page: Page) => Promise<void>,
): Promise<void> {
  const page = await preparePage(context, extensionId, section, theme, locale, setup);
  try {
    const buffer = await page.screenshot({
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    });
    await savePng(buffer, filename);
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
  theme: 'light' | 'dark',
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
    await savePng(buffer, filename);
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
  const themes: Array<'light' | 'dark'> = ['light', 'dark'];
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
  const themes: Array<'light' | 'dark'> = ['light', 'dark'];
  for (const theme of themes) {
    const filename = `${locale}-${theme}-${baseName}`;
    await captureScreenElement(context, extensionId, section, theme, locale, filename, elementSelector, setup);
  }
}
