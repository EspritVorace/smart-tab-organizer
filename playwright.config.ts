import { defineConfig } from '@playwright/test';
import path from 'path';
import * as fs from 'fs';

// Ensure extension is built before tests run
const extensionPath = '.output/chrome-mv3';
if (!fs.existsSync(path.join(extensionPath, 'manifest.json'))) {
  console.error('Extension not built. Run "npm run build" before running tests.');
  process.exit(1);
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Extensions require sequential execution
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry once locally too
  workers: 1, // Single worker for extension testing
  reporter: 'html',
  timeout: 60000, // Increased timeout for extension loading

  use: {
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        // We'll use a custom fixture for loading the extension
      },
    },
  ],
});
