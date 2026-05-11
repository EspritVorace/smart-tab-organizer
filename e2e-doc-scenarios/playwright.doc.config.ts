/**
 * Playwright config for the narrative documentation pipeline.
 *
 * Phase 2.1 wires the full matrix: 3 locales (en, fr, es) x 2 themes (dark, light).
 * Each project carries its (locale, theme) pair via `metadata`, consumed by the
 * fixture and the scenario; one project => one persistent Chromium context.
 *
 * The local fixtures HTTP server is started in `globalSetup` and stopped in
 * `globalTeardown`, so every scenario can rely on it being available on
 * port 4173.
 */
import { defineConfig } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import type { Locale, Theme } from '../e2e-shared/routing/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionPath = path.resolve(__dirname, '../.output/chrome-mv3');

if (!fs.existsSync(path.join(extensionPath, 'manifest.json'))) {
  console.error(
    'Extension not built. Run "pnpm build" before running doc:scenarios.',
  );
  process.exit(1);
}

const LOCALES: Locale[] = ['en', 'fr', 'es'];
const THEMES: Theme[] = ['dark', 'light'];

export interface DocScenarioProjectMetadata {
  locale: Locale;
  theme: Theme;
}

const projects = LOCALES.flatMap((locale) =>
  THEMES.map((theme) => ({
    name: `${locale}-${theme}`,
    metadata: { locale, theme } satisfies DocScenarioProjectMetadata,
  })),
);

export default defineConfig({
  testDir: './scenarios',
  testMatch: '**/*.scenario.ts',

  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  retries: 0,

  globalSetup: './fixtures/sites-server-setup.ts',
  globalTeardown: './fixtures/sites-server-teardown.ts',

  reporter: [['list']],

  use: {
    viewport: { width: 1280, height: 800 },
  },

  projects,
});
