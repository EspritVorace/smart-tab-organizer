/**
 * Playwright config for the narrative documentation pipeline.
 *
 * Phase 1: only `en × dark` is wired up. The matrix (3 locales × 2 themes)
 * will be expanded once the scenario set stabilises.
 *
 * The local fixtures HTTP server is started in `globalSetup` and stopped in
 * `globalTeardown`, so every scenario can rely on it being available on
 * port 4173.
 */
import { defineConfig } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionPath = path.resolve(__dirname, '../.output/chrome-mv3');

if (!fs.existsSync(path.join(extensionPath, 'manifest.json'))) {
  console.error(
    'Extension not built. Run "pnpm build" before running doc:scenarios.',
  );
  process.exit(1);
}

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

  projects: [{ name: 'en' }],
});
