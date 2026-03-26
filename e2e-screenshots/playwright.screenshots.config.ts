import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionPath = path.resolve(__dirname, '../.output/chrome-mv3');

if (!fs.existsSync(path.join(extensionPath, 'manifest.json'))) {
  console.error(
    'Extension not built. Run "pnpm build" before running screenshots.',
  );
  process.exit(1);
}

export default defineConfig({
  // testDir is relative to this config file
  testDir: './pages',

  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  retries: 0,

  reporter: [['list']],

  use: {
    viewport: { width: 1280, height: 800 },
  },

  // One project per locale — each launches Chrome with the matching --lang flag.
  // captureAll() iterates the two themes (light/dark) per test run.
  projects: [
    { name: 'en' },
    { name: 'fr' },
    { name: 'es' },
  ],
});
