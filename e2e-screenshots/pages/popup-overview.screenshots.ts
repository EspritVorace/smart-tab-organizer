/**
 * Popup overview screenshots for the Chrome Web Store (1 screen × 3 locales = 3 PNGs).
 *
 * Renders a static HTML overlay (store-overlays/popup-overview-{locale}.html)
 * that references the existing popup journey screenshot as its central image.
 * The PNG is inlined as a base64 data URL so no file server is needed.
 */
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { test } from '../helpers/screenshot-fixture.js';
import { savePng } from '../../e2e-shared/sharp-save.js';
import { SCREENSHOTS_MANIFEST } from '../routing.js';
import type { Locale } from '../../e2e-shared/routing/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.resolve(__dirname, '../../docs/src/assets/screenshots');
const OVERLAYS_DIR = path.resolve(__dirname, '../store-overlays');

test.describe('Popup overview store screenshots', () => {
  /**
   * popup-overview
   * Annotated overview of the extension popup, sized 1280×800 for the Chrome
   * Web Store listing. One light-theme variant per locale.
   */
  test('popup-overview', async ({ extensionContext }, testInfo) => {
    const locale = testInfo.project.name as Locale;

    const htmlPath = path.join(OVERLAYS_DIR, `popup-overview-${locale}.html`);
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const popupPngPath = path.join(
      DOCS_DIR,
      `${locale}-light-journey-popup-with-pinned-and-workspace.png`,
    );
    const popupBuffer = fs.readFileSync(popupPngPath);
    const dataUrl = `data:image/png;base64,${popupBuffer.toString('base64')}`;

    html = html.replace(`src="popup-${locale}.png"`, `src="${dataUrl}"`);

    const page = await extensionContext.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);

      const buffer = await page.screenshot({
        clip: { x: 0, y: 0, width: 1280, height: 800 },
      });

      const filename = `${locale}-light-popup-overview`;
      await savePng(buffer, filename, {
        outputDir: DOCS_DIR,
        locale,
        theme: 'light',
        manifests: [SCREENSHOTS_MANIFEST],
        capture: 'popup-overview',
      });
      console.log(`  ✓ ${filename}.png`);
    } finally {
      await page.close();
    }
  });
});
