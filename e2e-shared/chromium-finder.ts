/**
 * Resolves a Chromium executable for Playwright across CI and local environments.
 *
 * Used by every pipeline that launches a persistent context with the WXT-built
 * extension loaded (tests/e2e, e2e-screenshots, e2e-doc-scenarios). Falls back
 * through a list of known install paths and returns undefined if none exist
 * (Playwright then defaults to its bundled Chromium).
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export function findChromium(): string | undefined {
  const candidates = [
    path.join(os.homedir(), '.cache/ms-playwright/chromium-custom/chrome-linux64/chrome'),
    '/opt/pw-browsers/chromium-custom/chrome-linux64/chrome',
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/opt/pw-browsers/chromium-1208/chrome-linux64/chrome',
    '/opt/pw-browsers/chromium-1200/chrome-linux64/chrome',
    path.join(os.homedir(), '.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'),
    path.join(os.homedir(), '.cache/ms-playwright/chromium-1200/chrome-linux64/chrome'),
    path.join(os.homedir(), '.cache/ms-playwright/chromium-1194/chrome-linux/chrome'),
  ];
  return candidates.find((p) => fs.existsSync(p));
}
