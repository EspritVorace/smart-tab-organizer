/**
 * Scenario 25 — Chrome Web Store annotated popup overview.
 *
 * Renders a static HTML overlay (assets/store-overlays/popup-overview-{locale}.html)
 * that embeds the popup journey screenshot as its central image, with numbered
 * callout annotations. The PNG is inlined as a base64 data URL so no file
 * server is needed.
 *
 * Light-theme only. It depends on the popup capture produced by
 * `00-main-journey` (capture `popup-with-pinned-and-workspace`, routed to
 * starlight). Numbering as `25` guarantees it runs after `00` in the serial
 * matrix, so the base PNG already exists on disk.
 *
 * Ported from the former `e2e-screenshots/pages/popup-overview.screenshots.ts`.
 */
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { test } from '../helpers/doc-fixture.js';
import { captureStep, startScenario } from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import { STORE_OVERVIEW_MANIFEST } from './25-store-overview.routing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.resolve(__dirname, '../../docs/src/assets/screenshots');
const OVERLAYS_DIR = path.resolve(__dirname, '../assets/store-overlays');

const SCENARIO_ID = '25-store-overview';

test.describe.configure({ mode: 'serial' });

test('store overview slide', async (
  { extensionContext, docLocale: locale, docTheme: theme },
) => {
  // Light-only annotated slide.
  test.skip(theme !== 'light', 'store overview is captured in light theme only');

  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [STORE_OVERVIEW_MANIFEST],
  });

  const htmlPath = path.join(OVERLAYS_DIR, `popup-overview-${locale}.html`);
  let html = fs.readFileSync(htmlPath, 'utf-8');

  const popupPngPath = path.join(
    DOCS_DIR,
    `${locale}-light-journey-popup-with-pinned-and-workspace.png`,
  );
  if (!fs.existsSync(popupPngPath)) {
    throw new Error(
      `Base popup screenshot missing: ${popupPngPath}. ` +
        'Run the 00-main-journey scenario first (it produces and routes ' +
        'popup-with-pinned-and-workspace to starlight).',
    );
  }
  const popupBuffer = fs.readFileSync(popupPngPath);
  const dataUrl = `data:image/png;base64,${popupBuffer.toString('base64')}`;
  html = html.replace(`src="popup-${locale}.png"`, `src="${dataUrl}"`);

  const page = await extensionContext.newPage();
  try {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await captureStep(page, 'popup-store-overview', {
      description: 'Annotated popup overview slide for the Chrome Web Store (1280x800).',
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    });
  } finally {
    await page.close();
  }

  await writeScenarioReadme({
    title: `Store overview - \`${SCENARIO_ID}\` (${locale} x ${theme})`,
    intro:
      'Annotated popup overview slide for the Chrome Web Store listing, composed from the popup journey screenshot.',
  });
});
